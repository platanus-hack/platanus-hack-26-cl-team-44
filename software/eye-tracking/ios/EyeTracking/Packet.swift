import Foundation
import simd

/// Protocolo binario v2 iPhone → Mac. DEBE coincidir con web/js/protocol.js.
/// 56 × Float32 little-endian = 224 bytes. Coordenadas de cámara, metros.
/// v2 agrega la rotación completa de la cabeza (cuaternión): permite separar el giro de
/// la cabeza (medido con precisión por TrueDepth) del giro del ojo (que ARKit comprime).
enum Packet {
    static let version: Float = 2
    static let floatCount = 56

    enum Index {
        static let version = 0, timestamp = 1, tracked = 2, seq = 3
        static let leftEyePos = 4, leftEyeDir = 7, rightEyePos = 10, rightEyeDir = 13
        static let lookAt = 16, headPos = 19, headFwd = 22
        static let blinkL = 25, blinkR = 26
        static let lookUpL = 27, lookDownL = 28, lookInL = 29, lookOutL = 30
        static let lookUpR = 31, lookDownR = 32, lookInR = 33, lookOutR = 34
        static let squintL = 35, squintR = 36, wideL = 37, wideR = 38
        static let ambient = 39, thermal = 40, fps = 41, gravity = 42, battery = 45
        static let rescues = 46 // reinicios de detección hechos por el iPhone (contador)
        static let headQuat = 47 // x, y, z, w: rotación cara→cámara
    }
}

/// Buffer reutilizable para armar un paquete sin asignar memoria en cada cuadro.
struct PacketBuilder {
    private(set) var floats = [Float](repeating: 0, count: Packet.floatCount)

    mutating func reset() {
        for i in floats.indices { floats[i] = 0 }
        floats[Packet.Index.version] = Packet.version
    }

    mutating func set(_ index: Int, _ value: Float) { floats[index] = value }

    mutating func set(_ index: Int, _ v: SIMD3<Float>) {
        floats[index] = v.x
        floats[index + 1] = v.y
        floats[index + 2] = v.z
    }

    /// Copia a Data (little-endian: todos los iPhone son ARM little-endian).
    func data() -> Data {
        floats.withUnsafeBufferPointer { Data(buffer: $0) }
    }
}
