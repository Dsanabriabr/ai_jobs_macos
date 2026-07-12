import AppKit
import Foundation

enum MenuBarStatus: String, Codable, Equatable {
    case idle
    case running
    case attention
    case ready
    case error
}
