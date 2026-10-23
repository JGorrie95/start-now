// Small helpers for when the site is running inside the iPhone app.
// The iPhone app is a native shell (Capacitor) that opens this website, and it
// adds a `Capacitor` object to the page. In a normal browser that object does
// not exist, so every helper here quietly does nothing.

type Haptics = {
  impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
  notification: (options: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
};

type LiveTimer = {
  start: (options: { step: string; totalSeconds: number; endsAt: number; soundOn: boolean; sound: string; message: string }) => Promise<{ started?: boolean; alarm?: boolean }>;
  setSound: (options: { soundOn: boolean }) => Promise<unknown>;
  addListener: (event: "soundChanged", callback: (data: { soundOn: boolean }) => void) => Promise<{ remove: () => void }> | { remove: () => void };
  pause: (options: { secondsLeft: number }) => Promise<unknown>;
  resume: (options: { endsAt: number }) => Promise<unknown>;
  end: (options: { done: boolean }) => Promise<unknown>;
  testAlarm?: (options: { sound: string; seconds: number; message: string }) => Promise<{ kind?: string }>;
};

type AppSettings = {
  setAppearance: (options: { mode: string }) => Promise<unknown>;
  setWidgetData?: (options: { count: number; lastDate: string | null }) => Promise<unknown>;
  setAppIcon?: (options: { name: string }) => Promise<{ ok?: boolean }>;
  getAppIcon?: () => Promise<{ name?: string }>;
  setReminders?: (options: {
    morningOn: boolean; morningMinutes: number; eveningOn: boolean; eveningMinutes: number;
    nudges: number; nudgeFrom: number; nudgeTo: number;
  }) => Promise<{ ok?: boolean; denied?: boolean }>;
  testReminder?: () => Promise<{ ok?: boolean; denied?: boolean }>;
  openNotificationSettings?: () => Promise<unknown>;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { Haptics?: Haptics; LiveTimer?: LiveTimer; AppSettings?: AppSettings };
};

function bridge(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
}

export function isNativeApp(): boolean {
  try {
    return !!bridge()?.isNativePlatform?.();
  } catch {
    return false;
  }
}

// A tiny tick, like tapping a key on the iPhone keyboard.
export function tapHaptic() {
  try {
    void bridge()?.Plugins?.Haptics?.impact({ style: "LIGHT" })?.catch(() => {});
  } catch {
    // No haptics available. That is fine.
  }
}

// A happy double-tap, for finishing something.
export function successHaptic() {
  try {
    void bridge()?.Plugins?.Haptics?.notification({ type: "SUCCESS" })?.catch(() => {});
  } catch {
    // No haptics available. That is fine.
  }
}

// The timer on the lock screen and in the Dynamic Island (iPhone app only).
// Times are milliseconds since 1970, the same as Date.now().
function liveTimerPlugin(): LiveTimer | undefined {
  try {
    return bridge()?.Plugins?.LiveTimer;
  } catch {
    return undefined;
  }
}

export const lockScreenTimer = {
  // Resolves true when the iPhone itself will sound the alarm at the end
  // (then the page doesn't need to play its own sound).
  // sound: which alarm sound was picked in Settings (see sounds.ts).
  async start(step: string, totalSeconds: number, endsAt: number, soundOn: boolean, sound: string, message = ""): Promise<boolean> {
    if (!isNativeApp()) return false;
    // These [StartNow] lines show up in Xcode's console, to help check the iPhone app.
    const plugin = liveTimerPlugin();
    if (!plugin) {
      console.log("[StartNow] lock screen timer: the LiveTimer part is missing from this app build");
      return false;
    }
    try {
      const reply = await plugin.start({ step, totalSeconds, endsAt, soundOn, sound, message });
      console.log(`[StartNow] lock screen timer reply: ${JSON.stringify(reply)}`);
      return !!reply?.alarm;
    } catch (error) {
      console.log(`[StartNow] lock screen timer error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  },
  setSound(soundOn: boolean) {
    void liveTimerPlugin()?.setSound?.({ soundOn })?.catch(() => {});
  },
  // Hears the alarm/mute button on the lock screen and in the Dynamic Island.
  onSoundChange(callback: (soundOn: boolean) => void): () => void {
    const plugin = liveTimerPlugin();
    if (!plugin?.addListener) return () => {};
    let handle: { remove: () => void } | null = null;
    let cancelled = false;
    void Promise.resolve(plugin.addListener("soundChanged", (data) => callback(!!data?.soundOn))).then((h) => {
      handle = h;
      if (cancelled) h.remove();
    });
    return () => {
      cancelled = true;
      handle?.remove();
    };
  },
  pause(secondsLeft: number) {
    void liveTimerPlugin()?.pause({ secondsLeft })?.catch(() => {});
  },
  resume(endsAt: number) {
    void liveTimerPlugin()?.resume({ endsAt })?.catch(() => {});
  },
  // done: true shows "You started." for a moment before it goes away.
  end(done = false) {
    void liveTimerPlugin()?.end({ done })?.catch(() => {});
  },
};

// Settings > "Test my alarm": the real iPhone alarm rings in a few seconds.
// "alarm": the loud alarm is set. "notification": alarms are switched off, so a normal
// notification will show instead. "update": this copy of the app is too old to test.
export async function testPhoneAlarm(sound: string, seconds = 5, message = ""): Promise<"alarm" | "notification" | "off" | "update"> {
  const plugin = liveTimerPlugin();
  if (!plugin?.testAlarm) return "update";
  try {
    const reply = await plugin.testAlarm({ sound, seconds, message });
    if (reply?.kind === "alarm" || reply?.kind === "notification") return reply.kind;
    return "off";
  } catch {
    return "update";
  }
}

// Light, dark or automatic for the iPhone parts around the page too (like the clock and
// battery at the top), so they always stay readable.
export function setNativeAppearance(mode: "system" | "light" | "dark") {
  try {
    void bridge()?.Plugins?.AppSettings?.setAppearance({ mode })?.catch(() => {});
  } catch {
    // Older copy of the app. The page itself still switches.
  }
}

// The home screen widget shows your streak. This hands it the latest numbers
// (iPhone app only; older copies of the app just ignore it).
export function syncWidget(count: number, lastDate: string | null) {
  try {
    void bridge()?.Plugins?.AppSettings?.setWidgetData?.({ count, lastDate })?.catch(() => {});
  } catch {
    // No widget support here. That is fine.
  }
}

// Settings > App icon (iPhone app only). Resolves false if this copy of the app can't switch icons.
// ---------- Reminders (Settings > Reminders) ----------

const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Sends the reminder choices to the iPhone, which schedules them on the phone.
// "ok": scheduled. "denied": notifications are switched off for the app in iPhone Settings.
// "update": this version of the app is too old to do reminders.
export async function applyReminders(r: {
  morningOn: boolean; morningTime: string; eveningOn: boolean; eveningTime: string;
  nudges: number; nudgeFrom: string; nudgeTo: string;
}): Promise<"ok" | "denied" | "update"> {
  try {
    const plugin = bridge()?.Plugins?.AppSettings;
    if (!plugin?.setReminders) return "update";
    const reply = await plugin.setReminders({
      morningOn: r.morningOn,
      morningMinutes: minutesOf(r.morningTime),
      eveningOn: r.eveningOn,
      eveningMinutes: minutesOf(r.eveningTime),
      nudges: r.nudges,
      nudgeFrom: minutesOf(r.nudgeFrom),
      nudgeTo: minutesOf(r.nudgeTo),
    });
    return reply?.denied ? "denied" : "ok";
  } catch {
    return "update";
  }
}

export async function sendTestReminder(): Promise<"ok" | "denied" | "update"> {
  try {
    const plugin = bridge()?.Plugins?.AppSettings;
    if (!plugin?.testReminder) return "update";
    const reply = await plugin.testReminder();
    return reply?.denied ? "denied" : "ok";
  } catch {
    return "update";
  }
}

export function openNotificationSettings() {
  try {
    void bridge()?.Plugins?.AppSettings?.openNotificationSettings?.()?.catch(() => {});
  } catch {
    // Nothing to do.
  }
}

export async function setAppIcon(name: string): Promise<boolean> {
  try {
    const reply = await bridge()?.Plugins?.AppSettings?.setAppIcon?.({ name });
    return !!reply?.ok;
  } catch {
    return false;
  }
}

export async function getAppIcon(): Promise<string | null> {
  try {
    const reply = await bridge()?.Plugins?.AppSettings?.getAppIcon?.();
    return reply?.name ?? null;
  } catch {
    return null;
  }
}
