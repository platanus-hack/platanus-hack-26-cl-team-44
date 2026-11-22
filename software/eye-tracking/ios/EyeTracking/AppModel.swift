import ARKit
import CoreMotion
import SwiftUI
import UIKit

/// Orquesta sensor, servidor, térmica, movimiento y brillo. Vive en el hilo principal;
/// el trabajo pesado corre en las colas propias de GazeSensor y GazeServer.
@MainActor
final class AppModel: ObservableObject {
    @Published private(set) var sensorState: SensorState = .idle
    @Published private(set) var stats = SensorStats()
    @Published private(set) var clientCount = 0
    @Published private(set) var serverStatus = "Iniciando…"
    @Published private(set) var addresses: [String] = []
    @Published private(set) var thermalNote: String?
    @Published private(set) var isDimmed = false

    private let sensor = GazeSensor()
    private let server = GazeServer()
    private let motion = CMMotionManager()
    private let motionQueue = OperationQueue()
    private var frameRate = FrameRatePolicy()
    /// fps con los que corre ARKit ahora (0 = pausado). Evita reiniciar la cámara sin necesidad.
    private var appliedFPS = 0
    private var idleTask: Task<Void, Never>?
    private var isIdleThrottled = true
    private static let idleGrace: Duration = .seconds(20)
    private static let dimmedBrightness: CGFloat = 0.05
    private static let savedBrightnessKey = "eyetracking.savedBrightness"
    private var savedBrightness: CGFloat?
    private var dimTask: Task<Void, Never>?
    private var batteryTimer: Timer?
    private var thermalObserver: NSObjectProtocol?
    private var isRunning = false

