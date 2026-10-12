// Small helpers for when the site is running inside the iPhone app.
// The iPhone app is a native shell (Capacitor) that opens this website, and it
// adds a `Capacitor` object to the page. In a normal browser that object does
// not exist, so every helper here quietly does nothing.

type Haptics = {
  impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
  notification: (options: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
};

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: { Haptics?: Haptics };
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
