import ActivityKit
import AppIntents
import WidgetKit
import SwiftUI

// Must match the copy in the app (App/AppDelegate.swift) exactly.
struct StartNowTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var endsAt: Date
        var pausedSecondsLeft: Int?
        var done: Bool
        var soundOn: Bool
    }
    var step: String
    var totalSeconds: Int
}

// The alarm/mute button. iPhone runs the real action inside the app
// (App/AppDelegate.swift has the working copy with the same name).
@available(iOS 17.0, *)
struct ToggleTimerSoundIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Turn the timer alarm on or off"

    init() {}

    func perform() async throws -> some IntentResult {
        .result()
    }
}

private let mint = Color(red: 124 / 255, green: 203 / 255, blue: 178 / 255)
private let night = Color(red: 20 / 255, green: 28 / 255, blue: 26 / 255)

// The Start Now logo: a curved stroke rising to a dot.
struct SparkMark: View {
    var size: CGFloat = 20
    var stroke: Color = .white
    var dot: Color = mint

    var body: some View {
        ZStack {
            Path { path in
                path.move(to: CGPoint(x: 4, y: 19))
                path.addCurve(to: CGPoint(x: 16.5, y: 8),
                              control1: CGPoint(x: 9, y: 19),
                              control2: CGPoint(x: 14, y: 15))
            }
            .stroke(stroke, style: StrokeStyle(lineWidth: 2.8, lineCap: .round))
            Circle()
                .fill(dot)
                .frame(width: 8.4, height: 8.4)
                .position(x: 18, y: 5.5)
        }
        .frame(width: 24, height: 24)
        .scaleEffect(size / 24)
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

// The countdown. While running, iOS counts it down by itself, every second,
// even when the app is closed. While paused or done it shows a fixed time.
struct TimerText: View {
    let state: StartNowTimerAttributes.ContentState

    var body: some View {
        if state.done {
            Text("Done")
        } else if let left = state.pausedSecondsLeft {
            Text(String(format: "%d:%02d", left / 60, left % 60))
        } else {
            Text(timerInterval: Date()...max(state.endsAt, Date()), countsDown: true)
        }
    }
}

// Tap to switch the "time's up" alarm between on and muted.
struct SoundButton: View {
    let soundOn: Bool

    var body: some View {
        if #available(iOS 17.0, *) {
            Button(intent: ToggleTimerSoundIntent()) {
                HStack(spacing: 5) {
                    Image(systemName: soundOn ? "bell.fill" : "bell.slash.fill")
                    Text(soundOn ? "Alarm on" : "Muted")
                }
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Capsule().fill(Color.white.opacity(soundOn ? 0.16 : 0.10)))
                .foregroundStyle(soundOn ? mint : Color.white.opacity(0.8))
            }
            .buttonStyle(.plain)
            .accessibilityLabel(soundOn ? "Alarm is on. Tap to mute." : "Alarm is muted. Tap to turn it on.")
        }
    }
}

struct TimerProgress: View {
    let context: ActivityViewContext<StartNowTimerAttributes>

    var body: some View {
        let state = context.state
        let total = Double(max(context.attributes.totalSeconds, 1))
        if state.done {
            ProgressView(value: 1, total: 1)
        } else if let left = state.pausedSecondsLeft {
            ProgressView(value: total - Double(left), total: total)
        } else {
            let start = state.endsAt.addingTimeInterval(-total)
            ProgressView(timerInterval: start...max(state.endsAt, start.addingTimeInterval(1)),
                         countsDown: false, label: { EmptyView() }, currentValueLabel: { EmptyView() })
        }
    }
}

struct StartNowTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: StartNowTimerAttributes.self) { context in
            // Lock screen (and the banner on iPhones without a Dynamic Island).
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 12) {
                    SparkMark(size: 30)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.done ? "You started." :
                             context.state.pausedSecondsLeft != nil ? "Paused" :
                             "Start Now · \(context.attributes.totalSeconds / 60) min")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.75))
                        TimerText(state: context.state)
                            .font(.system(size: 36, weight: .semibold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(.white)
                    }
                    Spacer(minLength: 0)
                    if !context.state.done {
                        SoundButton(soundOn: context.state.soundOn)
                    }
                }
                Text(context.attributes.step)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.92))
                    .lineLimit(2)
                TimerProgress(context: context)
                    .tint(mint)
            }
            .padding(16)
            .activityBackgroundTint(night.opacity(0.85))
            .activitySystemActionForegroundColor(mint)

        } dynamicIsland: { context in
            DynamicIsland {
                // Big version: press and hold the island.
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        SparkMark(size: 20)
                        Text("Start Now")
                            .font(.subheadline.weight(.semibold))
                    }
                    .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    TimerText(state: context.state)
                        .font(.title2.weight(.semibold))
                        .monospacedDigit()
                        .foregroundStyle(mint)
                        .multilineTextAlignment(.trailing)
                        .frame(maxWidth: 90, alignment: .trailing)
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(context.attributes.step)
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.9))
                            .lineLimit(2)
                        HStack(spacing: 12) {
                            TimerProgress(context: context)
                                .tint(mint)
                            if !context.state.done {
                                SoundButton(soundOn: context.state.soundOn)
                            }
                        }
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                // Small version, while you use other apps.
                SparkMark(size: 18)
            } compactTrailing: {
                TimerText(state: context.state)
                    .monospacedDigit()
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(mint)
                    .multilineTextAlignment(.trailing)
                    .frame(maxWidth: 46)
            } minimal: {
                SparkMark(size: 16)
            }
            .keylineTint(mint)
        }
    }
}
