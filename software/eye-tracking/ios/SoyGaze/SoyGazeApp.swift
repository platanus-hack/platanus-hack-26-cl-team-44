import SwiftUI

@main
struct SoyGazeApp: App {
    @StateObject private var model = AppModel()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(model)
                .onAppear { model.start() }
        }
        .onChange(of: scenePhase) { _, phase in
            model.handle(phase: phase)
        }
    }
}
