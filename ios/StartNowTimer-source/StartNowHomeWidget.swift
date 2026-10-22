import AppIntents
import SwiftUI
import WidgetKit

// The home screen widget, in three sizes. Press and hold it > Edit Widget to pick
// a colour, show or hide the streak, and choose the two quick starts.

// The app writes the streak here (AppDelegate.swift, AppSettingsPlugin.setWidgetData).
// It only reaches the widget when both targets have the "App Groups" capability with this name.
let startNowAppGroup = "group.app.startnowadhd.StartNow"

// MARK: - The choices in Edit Widget

enum WidgetColour: String, AppEnum {
    case green, purple, blue, orange, pink

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Colour"
    static let caseDisplayRepresentations: [WidgetColour: DisplayRepresentation] = [
        .green: "Green", .purple: "Purple", .blue: "Blue", .orange: "Orange", .pink: "Pink",
    ]

    var gradient: LinearGradient {
        let stops: [Color]
        switch self {
        case .green: stops = [Color(hex: 0x1F5A4B), Color(hex: 0x2B735F), Color(hex: 0x368268)]
        case .purple: stops = [Color(hex: 0x4A3A63), Color(hex: 0x6A5285), Color(hex: 0x8467A0)]
        case .blue: stops = [Color(hex: 0x2D4A73), Color(hex: 0x3F5F90), Color(hex: 0x5276AD)]
        case .orange: stops = [Color(hex: 0x8A3B1E), Color(hex: 0xA8522B), Color(hex: 0xC76A3A)]
        case .pink: stops = [Color(hex: 0x7A2E4A), Color(hex: 0x974062), Color(hex: 0xB4587A)]
        }
        return LinearGradient(colors: stops, startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    // The colour of the dot on the logo.
    var dot: Color {
        switch self {
        case .green: return Color(hex: 0x9FD9C6)
        case .purple: return Color(hex: 0xD9C8EF)
        case .blue: return Color(hex: 0xBFD3F2)
        case .orange: return Color(hex: 0xFFD3B8)
        case .pink: return Color(hex: 0xF6C6D8)
        }
    }
}

enum QuickStart: String, AppEnum {
    case tooMany, oneTask, distracted, overwhelmed

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Quick start"
    static let caseDisplayRepresentations: [QuickStart: DisplayRepresentation] = [
        .tooMany: "Too many things to do",
        .oneTask: "Start one task",
        .distracted: "Got distracted again",
        .overwhelmed: "Feeling overwhelmed",
    ]

    var label: String {
        switch self {
        case .tooMany: return "Too many things"
        case .oneTask: return "Start one task"
        case .distracted: return "Got distracted"
        case .overwhelmed: return "Feeling overwhelmed"
        }
    }

    // Same text as the quick-start tiles in the app (app/moods.tsx).
    var task: String {
        switch self {
        case .tooMany: return "I have too many things to do"
        case .oneTask: return "I need to start one task"
        case .distracted: return "I got distracted again"
        case .overwhelmed: return "I feel overwhelmed"
        }
    }

    var colour: WidgetColour {
        switch self {
        case .tooMany: return .purple
        case .oneTask: return .blue
        case .distracted: return .orange
        case .overwhelmed: return .pink
        }
    }

    // Opens the app straight on this step (SceneDelegate.swift handles startnow:// links).
    var link: URL {
        var parts = URLComponents()
        parts.scheme = "startnow"
        parts.host = "stuck"
        parts.queryItems = [URLQueryItem(name: "task", value: task)]
        return parts.url ?? URL(string: "startnow://stuck")!
    }
}

struct StartNowWidgetIntent: WidgetConfigurationIntent {
    static let title: LocalizedStringResource = "Start Now"
    static let description = IntentDescription("Your streak and one-tap quick starts.")

    @Parameter(title: "Colour", default: .green)
    var colour: WidgetColour

    @Parameter(title: "Show my streak", default: true)
    var showStreak: Bool

    @Parameter(title: "First quick start", default: .tooMany)
    var first: QuickStart

    @Parameter(title: "Second quick start", default: .oneTask)
    var second: QuickStart

    init() {}
}

// MARK: - The data behind it

struct StartNowWidgetEntry: TimelineEntry {
    let date: Date
    let config: StartNowWidgetIntent
    let streak: Int? // nil: the app hasn't shared a streak (or can't, without App Groups)
    let doneToday: Bool
}

private func dayString(_ date: Date) -> String {
    let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
}

// The streak as it stands on `date`: it only counts if the last step was that day or the day before.
private func streak(on date: Date) -> (count: Int?, doneToday: Bool) {
    guard let shared = UserDefaults(suiteName: startNowAppGroup), shared.bool(forKey: "streakKnown") else {
        return (nil, false)
    }
    let count = shared.integer(forKey: "streakCount")
    let lastDate = shared.string(forKey: "streakLastDate")
    let today = dayString(date)
    let yesterday = dayString(Calendar.current.date(byAdding: .day, value: -1, to: date) ?? date)
    let doneToday = lastDate == today
    let alive = doneToday || lastDate == yesterday
    return (alive ? count : 0, doneToday)
}

struct StartNowWidgetProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> StartNowWidgetEntry {
        StartNowWidgetEntry(date: .now, config: StartNowWidgetIntent(), streak: 4, doneToday: false)
    }

    func snapshot(for configuration: StartNowWidgetIntent, in context: Context) async -> StartNowWidgetEntry {
        let now = streak(on: .now)
        // In the widget gallery, show an example streak if there isn't a real one yet.
        let count = context.isPreview ? (now.count ?? 4) : now.count
        return StartNowWidgetEntry(date: .now, config: configuration, streak: count, doneToday: now.doneToday)
    }

    // One entry now and one just after midnight, when "done today" and the streak can change.
    func timeline(for configuration: StartNowWidgetIntent, in context: Context) async -> Timeline<StartNowWidgetEntry> {
        let now = Date()
        let tomorrow = Calendar.current.startOfDay(for: Calendar.current.date(byAdding: .day, value: 1, to: now) ?? now)
        let entries = [now, tomorrow.addingTimeInterval(1)].map { date -> StartNowWidgetEntry in
            let s = streak(on: date)
            return StartNowWidgetEntry(date: date, config: configuration, streak: s.count, doneToday: s.doneToday)
        }
        return Timeline(entries: entries, policy: .after(tomorrow.addingTimeInterval(86_400)))
    }
}

// MARK: - The looks

private struct Mark: View {
    var size: CGFloat
    var stroke: Color = .white
    var dot: Color

