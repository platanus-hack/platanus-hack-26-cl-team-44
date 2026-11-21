import Foundation
import Network

/// Servidor WebSocket en el iPhone (puerto fijo 8788) anunciado por Bonjour.
/// El Mac se conecta directo desde el navegador: ws://<ip-del-iphone>:8788
///
/// Contrapresión: si un cliente tiene más de 2 cuadros sin confirmar (Wi-Fi lento),
/// se descartan cuadros nuevos para él en vez de acumular latencia y memoria.
final class GazeServer {
    static let port: UInt16 = 8788
    static let serviceType = "_soygaze._tcp"
    private static let maxInFlight = 2
    private static let maxClients = 3
    private static let maxMessageBytes = 1024
    private static let initialRestartDelay: TimeInterval = 1
    private static let maxRestartDelay: TimeInterval = 8
    /// Código DNS-SD de "Red local" denegada (kDNSServiceErr_PolicyDenied).
    private static let policyDenied: Int32 = -65_570

    private let queue = DispatchQueue(label: "soygaze.net", qos: .userInteractive)
    private var listener: NWListener?
    private var clients: [ObjectIdentifier: Client] = [:]
    private var restartWorkItem: DispatchWorkItem?
    private var restartDelay = GazeServer.initialRestartDelay
    /// Contexto reutilizado: evita crear Metadata/ContentContext por cuadro y cliente.
    private let frameContext = NWConnection.ContentContext(
        identifier: "frame", metadata: [NWProtocolWebSocket.Metadata(opcode: .binary)])
    private let textContext = NWConnection.ContentContext(
        identifier: "text", metadata: [NWProtocolWebSocket.Metadata(opcode: .text)])

    /// Se asignan una sola vez antes de `start()` y se llaman en `queue`.
    var onClientCount: ((Int) -> Void)?
    var onState: ((String) -> Void)?
    var onCommand: ((String) -> Void)?

    private final class Client {
        let connection: NWConnection
        var inFlight = 0
        var isReady = false
        init(_ connection: NWConnection) { self.connection = connection }
    }

    func start() {
        queue.async { [weak self] in self?.startListener() }
    }

    func stop() {
        queue.async { [weak self] in
            guard let self else { return }
            self.restartWorkItem?.cancel()
            self.restartWorkItem = nil
            self.listener?.stateUpdateHandler = nil
            self.listener?.cancel()
            self.listener = nil
            for client in self.clients.values {
                client.connection.stateUpdateHandler = nil
                client.connection.cancel()
            }
            self.clients.removeAll()
            self.restartDelay = Self.initialRestartDelay
            self.onClientCount?(0)
        }
    }

    /// Envía un cuadro a todos los clientes listos. Llamable desde cualquier hilo.
    func broadcast(_ data: Data) {
        queue.async { [weak self] in
            guard let self, !self.clients.isEmpty else { return }
            for client in self.clients.values where client.isReady {
                // Contrapresión: con 2 cuadros sin confirmar se descarta en vez de acumular latencia.
                guard client.inFlight < Self.maxInFlight else { continue }
                client.inFlight += 1
                // La confirmación llega en `queue` (la cola con la que arrancó la conexión).
                client.connection.send(content: data, contentContext: self.frameContext, isComplete: true,
                                       completion: .contentProcessed { [client] _ in
                    client.inFlight = max(0, client.inFlight - 1)
                })
            }
        }
    }

    // MARK: - Privado (cola `queue`)

    private func startListener() {
        guard listener == nil else { return }
        do {
            let parameters = NWParameters.tcp
            if let tcp = parameters.defaultProtocolStack.transportProtocol as? NWProtocolTCP.Options {
                tcp.noDelay = true // sin Nagle: latencia mínima para paquetes pequeños
                // Detecta un Mac que desapareció (Wi-Fi caído, tapa cerrada) en ~15 s:
                // si no, el cliente fantasma mantiene ARKit a 60 fps para nadie.
                tcp.enableKeepalive = true
                tcp.keepaliveIdle = 5
                tcp.keepaliveInterval = 3
                tcp.keepaliveCount = 3
            }
            let ws = NWProtocolWebSocket.Options()
            ws.autoReplyPing = true
            ws.maximumMessageSize = Self.maxMessageBytes
            parameters.defaultProtocolStack.applicationProtocols.insert(ws, at: 0)
            parameters.allowLocalEndpointReuse = true
            // Sin AWDL: el Mac se conecta por IP en la LAN; peer-to-peer solo añade jitter y consumo.
            parameters.includePeerToPeer = false
            parameters.serviceClass = .interactiveVideo // prioridad WMM baja latencia

            guard let port = NWEndpoint.Port(rawValue: Self.port) else { return }
            let listener = try NWListener(using: parameters, on: port)
            listener.service = NWListener.Service(name: "Soy Gaze", type: Self.serviceType)
            // Se compara por identidad: un callback tardío de un listener viejo no debe tocar el nuevo.
            listener.stateUpdateHandler = { [weak self, weak listener] state in
                guard let self, let listener else { return }
                self.handle(listenerState: state, from: listener)
            }
            listener.newConnectionHandler = { [weak self] connection in self?.accept(connection) }
            self.listener = listener
            listener.start(queue: queue)
        } catch {
            onState?("No se pudo abrir el puerto \(Self.port): \(error.localizedDescription). Reintentando…")
            scheduleRestart()
        }
    }

