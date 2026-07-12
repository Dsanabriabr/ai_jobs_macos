import SwiftUI

@main
struct AIJobsApp: App {
    @StateObject private var session = AppSession()

    var body: some Scene {
        MenuBarExtra {
            DigestPopoverView()
                .environmentObject(session)
        } label: {
            MenuBarLabel(status: session.status)
        }
        .menuBarExtraStyle(.window)
    }
}
