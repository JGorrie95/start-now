import UIKit
import Capacitor
import ActivityKit
import AppIntents
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ application: UIApplication,
                     configurationForConnecting connectingSceneSession: UISceneSession,
                     options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let config = UISceneConfiguration(name: "Default Configuration",
                                          sessionRole: connectingSceneSession.role)
        config.delegateClass = SceneDelegate.self
        return config
    }
}

// MARK: - Start Now: lock screen & Dynamic Island timer (Live Activity)

// The data a running timer shows. The widget extension (StartNowTimer) has an
// identical copy of this struct; keep the two the same.
@available(iOS 16.2, *)
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

// The alarm/mute button on the lock screen and in the Dynamic Island.
// iPhone runs this inside the app, even when the app is in the background.
// The widget extension has a copy with the same name so it can show the button.
@available(iOS 17.0, *)
struct ToggleTimerSoundIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Turn the timer alarm on or off"

    init() {}

    func perform() async throws -> some IntentResult {
        await LiveTimerPlugin.toggleSound()
        return .result()
    }
}

// Lets the website start, pause, resume and end the timer on the lock screen.
// From the website it is called as window.Capacitor.Plugins.LiveTimer.start({...}).
@objc(LiveTimerPlugin)
public class LiveTimerPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveTimerPlugin"
    public let jsName = "LiveTimer"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "pause", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "resume", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSound", returnType: CAPPluginReturnPromise)
    ]

    // So the lock screen button can tell the open app that the sound changed.
    static weak var shared: LiveTimerPlugin?

    override public func load() {
        LiveTimerPlugin.shared = self
    }

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            print("[StartNow] LiveTimer: this iPhone is older than iOS 16.2")
            call.resolve(["started": false, "alarm": false, "reason": "old iOS"])
            return
        }
        let step = call.getString("step") ?? "Your one step"
        let totalSeconds = call.getInt("totalSeconds") ?? 300
        let soundOn = call.getBool("soundOn") ?? true
        let endsAtMs = call.getDouble("endsAt") ?? (Date().timeIntervalSince1970 + Double(totalSeconds)) * 1000
        let endsAt = Date(timeIntervalSince1970: endsAtMs / 1000)
        let state = StartNowTimerAttributes.ContentState(endsAt: endsAt, pausedSecondsLeft: nil, done: false, soundOn: soundOn)
        Task {
            // The alarm when time is up (asks for notification permission the first time).
            let alarm = await LiveTimerPlugin.allowAlarm()
            if alarm { LiveTimerPlugin.scheduleAlarm(endsAt: endsAt, soundOn: soundOn, step: step) }

            await LiveTimerPlugin.endAll(dismissNow: true)
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                print("[StartNow] LiveTimer: Live Activities are switched off for this app")
                call.resolve(["started": false, "alarm": alarm, "reason": "Live Activities switched off"])
                return
            }
            do {
                _ = try Activity.request(
                    attributes: StartNowTimerAttributes(step: step, totalSeconds: totalSeconds),
                    content: ActivityContent(state: state, staleDate: endsAt.addingTimeInterval(120)))
                print("[StartNow] LiveTimer: started on the lock screen (alarm: \(alarm))")
                call.resolve(["started": true, "alarm": alarm])
            } catch {
                print("[StartNow] LiveTimer: iOS refused: \(error)")
                call.resolve(["started": false, "alarm": alarm, "reason": error.localizedDescription])
            }
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
        LiveTimerPlugin.cancelAlarm()
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let secondsLeft = call.getInt("secondsLeft") ?? 0
        Task {
            for activity in Activity<StartNowTimerAttributes>.activities {
                var state = activity.content.state
                state.pausedSecondsLeft = secondsLeft
                await activity.update(ActivityContent(state: state, staleDate: nil))
            }
            call.resolve()
        }
    }

    @objc func resume(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let endsAtMs = call.getDouble("endsAt") ?? Date().timeIntervalSince1970 * 1000
        let endsAt = Date(timeIntervalSince1970: endsAtMs / 1000)
        Task {
            for activity in Activity<StartNowTimerAttributes>.activities {
                var state = activity.content.state
                state.endsAt = endsAt
                state.pausedSecondsLeft = nil
                await activity.update(ActivityContent(state: state, staleDate: endsAt.addingTimeInterval(120)))
                LiveTimerPlugin.scheduleAlarm(endsAt: endsAt, soundOn: state.soundOn, step: activity.attributes.step)
            }
            call.resolve()
        }
    }

    // done: true shows "You started." for a moment before it goes away.
    @objc func end(_ call: CAPPluginCall) {
        LiveTimerPlugin.cancelAlarm()
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let done = call.getBool("done") ?? false
        Task {
            await LiveTimerPlugin.endAll(dismissNow: !done)
            call.resolve()
        }
    }

    // The website's own sound switch.
    @objc func setSound(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let soundOn = call.getBool("soundOn") ?? true
        Task {
            await LiveTimerPlugin.applySound(soundOn)
            call.resolve()
        }
    }

    // MARK: Helpers

    @available(iOS 16.2, *)
    static func toggleSound() async {
        guard let current = Activity<StartNowTimerAttributes>.activities.first?.content.state.soundOn else { return }
        await applySound(!current)
        let on = !current
        await MainActor.run {
            LiveTimerPlugin.shared?.notifyListeners("soundChanged", data: ["soundOn": on])
        }
        print("[StartNow] LiveTimer: alarm switched \(on ? "on" : "off") from the lock screen")
    }

    @available(iOS 16.2, *)
    static func applySound(_ soundOn: Bool) async {
        for activity in Activity<StartNowTimerAttributes>.activities {
            var state = activity.content.state
            state.soundOn = soundOn
            await activity.update(ActivityContent(state: state, staleDate: activity.content.staleDate))
            if state.pausedSecondsLeft == nil && !state.done {
                scheduleAlarm(endsAt: state.endsAt, soundOn: soundOn, step: activity.attributes.step)
            }
        }
    }

    static let alarmId = "startnow.timer.end"

    static func allowAlarm() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        switch settings.authorizationStatus {
        case .authorized, .provisional, .ephemeral:
            return true
        case .notDetermined:
            return (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        default:
            return false
        }
    }

    // A notification at the moment the timer ends. With sound on it plays the
    // iPhone's alert sound (it follows the ring/silent switch); muted, it just shows quietly.
    static func scheduleAlarm(endsAt: Date, soundOn: Bool, step: String) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [alarmId])
        let seconds = endsAt.timeIntervalSinceNow
        guard seconds > 1 else { return }
        let content = UNMutableNotificationContent()
        content.title = "Time's up. You started."
        content.body = step
        content.sound = soundOn ? .default : nil
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: seconds, repeats: false)
        center.add(UNNotificationRequest(identifier: alarmId, content: content, trigger: trigger))
    }

    static func cancelAlarm() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [alarmId])
    }

    @available(iOS 16.2, *)
    static func endAll(dismissNow: Bool) async {
        for activity in Activity<StartNowTimerAttributes>.activities {
            var state = activity.content.state
            state.pausedSecondsLeft = 0
            state.done = !dismissNow
            await activity.end(
                ActivityContent(state: state, staleDate: nil),
                dismissalPolicy: dismissNow ? .immediate : .after(Date().addingTimeInterval(30)))
        }
    }
}

// The app's main screen. Same as Capacitor's, plus our LiveTimer plugin.
// SceneDelegate.swift starts the app with this screen.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LiveTimerPlugin())
        print("[StartNow] LiveTimer plugin registered")
    }
}