    private func handle(listenerState: NWListener.State, from source: NWListener) {
        guard source === listener else { return }
        switch listenerState {
        case .ready:
            restartDelay = Self.initialRestartDelay
            onState?("Listo en el puerto \(Self.port)")
        case .waiting(let error):
            if case .dns(let code) = error, code == Self.policyDenied {
                onState?("Falta el permiso de Red local. Actívalo en Ajustes › Soy Gaze › Red local.")
            } else {
                onState?("Esperando red: \(error.localizedDescription).")
            }
        case .failed(let error):
            // Típico: puerto ocupado por una instancia anterior que aún no se liberó.
            onState?("Servidor caído: \(error.localizedDescription). Reintentando…")
            source.stateUpdateHandler = nil
            source.cancel()
            listener = nil
            scheduleRestart()
        default:
            break
        }
    }

    private func scheduleRestart() {
        restartWorkItem?.cancel()
        let item = DispatchWorkItem { [weak self] in self?.startListener() }
        restartWorkItem = item
        queue.asyncAfter(deadline: .now() + restartDelay, execute: item)
        restartDelay = min(restartDelay * 2, Self.maxRestartDelay)
    }

    private func accept(_ connection: NWConnection) {
        guard clients.count < Self.maxClients else {
            connection.cancel()
            return
        }
        let client = Client(connection)
        let id = ObjectIdentifier(connection)
        clients[id] = client
        connection.stateUpdateHandler = { [weak self, weak client] state in
            guard let self, let client else { return }
            switch state {
            case .ready:
                client.isReady = true
            case .failed, .cancelled:
                // ObjectIdentifier puede reutilizarse: solo borramos si sigue siendo ESTE cliente.
                if self.clients[id] === client {
                    self.clients.removeValue(forKey: id)
                    self.onClientCount?(self.clients.count)
                }
                connection.stateUpdateHandler = nil
            default:
                break
            }
        }
        connection.start(queue: queue)
        onClientCount?(clients.count)
        receive(on: connection)
    }

    /// Mensajes de texto del Mac: "ping:<n>" → "pong:<n>" (latencia), u órdenes ("fps:30").
    private func receive(on connection: NWConnection) {
        connection.receiveMessage { [weak self] data, _, _, error in
            guard let self else { return }
            if error != nil {
                connection.cancel()
                return
            }
            if let data, data.count < 64, let text = String(data: data, encoding: .utf8) {
                if text.hasPrefix("ping:") {
                    self.sendText("pong:" + text.dropFirst(5), on: connection)
                } else {
                    self.onCommand?(text)
                }
            }
            self.receive(on: connection)
        }
    }

    private func sendText(_ text: String, on connection: NWConnection) {
        connection.send(content: Data(text.utf8), contentContext: textContext, isComplete: true, completion: .idempotent)
    }
}

/// Direcciones IPv4 locales (Wi-Fi y hotspot/USB) para mostrar en pantalla.
enum LocalAddress {
    static func ipv4() -> [String] {
        var result: [String] = []
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        guard getifaddrs(&ifaddr) == 0, let first = ifaddr else { return result }
        defer { freeifaddrs(ifaddr) }
        for ptr in sequence(first: first, next: { $0.pointee.ifa_next }) {
            let ifa = ptr.pointee
            guard let addr = ifa.ifa_addr, addr.pointee.sa_family == UInt8(AF_INET) else { continue }
            let name = String(cString: ifa.ifa_name)
            guard name.hasPrefix("en") || name.hasPrefix("bridge") else { continue }
            var host = [CChar](repeating: 0, count: Int(NI_MAXHOST))
            if getnameinfo(addr, socklen_t(addr.pointee.sa_len), &host, socklen_t(host.count), nil, 0, NI_NUMERICHOST) == 0 {
                let ip = String(cString: host)
                if !ip.hasPrefix("169.254") { result.append(ip) }
            }
        }
        return result
    }
}
