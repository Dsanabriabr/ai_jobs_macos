import AppKit
import Combine
import Foundation

@MainActor
final class AppSession: ObservableObject {
    @Published private(set) var status: MenuBarStatus = .idle
    @Published private(set) var errorMessage: String?
    @Published private(set) var digest: DigestDTO?
    @Published private(set) var policy: SearchPolicyDTO?
    @Published private(set) var plan: SearchPlanDTO?
    @Published private(set) var isRunning = false
    @Published private(set) var lastError: String?
    @Published var agentReachable = false
    @Published var listFilter = "hide_noise"

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
            digest = try await client.latestDigest(filter: listFilter)
            policy = try await client.policy()
            plan = try await client.previewPlan()
            lastError = nil
        } catch {
            agentReachable = false
            lastError = error.localizedDescription
            status = .error
        }
    }

    func runNow() async {
        isRunning = true
        status = .running
        defer { isRunning = false }
        do {
            _ = try await client.triggerRun()
            digest = try await client.latestDigest(filter: listFilter)
            let statusResponse = try await client.status()
            status = statusResponse.status
            errorMessage = statusResponse.errorMessage
            plan = try await client.previewPlan()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
            status = .error
        }
    }

    func savePolicy(_ policy: SearchPolicyDTO) async {
        do {
            self.policy = try await client.updatePolicy(policy)
            self.plan = try await client.previewPlan()
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }

    func label(jobId: String, as label: String) async {
        do {
            _ = try await client.labelJob(id: jobId, label: label)
            digest = try await client.latestDigest(filter: listFilter)
            lastError = nil
        } catch {
            lastError = error.localizedDescription
        }
    }
}
