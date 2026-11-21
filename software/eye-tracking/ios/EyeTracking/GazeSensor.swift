import ARKit
import simd

/// Lee ARKit Face Tracking (TrueDepth + cámara frontal) y produce paquetes binarios.
///
/// Rendimiento / temperatura:
/// - Sin ARSCNView ni render: ARKit corre "a ciegas" y no se dibuja nada.
/// - Todo ocurre en una cola dedicada; el hilo principal no se toca por cuadro.
/// - Nunca se retiene un ARFrame (retenerlos agota el pool de cámara y congela ARKit).
/// - El paquete se arma en un buffer reutilizado (sin asignaciones por cuadro salvo el Data final).
/// - Sin clientes conectados no se codifica nada (solo se miden fps/distancia para la UI).
/// - Sin cara, los paquetes se limitan a ~20 Hz: no aportan información nueva.
final class GazeSensor: NSObject, ARSessionDelegate {
    private let session = ARSession()
    private let queue = DispatchQueue(label: "eyetracking.ar", qos: .userInteractive)

    // Solo se tocan en `queue`.
    private var builder = PacketBuilder()
    private var seq: UInt32 = 0
    private var fpsWindowStart: TimeInterval = 0
    private var fpsCount = 0
    private var measuredFPS: Double = 0
    private var lastStatsEmit: TimeInterval = 0
    private var lastTimestamp: TimeInterval = 0
    private var timeBase: TimeInterval?
    private var lastUntrackedSend: TimeInterval = 0
    private var retryCount = 0
    // Rescate: si ARKit se queda sin cara mucho rato aunque la persona siga ahí, reiniciamos la detección.
    private var untrackedSince: TimeInterval?
    private var lastRescue: TimeInterval = 0
    private var rescues: UInt32 = 0
    private static let rescueAfter: TimeInterval = 2.5
    private static let rescueCooldown: TimeInterval = 6

    /// Cuadros sin cara: 20 Hz bastan para avisar de la pérdida de seguimiento.
    private static let untrackedInterval: TimeInterval = 0.05
    /// Float32 tiene 24 bits de mantisa: con t < 16384 s la resolución es < 2 ms.
    private static let timestampWrap: TimeInterval = 16_384
    private static let maxRetries = 5

    // Escritas desde otros hilos.
    let gravity = LockedBox(SIMD3<Float>(repeating: 0))
    let battery = LockedBox<Float>(-1)
    let thermal = LockedBox<Float>(0)
    private let configuredFPS = LockedBox<Float>(0)
    private let wantsRunning = LockedBox(false)
    /// El AppModel lo activa cuando hay al menos un Mac conectado.
    let hasClients = LockedBox(false)

    /// Se llaman en la cola de ARKit. Deben ser rápidos.
    var onPacket: ((Data) -> Void)?
    var onStats: ((SensorStats) -> Void)?
    var onState: ((SensorState) -> Void)?

    static var isSupported: Bool { ARFaceTrackingConfiguration.isSupported }

    override init() {
        super.init()
        session.delegate = self
        session.delegateQueue = queue
    }

    /// Arranca o reconfigura sin perder el seguimiento.
    func run(fps: Int, reset: Bool = false) {
        guard Self.isSupported else {
            onState?(.unsupported)
            return
        }
        wantsRunning.set(true)
        let config = ARFaceTrackingConfiguration()
        config.maximumNumberOfTrackedFaces = 1
        // La guía de ubicación del Mac usa la luz ambiente ("enciende una lámpara").
        // En face tracking es un escalar por cuadro: costo despreciable frente al valor.
        config.isLightEstimationEnabled = true
        config.isWorldTrackingEnabled = false
        if let format = Self.videoFormat(for: fps) {
            config.videoFormat = format
        }
        configuredFPS.set(Float(config.videoFormat.framesPerSecond))
        session.run(config, options: reset ? [.resetTracking, .removeExistingAnchors] : [])
        onState?(.running)
        log.info("ARKit corriendo a \(config.videoFormat.framesPerSecond) fps, \(Int(config.videoFormat.imageResolution.width))x\(Int(config.videoFormat.imageResolution.height))")
    }

    func pause() {
        wantsRunning.set(false)
        session.pause()
        onState?(.idle)
    }

