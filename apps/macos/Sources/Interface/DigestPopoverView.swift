import AppKit
import SwiftUI

struct DigestPopoverView: View {
    @EnvironmentObject private var session: AppSession
    @State private var queriesText = "ios senior"
    @State private var showPolicy = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            if let lastError = session.lastError {
                Text(lastError)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .textSelection(.enabled)
            }
            Divider()
            jobList
            Divider()
            if showPolicy {
                policyEditor
                Divider()
            }
            footer
        }
        .padding(14)
        .frame(width: 400, height: 520)
        .task {
            await session.refresh()
            syncPolicyFields()
        }
        .onChange(of: session.policy) { _, _ in
            syncPolicyFields()
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("AI Jobs")
                    .font(.headline)
                Text(session.agentReachable ? "Agent online" : "Agent offline — start packages/agent")
                    .font(.caption)
                    .foregroundStyle(session.agentReachable ? Color.secondary : Color.red)
            }
            Spacer()
            Text(session.status.rawValue)
                .font(.caption.monospaced())
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(statusChipBackground)
                .clipShape(Capsule())
        }
    }

    private var statusChipBackground: Color {
        switch session.status {
        case .idle: return Color.gray.opacity(0.2)
        case .running: return Color.blue.opacity(0.2)
        case .attention: return Color.yellow.opacity(0.35)
        case .ready: return Color.green.opacity(0.25)
        case .error: return Color.red.opacity(0.2)
        }
    }

    @ViewBuilder
    private var jobList: some View {
        if let jobs = session.digest?.jobs, !jobs.isEmpty {
            List(jobs) { job in
                VStack(alignment: .leading, spacing: 4) {
                    Text(job.title)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(2)
                    HStack {
                        Text(job.company ?? "Unknown company")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(job.queryMatched)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if let description = job.description, !description.isEmpty {
                        Text(description)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .lineLimit(3)
                    }
                    Button("Open") {
                        if let url = URL(string: job.url) {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.link)
                    .font(.caption)
                }
                .padding(.vertical, 4)
            }
            .listStyle(.plain)
        } else {
            ContentUnavailableView(
                "No jobs yet",
                systemImage: "briefcase",
                description: Text("Set queries, then tap Run now.")
            )
        }
    }

    private var policyEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Queries (comma-separated)")
                .font(.caption)
                .foregroundStyle(.secondary)
            TextField("ios senior, android senior", text: $queriesText, axis: .vertical)
                .lineLimit(2...3)
            Text("Cadence: manual (scheduler in P1)")
                .font(.caption2)
                .foregroundStyle(.secondary)
            Button("Save policy") {
                Task { await savePolicy() }
            }
        }
    }

    private var footer: some View {
        HStack {
            Button(showPolicy ? "Hide policy" : "Policy") {
                showPolicy.toggle()
            }
            Button("Refresh") {
                Task { await session.refresh() }
            }
            .disabled(session.isRunning)

            Spacer()

            Button(session.isRunning ? "Running…" : "Run now") {
                Task { await session.runNow() }
            }
            .keyboardShortcut(.defaultAction)
            .disabled(session.isRunning || !session.agentReachable)
        }
    }

    private func syncPolicyFields() {
        if let policy = session.policy {
            queriesText = policy.queries.joined(separator: ", ")
        }
    }

    private func savePolicy() async {
        let queries = queriesText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let policy = SearchPolicyDTO(
            queries: queries.isEmpty ? ["ios senior"] : queries,
            cadence: CadenceDTO(kind: "manual"),
            resultLimitPerQuery: session.policy?.resultLimitPerQuery ?? 10,
            geoLocation: session.policy?.geoLocation
        )
        await session.savePolicy(policy)
    }
}
