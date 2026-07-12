import AppKit
import SwiftUI

struct DigestPopoverView: View {
    @EnvironmentObject private var session: AppSession
    @State private var mode = "persona_graph"
    @State private var queriesText = ""
    @State private var geosText = "Brazil, United States"
    @State private var maxPlanned = 8
    @State private var resultLimit = 10
    @State private var maxPages = 2
    @State private var maxFollow = 3
    @State private var surfaceEnabled = true
    /// Coupled: surfaceShare + followShare + atsShare == 1.0
    @State private var surfaceShare = 0.70
    @State private var followShare = 0.10
    @State private var cadenceKind = "manual"
    @State private var atsTargets: [AtsTargetDTO] = []
    @State private var showPolicy = false
    @State private var editingJob: JobOpportunityDTO?

    private var atsShare: Double {
        max(0, 1 - surfaceShare - followShare)
    }

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
            diagnosticsBar
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
        .frame(width: 520, height: 760)
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
        .sheet(item: $editingJob) { job in
            JobEditSheet(job: job) { patch in
                Task {
                    await session.updateJob(id: job.id, patch: patch)
                    editingJob = nil
                }
            } onCancel: {
                editingJob = nil
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("AI Jobs · P1.4")
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
            Text("Postings").tag("postings")
            Text("Signal").tag("signal")
            Text("Hubs").tag("hubs")
            Text("Unlabeled").tag("unlabeled")
            Text("Hide noise").tag("hide_noise")
            Text("ATS only").tag("ats_only")
            Text("All").tag("all")
        }
        .pickerStyle(.menu)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var diagnosticsBar: some View {
        if let d = session.digest?.diagnostics {
            Text(
                "raw \(d.rawHits) · denied \(d.droppedDenied) · weak \(d.droppedHeuristic) · kept \(d.kept) · follow \(d.followed)/\(d.followLinksFound)"
            )
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var jobList: some View {
        if let jobs = session.digest?.jobs, !jobs.isEmpty {
            List(jobs) { job in
                HStack(alignment: .top, spacing: 10) {
                    CompanyLogoView(logoUrl: job.logoUrl)
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(job.title)
                                .font(.subheadline.weight(.semibold))
                                .lineLimit(2)
                            Spacer()
                            Text(job.pageKind ?? "?")
                                .font(.caption2)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(pageKindChip(job.pageKind))
                                .clipShape(Capsule())
                        }
                        HStack {
                            Text(job.company ?? "Unknown company")
                                .font(.caption)
                                .foregroundStyle(job.company == nil ? .orange : .secondary)
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
                            Button("Edit") {
                                editingJob = job
                            }
                            .buttonStyle(.link)
                            Spacer()
                            if job.pageKind == "posting" {
                                Button("Signal") {
                                    Task { await session.label(jobId: job.id, as: "signal") }
                                }
                                .tint(.green)
                            }
                            Button("Hub") {
                                Task { await session.label(jobId: job.id, as: "hub") }
                            }
                            .tint(.blue)
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
                }
                .padding(.vertical, 4)
            }
            .listStyle(.plain)
            .frame(minHeight: 180)
        } else {
            ContentUnavailableView(
                "No jobs in this filter",
                systemImage: "briefcase",
                description: Text("Try Hubs or All, or Run now. Mark hubs and edit company/logo for training.")
            )
            .frame(minHeight: 120)
        }
    }

    private func pageKindChip(_ kind: String?) -> Color {
        switch kind {
        case "posting": return Color.green.opacity(0.2)
        case "hub": return Color.blue.opacity(0.2)
        default: return Color.gray.opacity(0.15)
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

                Text(
                    "Budget \(Int(surfaceShare * 100))% surface · \(Int(atsShare * 100))% ATS · \(Int(followShare * 100))% follow (=100%)"
                )
                .font(.caption)
                .foregroundStyle(.secondary)

                Text("Surface share")
                    .font(.caption2)
                Slider(
                    value: Binding(
                        get: { surfaceShare },
                        set: { newValue in
                            let maxSurface = 1 - followShare
                            surfaceShare = min(maxSurface, max(0, newValue))
                        }
                    ),
                    in: 0...(1 - followShare),
                    step: 0.05
                )

                Text("Follow share (max 20%)")
                    .font(.caption2)
                Slider(
                    value: Binding(
                        get: { followShare },
                        set: { newValue in
                            followShare = min(0.2, max(0, newValue))
                            let maxSurface = 1 - followShare
                            if surfaceShare > maxSurface { surfaceShare = maxSurface }
                        }
                    ),
                    in: 0...0.2,
                    step: 0.05
                )

                Text("ATS share is the remainder (not independently editable).")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                Stepper("Max planned queries: \(maxPlanned)", value: $maxPlanned, in: 2...16)
                Stepper("Results per query: \(resultLimit)", value: $resultLimit, in: 5...20)
                Stepper("SERP pages per query: \(maxPages)", value: $maxPages, in: 1...5)
                Stepper("Follow/resolve max: \(maxFollow)", value: $maxFollow, in: 0...10)

                Text("ATS search lane (optional — off by default)")
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
        .frame(maxHeight: 280)
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
        followShare = min(0.2, max(0, policy.sources.budget.follow))
        surfaceShare = min(1 - followShare, max(0, policy.sources.budget.surface))
        maxPages = policy.sources.maxPagesPerQuery
        maxFollow = policy.sources.maxFollowResolves
        atsTargets = policy.sources.atsTargets
    }

    private func savePolicy() async {
        guard var policy = session.policy else { return }
        policy.mode = mode
        policy.maxPlannedQueries = maxPlanned
        policy.resultLimitPerQuery = resultLimit
        policy.cadence = makeCadence(kind: cadenceKind, previous: policy.cadence)
        policy.sources.surfaceEnabled = surfaceEnabled
        // Coupled 100%: ATS is remainder.
        policy.sources.budget = DiscoveryBudgetDTO(
            surface: surfaceShare,
            ats: atsShare,
            follow: followShare
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
            policy.queries = queries.isEmpty ? ["ios senior remoto brasil"] : queries
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

private struct CompanyLogoView: View {
    let logoUrl: String?

    var body: some View {
        Group {
            if let logoUrl, let url = URL(string: logoUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image
                            .resizable()
                            .scaledToFit()
                    case .failure:
                        placeholder
                    case .empty:
                        ProgressView()
                            .controlSize(.small)
                    @unknown default:
                        placeholder
                    }
                }
            } else {
                placeholder
            }
        }
        .frame(width: 36, height: 36)
        .background(Color.gray.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }

    private var placeholder: some View {
        Image(systemName: "building.2")
            .font(.system(size: 14))
            .foregroundStyle(.secondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct JobEditSheet: View {
    let job: JobOpportunityDTO
    let onSave: (JobUpdatePatchDTO) -> Void
    let onCancel: () -> Void

    @State private var title: String
    @State private var company: String
    @State private var url: String
    @State private var logoUrl: String
    @State private var pageKind: String

    init(
        job: JobOpportunityDTO,
        onSave: @escaping (JobUpdatePatchDTO) -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.job = job
        self.onSave = onSave
        self.onCancel = onCancel
        _title = State(initialValue: job.title)
        _company = State(initialValue: job.company ?? "")
        _url = State(initialValue: job.url)
        _logoUrl = State(initialValue: job.logoUrl ?? "")
        _pageKind = State(initialValue: job.pageKind ?? "unknown")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Edit job (human training)")
                .font(.headline)

            HStack(alignment: .top, spacing: 12) {
                CompanyLogoView(logoUrl: logoUrl.isEmpty ? nil : logoUrl)
                VStack(alignment: .leading, spacing: 8) {
                    TextField("Title", text: $title)
                    TextField("Company", text: $company)
                    TextField("Apply URL", text: $url)
                    TextField("Logo URL", text: $logoUrl)
                    Picker("Page kind", selection: $pageKind) {
                        Text("Posting").tag("posting")
                        Text("Hub").tag("hub")
                        Text("Unknown").tag("unknown")
                    }
                    .pickerStyle(.segmented)
                }
            }

            HStack {
                Button("Cancel", action: onCancel)
                Spacer()
                Button("Save") {
                    onSave(
                        JobUpdatePatchDTO(
                            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
                            company: company.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                ? nil
                                : company.trimmingCharacters(in: .whitespacesAndNewlines),
                            url: url.trimmingCharacters(in: .whitespacesAndNewlines),
                            logoUrl: logoUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                                ? nil
                                : logoUrl.trimmingCharacters(in: .whitespacesAndNewlines),
                            pageKind: pageKind,
                            clearNullables: true
                        )
                    )
                }
                .keyboardShortcut(.defaultAction)
                .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    || url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .padding(16)
        .frame(width: 440)
    }
}

