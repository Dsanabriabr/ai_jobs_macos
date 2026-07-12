import Foundation

struct JobOpportunityDTO: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let company: String?
    let url: String
    let source: String
    let queryMatched: String
    let description: String?
    let discoveredAt: String
}

struct DigestDTO: Codable, Equatable {
    let id: String
    let createdAt: String
    let status: MenuBarStatus
    let jobIds: [String]
    let jobs: [JobOpportunityDTO]
    let errorMessage: String?
    let queriesRun: [String]
}

struct StatusResponse: Codable, Equatable {
    let status: MenuBarStatus
    let errorMessage: String?
}

struct DigestResponse: Codable, Equatable {
    let digest: DigestDTO?
}

struct CadenceDTO: Codable, Equatable {
    let kind: String
    var hour: Int? = nil
    var minute: Int? = nil
    var weekday: Int? = nil
    var dayOfMonth: Int? = nil
    var monthOfQuarter: Int? = nil
    var monthOfHalf: Int? = nil
    var month: Int? = nil

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(kind, forKey: .kind)
        // Only encode fields relevant to the cadence kind (zod discriminated union).
        switch kind {
        case "daily":
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        case "weekly":
            try container.encodeIfPresent(weekday, forKey: .weekday)
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        case "monthly":
            try container.encodeIfPresent(dayOfMonth, forKey: .dayOfMonth)
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        case "quarterly":
            try container.encodeIfPresent(monthOfQuarter, forKey: .monthOfQuarter)
            try container.encodeIfPresent(dayOfMonth, forKey: .dayOfMonth)
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        case "semiannual":
            try container.encodeIfPresent(monthOfHalf, forKey: .monthOfHalf)
            try container.encodeIfPresent(dayOfMonth, forKey: .dayOfMonth)
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        case "annual":
            try container.encodeIfPresent(month, forKey: .month)
            try container.encodeIfPresent(dayOfMonth, forKey: .dayOfMonth)
            try container.encodeIfPresent(hour, forKey: .hour)
            try container.encodeIfPresent(minute, forKey: .minute)
        default:
            break
        }
    }

    private enum CodingKeys: String, CodingKey {
        case kind, hour, minute, weekday, dayOfMonth, monthOfQuarter, monthOfHalf, month
    }
}

struct SearchPolicyDTO: Codable, Equatable {
    var queries: [String]
    var cadence: CadenceDTO
    var resultLimitPerQuery: Int
    var geoLocation: String?
}

struct PolicyResponse: Codable, Equatable {
    let policy: SearchPolicyDTO
}

struct RunResponse: Codable, Equatable {
    let digest: DigestDTO
}