    var body: some View {
        Canvas { context, canvasSize in
            let s = canvasSize.width / 24
            var path = Path()
            path.move(to: CGPoint(x: 4 * s, y: 19 * s))
            path.addCurve(to: CGPoint(x: 16.5 * s, y: 8 * s), control1: CGPoint(x: 9 * s, y: 19 * s), control2: CGPoint(x: 14 * s, y: 15 * s))
            context.stroke(path, with: .color(stroke), style: StrokeStyle(lineWidth: 2.8 * s, lineCap: .round))
            context.fill(Path(ellipseIn: CGRect(x: 13.8 * s, y: 1.3 * s, width: 8.4 * s, height: 8.4 * s)), with: .color(dot))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

private struct StreakBlock: View {
    let entry: StartNowWidgetEntry
    var numberSize: CGFloat

    var body: some View {
        if entry.config.showStreak, let count = entry.streak, count > 0 {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(count)")
                    .font(.system(size: numberSize, weight: .semibold, design: .serif))
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                Text("day streak")
                    .font(.system(size: 14, weight: .bold))
                Text(entry.doneToday ? "Done today. Nice work." : "Tap for your next step")
                    .font(.system(size: 11, weight: .medium))
                    .opacity(0.88)
            }
        } else if entry.config.showStreak, entry.streak == 0 {
            VStack(alignment: .leading, spacing: 4) {
                Text("Start a streak today")
                    .font(.system(size: 20, weight: .semibold, design: .serif))
                Text("One small step is all it takes")
                    .font(.system(size: 11, weight: .medium))
                    .opacity(0.88)
            }
        } else {
            VStack(alignment: .leading, spacing: 4) {
                Text("What's on your mind?")
                    .font(.system(size: 22, weight: .semibold, design: .serif))
                    .minimumScaleFactor(0.8)
                Text("Tap for one small step")
                    .font(.system(size: 11, weight: .medium))
                    .opacity(0.88)
            }
        }
    }
}

private struct QuickStartButton: View {
    let quick: QuickStart
    var tall: CGFloat = 54

    var body: some View {
        Link(destination: quick.link) {
            Text(quick.label)
                .font(.system(size: 13, weight: .bold))
                .lineLimit(2)
                .minimumScaleFactor(0.85)
                .frame(maxWidth: .infinity, minHeight: tall, alignment: .leading)
                .padding(.horizontal, 12)
                .background(RoundedRectangle(cornerRadius: 15).fill(Color.white.opacity(0.18)))
                .overlay(RoundedRectangle(cornerRadius: 15).stroke(Color.white.opacity(0.3), lineWidth: 1))
        }
    }
}

private struct SmallView: View {
    let entry: StartNowWidgetEntry

    var body: some View {
        VStack(alignment: .leading) {
            Mark(size: 24, dot: entry.config.colour.dot)
            Spacer(minLength: 0)
            StreakBlock(entry: entry, numberSize: 48)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .foregroundStyle(.white)
        .widgetURL(URL(string: "startnow://stuck"))
    }
}

private struct MediumView: View {
    let entry: StartNowWidgetEntry

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading) {
                HStack(spacing: 6) {
                    Mark(size: 18, dot: entry.config.colour.dot)
                    Text("Start Now").font(.system(size: 13, weight: .bold))
                }
                Spacer(minLength: 0)
                StreakBlock(entry: entry, numberSize: 42)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            VStack(spacing: 8) {
                QuickStartButton(quick: entry.config.first)
                QuickStartButton(quick: entry.config.second)
            }
            .frame(width: 150)
        }
        .foregroundStyle(.white)
        .widgetURL(URL(string: "startnow://stuck"))
    }
}

private struct LargeView: View {
    let entry: StartNowWidgetEntry
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        VStack(spacing: 10) {
            HStack {
                HStack(spacing: 6) {
                    Mark(size: 20, stroke: scheme == .dark ? Color(hex: 0x7CCBB2) : Color(hex: 0x2F6F5E), dot: Color(hex: 0x3D8B76))
                    Text("Start Now").font(.system(size: 14, weight: .heavy))
                }
                Spacer()
                if entry.config.showStreak, let count = entry.streak, count > 0 {
                    Text("\(count) day streak")
                        .font(.system(size: 13, weight: .heavy))
                        .foregroundStyle(scheme == .dark ? Color(hex: 0x7CCBB2) : Color(hex: 0x2F6F5E))
                        .padding(.horizontal, 12)
                        .frame(height: 28)
                        .background(Capsule().fill(Color(hex: 0x3D8B76).opacity(0.16)))
                }
            }
            Link(destination: URL(string: "startnow://stuck")!) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("RIGHT NOW").font(.system(size: 11, weight: .bold)).kerning(0.9).opacity(0.88)
                    Spacer(minLength: 0)
                    Text("What's on your mind?").font(.system(size: 24, weight: .semibold, design: .serif))
                    Text("Tap to write it down…")
                        .font(.system(size: 13))
                        .opacity(0.92)
                        .frame(maxWidth: .infinity, minHeight: 36, alignment: .leading)
                        .padding(.horizontal, 12)
                        .background(RoundedRectangle(cornerRadius: 12).fill(Color.white.opacity(0.2)))
                }
                .foregroundStyle(.white)
                .padding(14)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 18).fill(entry.config.colour.gradient))
            }
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                ForEach([QuickStart.tooMany, .oneTask, .distracted, .overwhelmed], id: \.self) { quick in
                    Link(destination: quick.link) {
                        Text(quick.label)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                            .frame(maxWidth: .infinity, minHeight: 56, alignment: .bottomLeading)
                            .padding(10)
                            .background(RoundedRectangle(cornerRadius: 16).fill(quick.colour.gradient))
                    }
                }
            }
        }
        .foregroundStyle(scheme == .dark ? Color(hex: 0xECE7DB) : Color(hex: 0x262421))
    }
}

struct StartNowWidgetView: View {
    let entry: StartNowWidgetEntry
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        switch family {
        case .systemLarge:
            LargeView(entry: entry)
                .containerBackground(for: .widget) { scheme == .dark ? Color(hex: 0x22201D) : Color(hex: 0xFBFAF5) }
        case .systemMedium:
            MediumView(entry: entry)
                .containerBackground(for: .widget) { entry.config.colour.gradient }
        default:
            SmallView(entry: entry)
                .containerBackground(for: .widget) { entry.config.colour.gradient }
        }
    }
}

struct StartNowHomeWidget: Widget {
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: "StartNowHomeWidget", intent: StartNowWidgetIntent.self, provider: StartNowWidgetProvider()) { entry in
            StartNowWidgetView(entry: entry)
        }
        .configurationDisplayName("Start Now")
        .description("Your streak and one-tap quick starts.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(red: Double((hex >> 16) & 0xFF) / 255, green: Double((hex >> 8) & 0xFF) / 255, blue: Double(hex & 0xFF) / 255)
    }
}
