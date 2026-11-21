import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.06, blue: 0.08).ignoresSafeArea()
            if model.isDimmed {
                dimmedView
            } else {
                mainView
            }
        }
        .contentShape(Rectangle())
        .onTapGesture { model.wake() }
        .preferredColorScheme(.dark)
    }

    private var mainView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                header
                if case .unsupported = model.sensorState {
                    notice("Este dispositivo no tiene cámara TrueDepth (Face ID). Eye Tracking necesita un iPhone con Face ID.", color: .red)
                }
                connectionCard
                statusGrid
                if let note = model.thermalNote { notice(note, color: .orange) }
                tips
            }
            .padding(24)
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle().stroke(Color.white.opacity(0.15), lineWidth: 6)
                Circle().trim(from: 0, to: 0.75).stroke(Color(red: 0.49, green: 0.58, blue: 1), style: StrokeStyle(lineWidth: 6, lineCap: .round)).rotationEffect(.degrees(-90))
                Circle().fill(Color.white).frame(width: 10, height: 10)
            }
            .frame(width: 40, height: 40)
            VStack(alignment: .leading, spacing: 2) {
                Text("Eye Tracking · sensor").font(.title2.bold())
                Text("Tu iPhone sigue tu mirada para el Mac").font(.subheadline).foregroundStyle(.secondary)
            }
        }
    }

    private var connectionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("ESCRIBE ESTO EN EL MAC").font(.caption.bold()).foregroundStyle(.secondary)
            if model.addresses.isEmpty {
                Text("Sin Wi-Fi. Conéctate a la misma red que el Mac.").font(.headline).foregroundStyle(.orange)
            }
            ForEach(model.addresses, id: \.self) { ip in
                Text("\(ip):\(GazeServer.port)")
                    .font(.system(size: 30, weight: .bold, design: .monospaced))
                    .textSelection(.enabled)
            }
            Text(model.serverStatus).font(.footnote).foregroundStyle(.secondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 22).fill(Color.white.opacity(0.06)))
    }

    private var statusGrid: some View {
        Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 10) {
            GridRow { label("Mac conectado"); value(model.clientCount > 0 ? "Sí (\(model.clientCount))" : "No", ok: model.clientCount > 0) }
            GridRow { label("Cara"); value(model.stats.isFaceTracked ? "Detectada" : "No te veo", ok: model.stats.isFaceTracked) }
            GridRow { label("Distancia"); value(model.stats.isFaceTracked ? "\(Int(model.stats.distanceCm)) cm" : "—", ok: (30...65).contains(model.stats.distanceCm)) }
            GridRow { label("Cuadros/s"); value("\(Int(model.stats.fps.rounded()))", ok: model.stats.fps >= 50) }
        }
        .font(.body)
    }

    private var tips: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("CÓMO UBICARLO").font(.caption.bold()).foregroundStyle(.secondary)
            Text("• Debajo o encima de la pantalla, mirando tu cara, a 35–60 cm.")
            Text("• Apóyalo firme: si se mueve, hay que recalibrar.")
            Text("• Conéctalo al cargador para sesiones largas.")
            Text("• La pantalla se oscurece sola para no reflejarse en tus ojos. Tócala para verla.")
        }
        .font(.callout)
        .foregroundStyle(.secondary)
    }

    private var dimmedView: some View {
        VStack(spacing: 8) {
            Circle().fill(model.stats.isFaceTracked ? Color.green : Color.orange).frame(width: 10, height: 10)
            Text("Siguiendo tu mirada · toca para ver").font(.footnote).foregroundStyle(Color.white.opacity(0.35))
        }
    }

    private func label(_ text: String) -> some View { Text(text).foregroundStyle(.secondary) }

    private func value(_ text: String, ok: Bool) -> some View {
        HStack(spacing: 8) {
            Circle().fill(ok ? Color.green : Color.orange).frame(width: 8, height: 8)
            Text(text).bold()
        }
    }

    private func notice(_ text: String, color: Color) -> some View {
        Text(text)
            .font(.callout.weight(.semibold))
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 16).fill(color.opacity(0.18)))
    }
}
