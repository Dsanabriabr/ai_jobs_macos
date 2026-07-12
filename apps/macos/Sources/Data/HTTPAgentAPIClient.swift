import Foundation

@MainActor
protocol AgentAPIClient {
    func health() async throws -> Bool
    func status() async throws -> StatusResponse
    func latestDigest(filter: String) async throws -> DigestDTO?
    func policy() async throws -> SearchPolicyDTO
    func updatePolicy(_ policy: SearchPolicyDTO) async throws -> SearchPolicyDTO
    func previewPlan() async throws -> SearchPlanDTO
    func triggerRun() async throws -> DigestDTO
    func labelJob(id: String, label: String) async throws -> JobOpportunityDTO
}

enum AgentAPIError: LocalizedError {
    case invalidURL
    case badStatus(Int, String)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid agent URL"
        case let .badStatus(code, body):
            return "Agent HTTP \(code): \(body)"
        case let .decoding(error):
            return "Decode error: \(error.localizedDescription)"
        }
    }
}

private struct LabelBody: Encodable {
    let label: String
}

@MainActor
struct HTTPAgentAPIClient: AgentAPIClient {
    var baseURL: URL

    init(baseURL: URL = URL(string: "http://127.0.0.1:8787")!) {
        self.baseURL = baseURL
    }

    func health() async throws -> Bool {
        let (data, response) = try await URLSession.shared.data(from: baseURL.appending(path: "health"))
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return false }
        return !data.isEmpty
    }

    func status() async throws -> StatusResponse {
        try await get(baseURL.appending(path: "status"))
    }

    func latestDigest(filter: String) async throws -> DigestDTO? {
        var components = URLComponents(url: baseURL.appending(path: "digest/latest"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "filter", value: filter)]
        guard let url = components.url else { throw AgentAPIError.invalidURL }
        let (data, response) = try await URLSession.shared.data(from: url)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(DigestResponse.self, from: data).digest
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    func policy() async throws -> SearchPolicyDTO {
        let response: PolicyResponse = try await get(baseURL.appending(path: "policy"))
        return response.policy
    }

    func updatePolicy(_ policy: SearchPolicyDTO) async throws -> SearchPolicyDTO {
        let response: PolicyResponse = try await send(
            url: baseURL.appending(path: "policy"),
            method: "PUT",
            body: policy
        )
        return response.policy
    }

    func previewPlan() async throws -> SearchPlanDTO {
        let response: PlanResponse = try await get(baseURL.appending(path: "policy/plan"))
        return response.plan
    }

    func triggerRun() async throws -> DigestDTO {
        var request = URLRequest(url: baseURL.appending(path: "runs"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await URLSession.shared.data(for: request)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(RunResponse.self, from: data).digest
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    func labelJob(id: String, label: String) async throws -> JobOpportunityDTO {
        let url = baseURL
            .appending(path: "jobs")
            .appending(path: id)
            .appending(path: "label")
        let response: LabelResponse = try await send(
            url: url,
            method: "POST",
            body: LabelBody(label: label)
        )
        return response.job
    }

    private func get<T: Decodable>(_ url: URL) async throws -> T {
        let (data, response) = try await URLSession.shared.data(from: url)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    private func send<T: Decodable, B: Encodable>(url: URL, method: String, body: B?) async throws -> T {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body {
            request.httpBody = try JSONEncoder().encode(body)
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    private func throwIfNeeded(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else { return }
        guard (200..<300).contains(http.statusCode) else {
            throw AgentAPIError.badStatus(http.statusCode, String(data: data, encoding: .utf8) ?? "")
        }
    }
}
