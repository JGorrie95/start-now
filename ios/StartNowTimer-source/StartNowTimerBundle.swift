import WidgetKit
import SwiftUI

// Everything this extension adds to the iPhone. For now: the timer on the
// lock screen and in the Dynamic Island. Home screen widgets can join later.
@main
struct StartNowTimerBundle: WidgetBundle {
    var body: some Widget {
        StartNowTimerLiveActivity()
    }
}
