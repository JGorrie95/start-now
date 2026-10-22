import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        // Opened by tapping the widget while the app was closed.
        if let link = connectionOptions.urlContexts.first?.url, let page = DeepLink.webURL(from: link) {
            DeepLink.pending = page
        }

        window = UIWindow(windowScene: windowScene)
        // MainViewController (in AppDelegate.swift) is Capacitor's screen plus our lock screen timer.
        window?.rootViewController = MainViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Tapped the widget while the app was already open.
        if let link = URLContexts.first?.url, let page = DeepLink.webURL(from: link) {
            (window?.rootViewController as? MainViewController)?.open(page)
            return
        }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
