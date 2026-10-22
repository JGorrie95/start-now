// Settings that are saved on this phone or computer (in the browser), so they work
// without signing in: the light/dark look and the alarm sound.
// Pages read them with useSyncExternalStore(subscribePreferences, getTheme, ...).
import { isNativeApp, setNativeAppearance } from "@/app/native";

export type ThemeChoice = "system" | "light" | "dark";
export type SoundId = "iphone" | "chimes" | "bell" | "bounce" | "beeps";

const THEME_KEY = "startnow-theme";
const SOUND_KEY = "startnow-alarm-sound";
const SOUND_IDS: SoundId[] = ["iphone", "chimes", "bell", "bounce", "beeps"];

// A copy in memory too, for private browsing where saving can fail.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Can't save (private browsing). It still works until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

export function subscribePreferences(callback: () => void) {
  listeners.add(callback);
  // A change made in another tab.
  const onStorage = (event: StorageEvent) => {
    if (!event.key?.startsWith("startnow-")) return;
    memory.delete(event.key);
    if (event.key === THEME_KEY) applyTheme();
    callback();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

// ---------- Light / dark ----------

export function getTheme(): ThemeChoice {
  const value = read(THEME_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

export function setTheme(choice: ThemeChoice) {
  write(THEME_KEY, choice);
  applyTheme(choice);
}

// Puts the choice on the page as <html data-theme="...">; globals.css does the rest.
// "system" takes it off again, so the phone or computer decides.
export function applyTheme(choice: ThemeChoice = getTheme()) {
  const root = document.documentElement;
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  // The colour of Safari's bar at the top follows along.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    if (meta.dataset.original === undefined) meta.dataset.original = meta.content;
    meta.content = choice === "system" ? meta.dataset.original : choice === "dark" ? "#171614" : "#2F6F5E";
  });
  setNativeAppearance(choice);
}

// ---------- Profile photo without an account ----------
// Saved only on this phone or computer (in the browser). It is never uploaded anywhere.

const PHOTO_KEY = "startnow-local-photo";

export function getLocalPhoto(): string | null {
  return read(PHOTO_KEY) || null;
}

export function setLocalPhoto(url: string | null) {
  write(PHOTO_KEY, url ?? "");
}

// ---------- Alarm sound ----------

// The iPhone's own alarm is only possible in the iPhone app, so the website starts on Chimes.
export function defaultSound(): SoundId {
  return isNativeApp() ? "iphone" : "chimes";
}

export function getSound(): SoundId {
  const value = read(SOUND_KEY) as SoundId | null;
  if (value && SOUND_IDS.includes(value) && (value !== "iphone" || isNativeApp())) return value;
  return defaultSound();
}

export function setSound(id: SoundId) {
  write(SOUND_KEY, id);
}
