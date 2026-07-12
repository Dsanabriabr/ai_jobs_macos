import AppKit
import Combine
import Foundation

@MainActor
final class AppSession: ObservableObject {
    @Published private(set) var status: MenuBarStatus = .idle
    @Published private(set) var errorMessage: String?
    @Published private(set) var digest: DigestDTO?
    @Published private(set) var policy: SearchPolicyDTO?
    @Published private(set) var isRunning = false
    @Published private(set) var lastError: String?
    @Published var agentReachable = false

    private let client: any AgentAPIClient
    private var pollTask: Task<Void, Never>?

    init(client: any AgentAPIClient = HTTPAgentAPIClient()) {
        self.client = client
        NSApplication.shared.setActivationPolicy(.accessory)
        startPolling()
    }

    func startPolling() {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.refresh()
                try? await Task.sleep(for: .seconds(3))
            }
        }
    }

    func refresh() async {
        do {
            agentReachable = try await client.health()
            let statusResponse = try await client.status()
            status = statusResponse.status
            errorMessage = statusResponse.errorMessage
            digest = try await client.latestDigest()
            policy = try await client.policy()
            lastError = nil
            applyStatusColor()
        } catch {
            agentReachable = false
            lastError = error.localizedDescription
            status = .error
            applyStatusColor()
        }
    }

    func runNow() async {
        isRunning = true
        status = .running
        applyStatusColor()
        defer { isRunning = false }
        do {
            digest = try await client.triggerRun()
            let statusResponse = try await client.status()
            status = statusResponse.status
            errorMessage = statusResponse.errorMessage
            lastError = nil
            applyStatusColor()
        } catch {
            lastError = error.localizedDescription
            status = .error
            applyStatusColor()
        }
    }

    func savePolicy(_ policy: SearchPolicyDTO) async {
        do {
            self.policy = try await client.updatePolicy(policy)
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    private func applyStatusColor() {
        // Color is rendered by MenuBarLabel from `status`.
    }
}
