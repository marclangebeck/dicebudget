import UIKit
import Capacitor

/// UIScene-Lifecycle für iOS 27 / Xcode 27 (sonst schwarzer Screen beim Start).
/// Fenster kommt aus Main.storyboard (CAPBridgeViewController); Deep Links weiter an Capacitor.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard scene is UIWindowScene else { return }

    if !connectionOptions.urlContexts.isEmpty {
      self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    }
    if let userActivity = connectionOptions.userActivities.first(where: { $0.webpageURL != nil })
      ?? connectionOptions.userActivities.first
    {
      self.scene(scene, continue: userActivity)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      _ = ApplicationDelegateProxy.shared.application(
        UIApplication.shared,
        open: context.url,
        options: [:]
      )
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = ApplicationDelegateProxy.shared.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
