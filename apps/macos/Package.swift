// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AIJobs",
    platforms: [
        .macOS(.v14)
    ],
    targets: [
        .executableTarget(
            name: "AIJobs",
            path: "Sources"
        )
    ]
)
