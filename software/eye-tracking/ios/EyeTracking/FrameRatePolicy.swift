import Foundation

struct FrameRatePolicy {
    private static let fullFPS = 60
    private static let reducedFPS = 30

    private(set) var requestedFPS = Self.fullFPS
    private(set) var thermalLimit = Self.fullFPS
    private(set) var thermalNote: String?

    mutating func request(_ fps: Int) -> Bool {
        guard fps == Self.reducedFPS || fps == Self.fullFPS else { return false }
        requestedFPS = fps
        return true
    }

    mutating func updateThermalState(_ state: ProcessInfo.ThermalState) {
        switch state {
        case .nominal:
            thermalLimit = Self.fullFPS
            thermalNote = nil
        case .fair:
            // Once throttled, wait for nominal temperature before restoring full speed.
            thermalLimit = thermalLimit == Self.fullFPS ? Self.fullFPS : Self.reducedFPS
            thermalNote = thermalLimit == Self.reducedFPS ? "iPhone tibio: sigo a 30 fps hasta que se enfríe." : nil
        case .serious:
            thermalLimit = Self.reducedFPS
            thermalNote = "iPhone caliente: bajé a 30 fps. Quítale la funda o aléjalo del sol."
        case .critical:
            thermalLimit = 0
            thermalNote = "iPhone muy caliente: pausé el seguimiento para protegerlo."
        @unknown default:
            thermalLimit = Self.reducedFPS
        }
    }

    func effectiveFPS(isIdleThrottled: Bool) -> Int {
        min(requestedFPS, thermalLimit, isIdleThrottled ? Self.reducedFPS : Self.fullFPS)
    }
}
