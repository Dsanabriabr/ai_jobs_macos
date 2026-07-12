import Foundation

@MainActor
protocol AgentAPIClient {
    func health() async throws -> Bool
    func status() async throws -> StatusResponse
    func latestDigest() async throws -> DigestDTO?
    func policy() async throws -> SearchPolicyDTO
    func updatePolicy(_ policy: SearchPolicyDTO) async throws -> SearchPolicyDTO
    func triggerRun() async throws -> DigestDTO
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

@MainActor
struct HTTPAgentAPIClient: AgentAPIClient {
    var baseURL: URL

    init(baseURL: URL = URL(string: "http://127.0.0.1:8787")!) {
        self.baseURL = baseURL
    }

    func health() async throws -> Bool {
        let url = baseURL.appending(path: "health")
        let (data, response) = try await URLSession.shared.data(from: url)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            return false
        }
        return !data.isEmpty
    }

    func status() async throws -> StatusResponse {
        try await get("status")
    }

    func latestDigest() async throws -> DigestDTO? {
        let response: DigestResponse = try await get("digest/latest")
        return response.digest
    }

    func policy() async throws -> SearchPolicyDTO {
        let response: PolicyResponse = try await get("policy")
        return response.policy
    }

    func updatePolicy(_ policy: SearchPolicyDTO) async throws -> SearchPolicyDTO {
        let response: PolicyResponse = try await put("policy", body: policy)
        return response.policy
    }

    func triggerRun() async throws -> DigestDTO {
        let response: RunResponse = try await post("runs")
        return response.digest
    }

    private func get<T: Decodable>(_ path: String) async throws -> T {
        let url = baseURL.appending(path: path)
        let (data, response) = try await URLSession.shared.data(from: url)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    private func post<T: Decodable>(_ path: String) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let (data, response) = try await URLSession.shared.data(for: request)
        try throwIfNeeded(response, data: data)
        do {
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            throw AgentAPIError.decoding(error)
        }
    }

    private func put<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        var request = URLRequest(url: baseURL.appending(path: path))
        request.httpMethod = "PUT"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)
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
            let body = String(data: data, encoding: .utf8) ?? ""
            throw AgentAPIError.badStatus(http.statusCode, body)
        }
    }
}
