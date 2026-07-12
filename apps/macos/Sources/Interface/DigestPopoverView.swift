import AppKit
import SwiftUI

struct DigestPopoverView: View {
    @EnvironmentObject private var session: AppSession
    @State private var mode = "persona_graph"
    @State private var queriesText = ""
    @State private var geosText = "Brazil, United States, Germany"
    @State private var maxPlanned = 6
    @State private var cadenceKind = "manual"
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
            filterBar
            Divider()
            jobList
            Divider()
            if showPolicy {
                policyEditor
                Divider()
            }
            planPreview
            Divider()
            footer
        }
        .padding(14)
        .frame(width: 460, height: 680)
        .task {
            await session.refresh()
            syncPolicyFields()
        }
        .onChange(of: session.policy) { _, _ in
            syncPolicyFields()
        }
        .onChange(of: session.listFilter) { _, _ in
            Task { await session.refresh() }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("AI Jobs · P1.1")
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

    private var filterBar: some View {
        Picker("Filter", selection: $session.listFilter) {
            Text("Hide noise").tag("hide_noise")
            Text("Unlabeled").tag("unlabeled")
            Text("Signal").tag("signal")
            Text("ATS only").tag("ats_only")
            Text("All").tag("all")
        }
        .pickerStyle(.menu)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var jobList: some View {
        if let jobs = session.digest?.jobs, !jobs.isEmpty {
            List(jobs) { job in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(job.title)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(2)
                        Spacer()
                        Text(job.hostKind ?? "?")
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.gray.opacity(0.15))
                            .clipShape(Capsule())
                    }
                    HStack {
                        Text(job.company ?? "Unknown company")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text(job.label ?? "unlabeled")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    if let mirrors = job.mirrors, mirrors.count > 1 {
                        Text("\(mirrors.count) sources · canonical preferred")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Button("Open") {
                            if let url = URL(string: job.url) {
                                NSWorkspace.shared.open(url)
                            }
                        }
                        .buttonStyle(.link)
                        Spacer()
                        Button("Signal") {
                            Task { await session.label(jobId: job.id, as: "signal") }
                        }
                        .tint(.green)
                        Button("Noise") {
                            Task { await session.label(jobId: job.id, as: "noise") }
                        }
                        .tint(.orange)
                        Button("Dup") {
                            Task { await session.label(jobId: job.id, as: "duplicate") }
                        }
                        .tint(.secondary)
                    }
                    .font(.caption)
                }
                .padding(.vertical, 4)
            }
            .listStyle(.plain)
            .frame(minHeight: 200)
        } else {
            ContentUnavailableView(
                "No jobs in this filter",
                systemImage: "briefcase",
                description: Text("Run now, then label Signal/Noise to train the journal.")
            )
            .frame(minHeight: 120)
        }
    }

    private var policyEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            Picker("Mode", selection: $mode) {
                Text("Persona graph").tag("persona_graph")
                Text("Manual queries").tag("manual_queries")
            }
            .pickerStyle(.segmented)

            Picker("Cadence", selection: $cadenceKind) {
                Text("Manual").tag("manual")
                Text("Daily").tag("daily")
                Text("Weekly").tag("weekly")
                Text("Monthly").tag("monthly")
            }
            .pickerStyle(.menu)

            if mode == "manual_queries" {
                Text("Queries (comma-separated)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                TextField("ios senior remote, vaga ios remoto", text: $queriesText, axis: .vertical)
                    .lineLimit(2...3)
            } else {
                Text("Preferred geos (comma-separated)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                TextField("Brazil, United States, Germany", text: $geosText)
                Stepper("Max planned queries: \(maxPlanned)", value: $maxPlanned, in: 1...12)
                if let profile = session.policy?.profile {
                    Text("\(profile.displayName) · \(profile.workModel) · \(profile.visaConstraint)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }

            Button("Save policy") {
                Task { await savePolicy() }
            }
        }
    }

    @ViewBuilder
    private var planPreview: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Planned searches")
                .font(.caption.weight(.semibold))
            if let searches = session.plan?.searches, !searches.isEmpty {
                ForEach(searches.prefix(5)) { item in
                    Text("• [\(item.geoLocation)/\(item.lang)] \(item.query)")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            } else {
                Text("No plan yet.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
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
        guard let policy = session.policy else { return }
        mode = policy.mode
        queriesText = policy.queries.joined(separator: ", ")
        geosText = policy.profile.preferredGeos.joined(separator: ", ")
        maxPlanned = policy.maxPlannedQueries
        cadenceKind = policy.cadence.kind
    }

    private func savePolicy() async {
        guard var policy = session.policy else { return }
        policy.mode = mode
        policy.maxPlannedQueries = maxPlanned
        policy.cadence = makeCadence(kind: cadenceKind, previous: policy.cadence)
        policy.profile.preferredGeos = geosText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        if policy.profile.preferredGeos.isEmpty {
            policy.profile.preferredGeos = ["Brazil", "United States"]
        }
        if mode == "manual_queries" {
            let queries = queriesText
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
            policy.queries = queries.isEmpty ? ["ios senior remote contractor"] : queries
        }
        await session.savePolicy(policy)
    }

    private func makeCadence(kind: String, previous: CadenceDTO) -> CadenceDTO {
        switch kind {
        case "daily":
            return CadenceDTO(kind: "daily", hour: previous.hour ?? 9, minute: previous.minute ?? 0)
        case "weekly":
            return CadenceDTO(
                kind: "weekly",
                hour: previous.hour ?? 9,
                minute: previous.minute ?? 0,
                weekday: previous.weekday ?? 1
            )
        case "monthly":
            return CadenceDTO(
                kind: "monthly",
                hour: previous.hour ?? 9,
                minute: previous.minute ?? 0,
                dayOfMonth: previous.dayOfMonth ?? 1
            )
        default:
            return CadenceDTO(kind: "manual")
        }
    }
}
