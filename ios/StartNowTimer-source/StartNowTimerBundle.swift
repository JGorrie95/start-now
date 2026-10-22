import WidgetKit
import SwiftUI

// Everything this extension adds to the iPhone: the timer on the lock screen and in
// the Dynamic Island, and the home screen widget (small, medium and large).
@main
struct StartNowTimerBundle: WidgetBundle {
    var body: some Widget {
        StartNowTimerLiveActivity()
        StartNowHomeWidget()
    }
}