    init() {
        // Si la app murió con la pantalla atenuada, el brillo del sistema quedaría en 5 %.
        if let leftover = UserDefaults.standard.object(forKey: Self.savedBrightnessKey) as? Double {
            UIScreen.main.brightness = CGFloat(leftover)
            UserDefaults.standard.removeObject(forKey: Self.savedBrightnessKey)
        }
        motionQueue.maxConcurrentOperationCount = 1
        wireCallbacks()
        thermalObserver = NotificationCenter.default.addObserver(
            forName: ProcessInfo.thermalStateDidChangeNotification, object: nil, queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.applyThermalPolicy() }
        }
    }

    // MARK: - Ciclo de vida

    func handle(phase: ScenePhase) {
        switch phase {
        case .active: start()
        case .background: stop()
        default: break
        }
    }

    func start() {
        guard !isRunning else { return }
        guard GazeSensor.isSupported else {
            sensorState = .unsupported
            return
        }
        isRunning = true
        isIdleThrottled = true
        UIApplication.shared.isIdleTimerDisabled = true // si se bloquea, ARKit se detiene
        UIDevice.current.isBatteryMonitoringEnabled = true
        addresses = LocalAddress.ipv4()
        server.start()
        startMotion()
        startBatteryUpdates()
        applyThermalPolicy()
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
        idleTask?.cancel()
        appliedFPS = 0
        sensor.pause()
        server.stop()
        sensor.hasClients.set(false)
        clientCount = 0
        motion.stopDeviceMotionUpdates()
        batteryTimer?.invalidate()
        batteryTimer = nil
        UIDevice.current.isBatteryMonitoringEnabled = false
        restoreBrightness()
        UIApplication.shared.isIdleTimerDisabled = false
    }

    func refreshAddresses() { addresses = LocalAddress.ipv4() }

    // MARK: - Brillo (menos reflejo en los ojos y menos calor)

    func wake() {
        restoreBrightness()
        scheduleDim()
    }

    private func scheduleDim() {
        dimTask?.cancel()
        guard clientCount > 0 else { return }
        dimTask = Task { [weak self] in
            try? await Task.sleep(for: .seconds(8))
            guard !Task.isCancelled else { return }
            self?.dim()
        }
    }

    private func dim() {
        guard !isDimmed, clientCount > 0 else { return }
        let current = UIScreen.main.brightness
        guard current > Self.dimmedBrightness else { return }
        savedBrightness = current
        UserDefaults.standard.set(Double(current), forKey: Self.savedBrightnessKey)
        UIScreen.main.brightness = Self.dimmedBrightness
        isDimmed = true
    }

    private func restoreBrightness() {
        dimTask?.cancel()
        if let saved = savedBrightness {
            UIScreen.main.brightness = saved
            savedBrightness = nil
            UserDefaults.standard.removeObject(forKey: Self.savedBrightnessKey)
        }
        isDimmed = false
    }

    // MARK: - Térmica y fps: 60 → 30 → pausa

    private func applyThermalPolicy() {
        let state = ProcessInfo.processInfo.thermalState
        sensor.thermal.set(Float(state.rawValue))
        frameRate.updateThermalState(state)
        thermalNote = frameRate.thermalNote
        reconcileSensor()
    }

    /// Única puerta para (re)configurar ARKit: solo actúa si el fps efectivo cambió.
    /// Sin Mac conectado corre a 30 fps (solo sirve para ubicar el iPhone) y se enfría más.
    private func reconcileSensor() {
        guard isRunning else { return }
        let fps = frameRate.effectiveFPS(isIdleThrottled: isIdleThrottled)
        guard fps != appliedFPS else { return }
        appliedFPS = fps
        if fps == 0 { sensor.pause() } else { sensor.run(fps: fps) }
    }

    // MARK: - Sensores auxiliares

    private func startMotion() {
        guard motion.isDeviceMotionAvailable else { return }
        motion.deviceMotionUpdateInterval = 0.1 // 10 Hz basta para detectar que movieron el iPhone
        let gravity = sensor.gravity
        motion.startDeviceMotionUpdates(to: motionQueue) { data, _ in
            guard let g = data?.gravity else { return }
            gravity.set(SIMD3<Float>(Float(g.x), Float(g.y), Float(g.z)))
        }
    }

    private func startBatteryUpdates() {
        let battery = sensor.battery
        battery.set(UIDevice.current.batteryLevel)
        batteryTimer?.invalidate()
        let timer = Timer(timeInterval: 30, repeats: true) { _ in
            Task { @MainActor in battery.set(UIDevice.current.batteryLevel) }
        }
        timer.tolerance = 10 // permite agrupar despertares
        RunLoop.main.add(timer, forMode: .common)
        batteryTimer = timer
    }

    // MARK: - Cableado

    private func wireCallbacks() {
        let server = self.server
        let hasClients = sensor.hasClients
        sensor.onPacket = { data in server.broadcast(data) } // el sensor ya omite el trabajo sin clientes
        sensor.onStats = { [weak self] stats in
            Task { @MainActor in self?.stats = stats }
        }
        sensor.onState = { [weak self] state in
            Task { @MainActor in self?.sensorState = state }
        }
        server.onClientCount = { [weak self] count in
            hasClients.set(count > 0)
            Task { @MainActor in
                guard let self else { return }
                self.clientCount = count
                self.setIdleThrottle(count == 0)
                if count > 0 { self.scheduleDim() } else { self.restoreBrightness() }
            }
        }
        server.onState = { [weak self] status in
            Task { @MainActor in
                self?.serverStatus = status
                self?.refreshAddresses()
            }
        }
        server.onCommand = { [weak self] command in
            Task { @MainActor in self?.handle(command: command) }
        }
    }

    /// Con clientes: fps completos al instante. Sin clientes: baja tras un periodo de gracia
    /// (un corte breve de Wi-Fi no debe reiniciar la cámara).
    private func setIdleThrottle(_ idle: Bool) {
        idleTask?.cancel()
        if !idle {
            isIdleThrottled = false
            reconcileSensor()
            return
        }
        idleTask = Task { [weak self] in
            try? await Task.sleep(for: Self.idleGrace)
            guard !Task.isCancelled, let self else { return }
            self.isIdleThrottled = true
            self.reconcileSensor()
        }
    }

    private func handle(command: String) {
        guard command.hasPrefix("fps:"), let fps = Int(command.dropFirst(4)), frameRate.request(fps) else { return }
        reconcileSensor()
    }
}
