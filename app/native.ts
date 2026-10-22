// Small helpers for when the site is running inside the iPhone app.
// The iPhone app is a native shell (Capacitor) that opens this website, and it
// adds a `Capacitor` object to the page. In a normal browser that object does
// not exist, so every helper here quietly does nothing.

type Haptics = {
  impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
  notification: (options: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
};

type LiveTimer = {
  start: (options: { step: string; totalSeconds: number; endsAt: number; soundOn: boolean }) => Promise<{ started?: boolean; alarm?: boolean }>;
  setSound: (options: { soundOn: boolean }) => Promise<unknown>;
  addListener: (event: "soundChanged", callback: (data: { soundOn: boolean }) => void) => Promise<{ remove: () => void }> | { remove: () => void };
  pause: (options: { secondsLeft: number }) => Promise<unknown>;
  resume: (options: { endsAt: number }) => Promise<unknown>;
  end: (options: { done: boolean }) => Promise<unknown>;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { Haptics?: Haptics; LiveTimer?: LiveTimer };
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
  // (then the page doesn't need to play its own chime).
  async start(step: string, totalSeconds: number, endsAt: number, soundOn: boolean): Promise<boolean> {
    if (!isNativeApp()) return false;
    // These [StartNow] lines show up in Xcode's console, to help check the iPhone app.
    const plugin = liveTimerPlugin();
    if (!plugin) {
      console.log("[StartNow] lock screen timer: the LiveTimer part is missing from this app build");
      return false;
    }
    try {
      const reply = await plugin.start({ step, totalSeconds, endsAt, soundOn });
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
