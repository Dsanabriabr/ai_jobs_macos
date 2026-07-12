import SwiftUI

struct MenuBarLabel: View {
    let status: MenuBarStatus

    var body: some View {
        Image(systemName: "briefcase.fill")
            .symbolRenderingMode(.palette)
            .foregroundStyle(color)
            .accessibilityLabel("AI Jobs \(status.rawValue)")
    }

    private var color: Color {
        switch status {
        case .idle:
            return .secondary
        case .running:
            return .blue
        case .attention:
            return .yellow
        case .ready:
            return .green
        case .error:
            return .red
        }
    }
}