    /// El formato más cercano a 1280×720 con los fps pedidos:
    /// detalle suficiente del ojo sin el costo térmico de resoluciones mayores.
    static func videoFormat(for fps: Int) -> ARConfiguration.VideoFormat? {
        let formats = ARFaceTrackingConfiguration.supportedVideoFormats
        let matching = formats.filter { $0.framesPerSecond == fps }
        let pool = matching.isEmpty ? formats : matching
        return pool.min { abs($0.imageResolution.width - 1280) < abs($1.imageResolution.width - 1280) }
    }

    // MARK: - ARSessionDelegate (cola `queue`)

    func session(_ session: ARSession, didUpdate frame: ARFrame) {
        // El pool evita que los NSNumber/NSDictionary de blendShapes se acumulen entre cuadros.
        autoreleasepool {
            // Extraemos lo necesario y soltamos el frame de inmediato (nunca se retiene).
            let timestamp = frame.timestamp
            guard timestamp > lastTimestamp else { return } // cuadro repetido o fuera de orden
            lastTimestamp = timestamp
            retryCount = 0
            // ARKit puede conservar un ancla vieja sin seguimiento junto a una nueva que sí sigue la cara:
            // preferimos SIEMPRE la que está siendo seguida (antes se tomaba la primera, a veces la vieja).
            let faces = frame.anchors.compactMap { $0 as? ARFaceAnchor }
            let face = faces.first(where: { $0.isTracked }) ?? faces.first
            watchForStuckTracking(isTracked: face?.isTracked ?? false, timestamp: timestamp)
            let ambient = Float(frame.lightEstimate?.ambientIntensity ?? 0)
            encode(face: face, cameraTransform: frame.camera.transform, timestamp: timestamp, ambient: ambient)
        }
    }

    /// Si no hay cara durante `rescueAfter` s, reinicia la detección (máx. una vez cada `rescueCooldown` s).
    private func watchForStuckTracking(isTracked: Bool, timestamp: TimeInterval) {
        if isTracked {
            untrackedSince = nil
            return
        }
        let since = untrackedSince ?? timestamp
        untrackedSince = since
        guard timestamp - since >= Self.rescueAfter, timestamp - lastRescue >= Self.rescueCooldown, wantsRunning.get() else { return }
        lastRescue = timestamp
        rescues &+= 1
        log.info("Sin cara por \(timestamp - since, privacy: .public) s: reiniciando detección (rescate #\(self.rescues, privacy: .public))")
        let fps = Int(configuredFPS.get())
        queue.async { [weak self] in self?.run(fps: fps, reset: true) }
    }

    func session(_ session: ARSession, didFailWithError error: Error) {
        log.error("ARKit falló: \(error.localizedDescription, privacy: .public)")
        if (error as? ARError)?.code == .cameraUnauthorized {
            onState?(.failed("Falta permiso de cámara. Actívalo en Ajustes › Eye Tracking › Cámara."))
            return
        }
        onState?(.failed(error.localizedDescription))
        guard wantsRunning.get(), retryCount < Self.maxRetries else { return }
        retryCount += 1
        queue.asyncAfter(deadline: .now() + 1.5) { [weak self] in
            guard let self, self.wantsRunning.get() else { return }
            self.run(fps: Int(self.configuredFPS.get()), reset: true)
        }
    }

    func sessionWasInterrupted(_ session: ARSession) {
        onState?(.interrupted)
    }

    func sessionInterruptionEnded(_ session: ARSession) {
        // ARKit reanuda solo. No reconfiguramos: si estábamos en pausa térmica, no hay que despertarlo.
        if wantsRunning.get() { onState?(.running) }
    }

    // MARK: - Codificación

    private func encode(face: ARFaceAnchor?, cameraTransform: simd_float4x4, timestamp: TimeInterval, ambient: Float) {
        typealias I = Packet.Index
        let tracked = (face?.isTracked ?? false)
        var distance: Float = 0
        var faceInCamera = matrix_identity_float4x4
        if tracked, let face {
            faceInCamera = cameraTransform.inverse * face.transform
            distance = simd_length(faceInCamera.position)
        }

        let wantsPacket = hasClients.get()
            && (tracked || timestamp - lastUntrackedSend >= Self.untrackedInterval)
        if wantsPacket, let onPacket {
            builder.reset()
            seq &+= 1
            let base = timeBase ?? timestamp
            timeBase = base
            builder.set(I.timestamp, Float((timestamp - base).truncatingRemainder(dividingBy: Self.timestampWrap)))
            builder.set(I.seq, Float(seq % 16_777_216))
            builder.set(I.thermal, thermal.get())
            builder.set(I.ambient, ambient)
            builder.set(I.rescues, Float(rescues))
            builder.set(I.fps, configuredFPS.get())
            builder.set(I.gravity, gravity.get())
            builder.set(I.battery, battery.get())
            builder.set(I.tracked, tracked ? 1 : 0)
            if tracked, let face {
                fill(&builder, face: face, faceInCamera: faceInCamera)
            } else {
                lastUntrackedSend = timestamp
            }
            onPacket(builder.data())
        }
        updateStats(timestamp: timestamp, tracked: tracked, distance: distance)
    }

