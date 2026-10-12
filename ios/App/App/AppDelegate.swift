import UIKit
import Capacitor
import ActivityKit

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
    }
    var step: String
    var totalSeconds: Int
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
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    @objc func start(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["started": false])
            return
        }
        let step = call.getString("step") ?? "Your one step"
        let totalSeconds = call.getInt("totalSeconds") ?? 300
        let endsAtMs = call.getDouble("endsAt") ?? (Date().timeIntervalSince1970 + Double(totalSeconds)) * 1000
        let state = StartNowTimerAttributes.ContentState(
            endsAt: Date(timeIntervalSince1970: endsAtMs / 1000), pausedSecondsLeft: nil, done: false)
        Task {
            await LiveTimerPlugin.endAll(dismissNow: true)
            do {
                _ = try Activity.request(
                    attributes: StartNowTimerAttributes(step: step, totalSeconds: totalSeconds),
                    content: ActivityContent(state: state, staleDate: state.endsAt.addingTimeInterval(120)))
                call.resolve(["started": true])
            } catch {
                call.reject("Could not start the lock screen timer: \(error.localizedDescription)")
            }
        }
    }

    @objc func pause(_ call: CAPPluginCall) {
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
            }
            call.resolve()
        }
    }

    // done: true shows "You started." for a moment before it disappears.
    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        let done = call.getBool("done") ?? false
        Task {
            await LiveTimerPlugin.endAll(dismissNow: !done)
            call.resolve()
        }
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
// Main.storyboard points at this class.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(LiveTimerPlugin())
    }
}
