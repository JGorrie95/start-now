// Settings that are saved on this phone or computer (in the browser), so they work
// without signing in: the light/dark look and the alarm sound.
// Pages read them with useSyncExternalStore(subscribePreferences, getTheme, ...).
import { isNativeApp, setNativeAppearance, syncWidget } from "@/app/native";

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

// ---------- Streak without an account ----------
// Saved only on this phone or computer, like the photo. People with a friends account
// keep their streak in the database instead, so friends can see it.

export type LocalStreak = { count: number; longest: number; lastDate: string | null };

const STREAK_KEY = "startnow-streak";
export const NO_STREAK: LocalStreak = { count: 0, longest: 0, lastDate: null };
let streakCache: { raw: string | null; value: LocalStreak } | null = null;

// Today's date on this phone, like "2026-10-21". offsetDays: -1 is yesterday.
export function localDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getLocalStreak(): LocalStreak {
  const raw = read(STREAK_KEY);
  if (streakCache && streakCache.raw === raw) return streakCache.value;
  let value = NO_STREAK;
  try {
    const saved = raw ? JSON.parse(raw) : null;
    if (saved) {
      value = {
        count: Math.max(0, Math.floor(Number(saved.count) || 0)),
        longest: Math.max(0, Math.floor(Number(saved.longest) || 0)),
        lastDate: typeof saved.lastDate === "string" ? saved.lastDate : null,
      };
    }
  } catch {
    // Damaged save: start fresh.
  }
  streakCache = { raw, value };
  return value;
}

export function saveLocalStreak(streak: LocalStreak) {
  write(STREAK_KEY, JSON.stringify(streak));
  syncWidget(streak.count, streak.lastDate);
}

// What a streak shows right now. It only counts if the last step was today or yesterday.
export function streakNow(streak: { count: number; longest: number; lastDate: string | null }) {
  const doneToday = streak.lastDate === localDate(0);
  const alive = doneToday || streak.lastDate === localDate(-1);
  return { count: alive ? streak.count : 0, longest: streak.longest, doneToday };
}

// "I did it!" without an account.
export function completeLocalStep(): { alreadyDone: boolean; streak: number; longest: number } {
  const saved = getLocalStreak();
  const today = localDate(0);
  if (saved.lastDate === today) return { alreadyDone: true, streak: saved.count, longest: saved.longest };
  const count = saved.lastDate === localDate(-1) ? saved.count + 1 : 1;
  const longest = Math.max(count, saved.longest);
  saveLocalStreak({ count, longest, lastDate: today });
  return { alreadyDone: false, streak: count, longest };
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
