import Foundation

@main
enum EyeTrackingChecks {
    static func main() {
        checkFrameRatePolicy()
        checkPacketLayout()
        print("Eye Tracking: frame rate policy and v2 wire layout passed.")
    }

    static func checkFrameRatePolicy() {
        var policy = FrameRatePolicy()
        precondition(policy.effectiveFPS(isIdleThrottled: false) == 60)
        precondition(policy.effectiveFPS(isIdleThrottled: true) == 30)
        precondition(!policy.request(120))
        policy.updateThermalState(.fair)
        precondition(policy.thermalNote == nil && policy.effectiveFPS(isIdleThrottled: false) == 60)
        policy.updateThermalState(.critical)
        precondition(policy.thermalNote != nil && policy.effectiveFPS(isIdleThrottled: false) == 0)
        policy.updateThermalState(.fair)
        precondition(policy.thermalNote != nil && policy.effectiveFPS(isIdleThrottled: false) == 30)
        policy.updateThermalState(.nominal)
        precondition(policy.thermalNote == nil && policy.effectiveFPS(isIdleThrottled: false) == 60)
        precondition(policy.request(30))
        precondition(policy.effectiveFPS(isIdleThrottled: false) == 30)
    }

    static func checkPacketLayout() {
        var packet = PacketBuilder()
        packet.reset()
        packet.set(Packet.Index.timestamp, 12.5)
        packet.set(Packet.Index.tracked, 1)
        packet.set(Packet.Index.seq, 42)
        packet.set(Packet.Index.leftEyePos, SIMD3<Float>(-0.125, 0.25, -0.5))
        packet.set(Packet.Index.fps, 60)
        packet.set(Packet.Index.gravity, SIMD3<Float>(0, -1, 0))
        packet.set(Packet.Index.battery, 0.75)
        packet.set(Packet.Index.rescues, 7)
        packet.set(Packet.Index.headQuat + 3, 1)

        let wire = Array(packet.data())
        precondition(wire.count == 224)
        let fields: [(Int, Float)] = [
            (0, 2), (1, 12.5), (2, 1), (3, 42), (4, -0.125), (5, 0.25), (6, -0.5),
            (41, 60), (43, -1), (45, 0.75), (46, 7), (50, 1),
        ]
        for (index, expected) in fields {
            let offset = index * 4
            let value = expected.bitPattern
            for byte in 0..<4 {
                precondition(wire[offset + byte] == UInt8(truncatingIfNeeded: value >> (8 * byte)))
            }
        }
    }
}
