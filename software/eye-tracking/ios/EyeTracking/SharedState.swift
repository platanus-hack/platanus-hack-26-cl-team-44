import Foundation
import os

/// Caja con candado para valores que se escriben desde un hilo y se leen en otro
/// (gravedad, batería, estado térmico). Evita data races sin bloquear la cola de ARKit.
final class LockedBox<Value>: @unchecked Sendable {
    private var value: Value
    private let lock = OSAllocatedUnfairLock()

    init(_ value: Value) { self.value = value }

    func get() -> Value { lock.withLock { value } }
    func set(_ newValue: Value) { lock.withLock { value = newValue } }
}

/// Métricas que el sensor reporta a la UI (copiadas, nunca compartidas).
struct SensorStats: Sendable, Equatable {
    var fps: Double = 0
    var isFaceTracked = false
    var distanceCm: Double = 0
}

enum SensorState: Sendable, Equatable {
    case idle
    case running
    case interrupted
    case failed(String)
    case unsupported
}

let log = Logger(subsystem: Bundle.main.bundleIdentifier ?? "eyetracking", category: "sensor")
