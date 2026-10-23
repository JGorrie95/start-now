// The alarm sounds you can pick in Settings, and the code that plays them on the page.
// The sound files live in public/sounds. The iPhone app carries its own copies, so its
// alarm can ring even when the app is closed and the phone is locked.
import type { Mood } from "@/app/moods";
import type { SoundId } from "@/app/preferences";

export type AlarmSound = {
  id: SoundId;
  name: string;
  detail: string;
  mood: Mood; // the colour of its little icon
  file?: string;
  previewFrom?: number; // where the 6 second preview starts, in seconds
  appOnly?: boolean;
};

export const alarmSounds: AlarmSound[] = [
  { id: "iphone", name: "iPhone alarm", detail: "The loudest. Rings until you tap Stop.", mood: "ember", appOnly: true },
  { id: "chimes", name: "Chimes", detail: "Gentle, and slowly gets louder", mood: "lagoon", file: "/sounds/chimes.mp3", previewFrom: 14 },
  { id: "bell", name: "Bell", detail: "A bright ding-ding", mood: "tide", file: "/sounds/bell.mp3" },
  { id: "bounce", name: "Bounce", detail: "Happy wooden notes", mood: "dusk", file: "/sounds/bounce.mp3" },
  { id: "beeps", name: "Beeps", detail: "A classic alarm clock", mood: "rose", file: "/sounds/beeps.mp3" },
];

// The file the page plays. The iPhone's own alarm sound can't play inside a web page,
// so if the page ever has to ring instead of the iPhone, it uses Beeps.
function fileFor(id: SoundId) {
  const sound = alarmSounds.find((s) => s.id === id);
  return sound?.file ?? "/sounds/beeps.mp3";
}

let context: AudioContext | null = null;

// Browsers only allow sound after a tap, so call this from a button press first.
export function unlockAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
}

const loaded = new Map<string, Promise<AudioBuffer | null>>();

// Downloads a sound once and keeps it ready, so it plays the moment it's needed.
export function loadSound(id: SoundId): Promise<AudioBuffer | null> {
  const ctx = context;
  if (!ctx) return Promise.resolve(null);
  const file = fileFor(id);
  let pending = loaded.get(file);
  if (!pending) {
    pending = fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error(`sound ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => {
        loaded.delete(file);
        return null;
      });
    loaded.set(file, pending);
  }
  return pending;
}

// Plays a sound and returns a function that stops it (with a quick fade, so no click).
function play(buffer: AudioBuffer, options: { from?: number; seconds?: number; onEnded?: () => void } = {}) {
  const ctx = context;
  if (!ctx) return () => {};
  const from = Math.min(options.from ?? 0, Math.max(0, buffer.duration - 1));
  const length = Math.min(options.seconds ?? buffer.duration, buffer.duration - from);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(1, now);
  if (options.seconds !== undefined) {
    gain.gain.setValueAtTime(1, now + Math.max(0, length - 0.5));
    gain.gain.linearRampToValueAtTime(0.0001, now + length);
  }
  source.onended = () => options.onEnded?.();
  source.start(now, from, length);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    try {
      const t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.15);
      source.stop(t + 0.16);
    } catch {
      // It had already finished.
    }
  };
}

// ---------- Previews in Settings ----------

let previewTurn = 0;
let stopPreview: (() => void) | null = null;

// Plays 6 seconds of a sound. Resolves false if it couldn't play.
export async function previewSound(id: SoundId, onEnded: () => void): Promise<boolean> {
  stopPreviewSound();
  const turn = ++previewTurn;
  if (!unlockAudio()) return false;
  const buffer = await loadSound(id);
  if (!buffer || turn !== previewTurn) return false;
  const sound = alarmSounds.find((s) => s.id === id);
  stopPreview = play(buffer, {
    from: sound?.previewFrom ?? 0,
    seconds: 6,
    onEnded: () => {
      if (turn === previewTurn) onEnded();
    },
  });
  return true;
}

export function stopPreviewSound() {
  previewTurn++;
  stopPreview?.();
  stopPreview = null;
}

// ---------- The timer's alarm on the page ----------
// Used when the iPhone isn't ringing the alarm itself (on the website, or if alarms are
// switched off for the app). Plays the whole sound, about 28 seconds, until a button is tapped.

let ringTurn = 0;
let stopRinging: (() => void) | null = null;

export function ringAlarm(id: SoundId) {
  stopAlarm();
  const turn = ringTurn;
  if (!unlockAudio()) return;
  void loadSound(id).then((buffer) => {
    if (turn !== ringTurn) return;
    if (buffer) stopRinging = play(buffer);
    else playBackupChime();
  });
}

export function stopAlarm() {
  ringTurn++;
  stopRinging?.();
  stopRinging = null;
}

// ---------- The trumpet when you finish a step ----------

const FANFARE = "/sounds/fanfare.mp3";
let fanfare: Promise<AudioBuffer | null> | null = null;

// Call from the tap on "I did it", so the sound is allowed and ready in time.
export function prepareFanfare() {
  const ctx = unlockAudio();
  if (!ctx || fanfare) return;
  fanfare = fetch(FANFARE)
    .then((response) => {
      if (!response.ok) throw new Error(`sound ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => {
      fanfare = null;
      return null;
    });
}

export function playFanfare() {
  prepareFanfare();
  void fanfare?.then((buffer) => {
    if (buffer) play(buffer);
  });
}

// Three soft notes, made on the spot, for when a sound file couldn't load (no internet).
function playBackupChime() {
  const ctx = context;
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const start = now + i * 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.4);
    });
  } catch {
    // Sound is a nice-to-have. If the browser refuses, stay quiet.
  }
}