    /// `leftEyeTransform`/`rightEyeTransform`/`lookAtPoint` están en el espacio de la cara
    /// (+z sale de la cara); `cameraInverse * face.transform` los lleva al espacio de la cámara.
    private func fill(_ builder: inout PacketBuilder, face: ARFaceAnchor, faceInCamera: simd_float4x4) {
        typealias I = Packet.Index
        let left = faceInCamera * face.leftEyeTransform
        let right = faceInCamera * face.rightEyeTransform
        let look = faceInCamera * SIMD4<Float>(face.lookAtPoint, 1)
        builder.set(I.leftEyePos, left.position)
        builder.set(I.leftEyeDir, left.forward)
        builder.set(I.rightEyePos, right.position)
        builder.set(I.rightEyeDir, right.forward)
        builder.set(I.lookAt, SIMD3<Float>(look.x, look.y, look.z))
        builder.set(I.headPos, faceInCamera.position)
        builder.set(I.headFwd, faceInCamera.forward)
        let q = simd_quatf(simd_float3x3(
            SIMD3(faceInCamera.columns.0.x, faceInCamera.columns.0.y, faceInCamera.columns.0.z),
            SIMD3(faceInCamera.columns.1.x, faceInCamera.columns.1.y, faceInCamera.columns.1.z),
            SIMD3(faceInCamera.columns.2.x, faceInCamera.columns.2.y, faceInCamera.columns.2.z)
        )).normalized
        builder.set(I.headQuat, q.vector.x)
        builder.set(I.headQuat + 1, q.vector.y)
        builder.set(I.headQuat + 2, q.vector.z)
        builder.set(I.headQuat + 3, q.vector.w)

        let shapes = face.blendShapes // una sola lectura: crea un diccionario
        func value(_ key: ARFaceAnchor.BlendShapeLocation) -> Float { shapes[key]?.floatValue ?? 0 }
        builder.set(I.blinkL, value(.eyeBlinkLeft))
        builder.set(I.blinkR, value(.eyeBlinkRight))
        builder.set(I.lookUpL, value(.eyeLookUpLeft))
        builder.set(I.lookDownL, value(.eyeLookDownLeft))
        builder.set(I.lookInL, value(.eyeLookInLeft))
        builder.set(I.lookOutL, value(.eyeLookOutLeft))
        builder.set(I.lookUpR, value(.eyeLookUpRight))
        builder.set(I.lookDownR, value(.eyeLookDownRight))
        builder.set(I.lookInR, value(.eyeLookInRight))
        builder.set(I.lookOutR, value(.eyeLookOutRight))
        builder.set(I.squintL, value(.eyeSquintLeft))
        builder.set(I.squintR, value(.eyeSquintRight))
        builder.set(I.wideL, value(.eyeWideLeft))
        builder.set(I.wideR, value(.eyeWideRight))
    }

    private func updateStats(timestamp: TimeInterval, tracked: Bool, distance: Float) {
        fpsCount += 1
        if fpsWindowStart == 0 { fpsWindowStart = timestamp }
        let elapsed = timestamp - fpsWindowStart
        if elapsed >= 1 {
            measuredFPS = Double(fpsCount) / elapsed
            fpsCount = 0
            fpsWindowStart = timestamp
        }
        // La UI se actualiza a 2 Hz: más sería gasto de batería sin valor.
        guard timestamp - lastStatsEmit >= 0.5 else { return }
        lastStatsEmit = timestamp
        onStats?(SensorStats(fps: measuredFPS, isFaceTracked: tracked, distanceCm: Double(distance) * 100))
    }
}

private extension simd_float4x4 {
    var position: SIMD3<Float> { SIMD3(columns.3.x, columns.3.y, columns.3.z) }
    /// En ARKit el eje +z de la cara y de cada ojo apunta hacia afuera (dirección de la mirada).
    var forward: SIMD3<Float> { simd_normalize(SIMD3(columns.2.x, columns.2.y, columns.2.z)) }
}
