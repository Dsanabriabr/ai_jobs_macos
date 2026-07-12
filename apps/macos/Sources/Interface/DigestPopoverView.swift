import AppKit
import SwiftUI

struct DigestPopoverView: View {
    @EnvironmentObject private var session: AppSession
    @State private var mode = "persona_graph"
    @State private var queriesText = ""
    @State private var geosText = "Brazil, United States, Germany"
    @State private var maxPlanned = 8
    @State private var resultLimit = 10
    @State private var maxPages = 2
    @State private var maxFollow = 3
    @State private var surfaceEnabled = true
    @State private var surfaceBudget = 0.45
    @State private var atsBudget = 0.45
    @State private var cadenceKind = "manual"
    @State private var atsTargets: [AtsTargetDTO] = []
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
        .frame(width: 480, height: 720)
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
                Text("AI Jobs · P1.2")
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
                        Text("\(mirrors.count) sources · cross-host")
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
                        if canMarkDuplicate(job) {
                            Button("Dup") {
                                Task { await session.label(jobId: job.id, as: "duplicate") }
                            }
                            .tint(.secondary)
                        }
                    }
                    .font(.caption)
                }
                .padding(.vertical, 4)
            }
            .listStyle(.plain)
            .frame(minHeight: 180)
        } else {
            ContentUnavailableView(
                "No jobs in this filter",
                systemImage: "briefcase",
                description: Text("Run dual discovery (surface + ATS). Label Signal/Noise.")
            )
            .frame(minHeight: 120)
        }
    }

    private var policyEditor: some View {
        ScrollView {
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

                Toggle("Surface search enabled", isOn: $surfaceEnabled)

                Text("Budget — surface \(Int(surfaceBudget * 100))% / ATS \(Int(atsBudget * 100))%")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Slider(value: $surfaceBudget, in: 0...0.9, step: 0.05)
                Slider(value: $atsBudget, in: 0...0.9, step: 0.05)

                Stepper("Max planned queries: \(maxPlanned)", value: $maxPlanned, in: 2...16)
                Stepper("Results per query: \(resultLimit)", value: $resultLimit, in: 5...20)
                Stepper("SERP pages per query: \(maxPages)", value: $maxPages, in: 1...5)
                Stepper("Follow/resolve max: \(maxFollow)", value: $maxFollow, in: 0...10)

                Text("ATS targets")
                    .font(.caption.weight(.semibold))
                ForEach($atsTargets) { $target in
                    Toggle(target.label, isOn: $target.enabled)
                        .font(.caption)
                }

                if mode == "manual_queries" {
                    TextField("Queries (comma-separated)", text: $queriesText, axis: .vertical)
                        .lineLimit(2...3)
                } else {
                    TextField("Preferred geos", text: $geosText)
                }

                Button("Save policy") {
                    Task { await savePolicy() }
                }
            }
        }
        .frame(maxHeight: 260)
    }

    @ViewBuilder
    private var planPreview: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Planned searches")
                .font(.caption.weight(.semibold))
            if let slots = session.plan?.slots {
                Text("slots surface=\(slots.surface) ats=\(slots.ats) follow=\(slots.follow)")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            if let searches = session.plan?.searches, !searches.isEmpty {
                ForEach(searches.prefix(6)) { item in
                    Text("• [\(item.lane ?? "?")/\(item.geoLocation)] \(item.query)")
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

    private func canMarkDuplicate(_ job: JobOpportunityDTO) -> Bool {
        let hosts = Set((job.mirrors ?? []).map(\.host))
        return hosts.count >= 2
    }

    private func syncPolicyFields() {
        guard let policy = session.policy else { return }
        mode = policy.mode
        queriesText = policy.queries.joined(separator: ", ")
        geosText = policy.profile.preferredGeos.joined(separator: ", ")
        maxPlanned = policy.maxPlannedQueries
        resultLimit = policy.resultLimitPerQuery
        cadenceKind = policy.cadence.kind
        surfaceEnabled = policy.sources.surfaceEnabled
        surfaceBudget = policy.sources.budget.surface
        atsBudget = policy.sources.budget.ats
        maxPages = policy.sources.maxPagesPerQuery
        maxFollow = policy.sources.maxFollowResolves
        atsTargets = policy.sources.atsTargets
    }

    private func savePolicy() async {
        guard var policy = session.policy else { return }
        let followBudget = max(0, 1 - surfaceBudget - atsBudget)
        policy.mode = mode
        policy.maxPlannedQueries = maxPlanned
        policy.resultLimitPerQuery = resultLimit
        policy.cadence = makeCadence(kind: cadenceKind, previous: policy.cadence)
        policy.sources.surfaceEnabled = surfaceEnabled
        policy.sources.budget = DiscoveryBudgetDTO(
            surface: surfaceBudget,
            ats: atsBudget,
            follow: followBudget
        )
        policy.sources.maxPagesPerQuery = maxPages
        policy.sources.maxFollowResolves = maxFollow
        policy.sources.atsTargets = atsTargets
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
