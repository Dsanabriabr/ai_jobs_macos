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

struct PlannedSearchDTO: Codable, Equatable, Identifiable {
    var id: String { "\(geoLocation)|\(lang)|\(query)" }
    let query: String
    let geoLocation: String
    let lang: String
    let rationale: String
}

struct DigestDTO: Codable, Equatable {
    let id: String
    let createdAt: String
    let status: MenuBarStatus
    let jobIds: [String]
    let jobs: [JobOpportunityDTO]
    let errorMessage: String?
    let queriesRun: [String]
    let plannedSearches: [PlannedSearchDTO]?
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

struct TermNodeDTO: Codable, Equatable, Identifiable {
    let id: String
    var label: String
    var weight: Double
    var role: String
    var lang: String
}

struct CandidateProfileDTO: Codable, Equatable {
    var id: String
    var displayName: String
    var primaryLocale: String
    var languages: [String]
    var workModel: String
    var visaConstraint: String
    var preferredGeos: [String]
    var timezone: String
    var notes: String?
}

struct SearchPolicyDTO: Codable, Equatable {
    var mode: String
    var queries: [String]
    var cadence: CadenceDTO
    var resultLimitPerQuery: Int
    var geoLocation: String?
    var profile: CandidateProfileDTO
    var termGraph: TermGraphDTO
    var maxPlannedQueries: Int
}

struct TermGraphDTO: Codable, Equatable {
    var nodes: [TermNodeDTO]
}

struct PolicyResponse: Codable, Equatable {
    let policy: SearchPolicyDTO
}

struct SearchPlanDTO: Codable, Equatable {
    let mode: String
    let searches: [PlannedSearchDTO]
}

struct PlanResponse: Codable, Equatable {
    let plan: SearchPlanDTO
}

struct RunResponse: Codable, Equatable {
    let digest: DigestDTO
}
