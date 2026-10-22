"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { completeStep } from "@/app/actions";
import { colors, fonts, tint, cardSurface, pageBg } from "@/app/theme";
import { BackButton } from "@/app/back-button";
import { SparkMark } from "@/app/spark-mark";
import { successHaptic, lockScreenTimer } from "@/app/native";
import { moods, moodFor, quickStartFor, type Mood } from "@/app/moods";
import { getSound, type SoundId } from "@/app/preferences";
import { unlockAudio, loadSound, ringAlarm, stopAlarm } from "@/app/sounds";

type StepVariant = { step: string; reason: string };
type Category = { test: (lower: string) => boolean; options: [StepVariant, StepVariant]; smaller: StepVariant };

const categories: Category[] = [
  {
    test: (s) => s.includes("laundry") || s.includes("clothes") || s.includes("washing"),
    options: [
      { step: "Put one load of laundry in the washer.", reason: "It takes about 2 minutes and creates an easy, visible win." },
      { step: "Gather any dirty clothes from the floor into one pile.", reason: "You don't have to wash anything yet — just corral it into one spot." },
    ],
    smaller: { step: "Just pick up one piece of clothing off the floor.", reason: "One item. That's the whole task right now." },
  },
  {
    test: (s) => s.includes("email") || s.includes("inbox") || s.includes("reply"),
    options: [
      { step: "Open the email and write one messy first sentence.", reason: "You don't need to finish it — starting removes the hardest part." },
      { step: "Open your inbox and just read the subject lines — nothing else.", reason: "Seeing what's actually there is often less scary than imagining it." },
    ],
    smaller: { step: "Just open your email app. You don't have to read anything yet.", reason: "Opening it is the whole step." },
  },
  {
    test: (s) => s.includes("clean") || s.includes("mess") || s.includes("tidy"),
    options: [
      { step: "Clear one small surface for 3 minutes.", reason: "A tiny clean area helps your brain feel less chaotic." },
      { step: "Pick up 5 things and put each one where it belongs.", reason: "A handful of small decisions is easier than deciding on the whole room." },
    ],
    smaller: { step: "Just pick up one item and put it away.", reason: "One thing. Then you're done for now." },
  },
  {
    test: (s) => s.includes("call") || s.includes("phone") || s.includes("dentist"),
    options: [
      { step: "Write down the phone number and what you need to say.", reason: "Preparing the first line makes the call feel less overwhelming." },
      { step: "Look up the number and save it in your phone.", reason: "Having it ready removes one excuse to put the call off." },
    ],
    smaller: { step: "Just find the phone number. That's it.", reason: "You don't have to call yet — just have it ready." },
  },
  {
    test: (s) => s.includes("groceries") || s.includes("food") || s.includes("shopping"),
    options: [
      { step: "Write down 3 things you actually need right now.", reason: "A tiny list is far easier to act on than a full grocery plan." },
      { step: "Open the fridge and notice what's actually missing.", reason: "Seeing the gap is easier than planning a whole trip." },
    ],
    smaller: { step: "Just write down one thing you need.", reason: "One item on the list still counts." },
  },
  {
    test: (s) => s.includes("study") || s.includes("school") || s.includes("homework"),
    options: [
      { step: "Open the material and read the first heading only.", reason: "Seeing the first small piece helps your brain enter the task." },
      { step: "Get your book or laptop out and put it in front of you.", reason: "Being physically ready lowers the barrier to starting." },
    ],
    smaller: { step: "Just open the document or book. Nothing else yet.", reason: "Opening it is the whole task." },
  },
  {
    test: (s) => s.includes("work") || s.includes("project") || s.includes("deadline"),
    options: [
      { step: "Write the first sentence or first bullet point — even rough.", reason: "A rough start gives your brain something to build from." },
      { step: "Open the file and give it a title, even a placeholder one.", reason: "Naming it makes it feel real without demanding progress yet." },
    ],
    smaller: { step: "Just open the file and put your cursor on the page.", reason: "That's genuinely enough for now." },
  },
  {
    test: (s) => s.includes("bill") || s.includes("money") || s.includes("finance"),
    options: [
      { step: "Open the bill or account page without trying to solve everything.", reason: "Seeing the first detail reduces uncertainty and makes action easier." },
      { step: "Find the bill and put it somewhere you'll actually see it.", reason: "Getting it out of hiding is most of the battle." },
    ],
    smaller: { step: "Just locate the bill. You don't have to open it yet.", reason: "Finding it counts as progress." },
  },
  {
    test: (s) => s.includes("overwhelm") || s.includes("too much") || s.includes("stressed"),
    options: [
      { step: "Write down the one thing that feels most urgent right now.", reason: "Getting it out of your head and onto paper reduces the mental load." },
      { step: "Set a timer for 2 minutes and just breathe before doing anything.", reason: "Your brain works better once the panic settles a little." },
    ],
    smaller: { step: "Just write down one word for what's on your mind.", reason: "One word. That's the whole step." },
  },
];

const fallbackCategory: Category = {
  test: () => true,
  options: [
    { step: "Pick the easiest thing on your list and do it for just 5 minutes.", reason: "Starting small lowers pressure and creates real momentum." },
    { step: "Choose literally anything small and do it for 2 minutes.", reason: "It doesn't need to be the 'right' thing — just a thing." },
  ],
  smaller: { step: "Just do 60 seconds of it. Set a timer if that helps.", reason: "One minute is still a real start." },
};

function matchCategory(input: string): Category {
  const lower = input.toLowerCase();
  return categories.find((c) => c.test(lower)) ?? fallbackCategory;
}

type DoneState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; streak: number }
  | { status: "alreadyDone"; streak: number }
  | { status: "unauthenticated" };

function Confetti() {
  const pieceColors = ["#FBFAF5", "#9FD9C6", "#B5A5C0", "#E59A5C", "#8FB3E3", "#F2C66D"];
  const pieces = Array.from({ length: 44 });
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 90, overflow: "hidden" }}>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.8 + Math.random() * 1.4;
        const size = 7 + Math.random() * 8;
        const color = pieceColors[i % pieceColors.length];
        const round = i % 3 === 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute", top: 0, left: `${left}%`,
              width: `${size}px`, height: `${round ? size : size * 0.55}px`,
              background: color, borderRadius: round ? "50%" : "2px",
              animation: `confetti-fall ${duration}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

const DURATION_OPTIONS = [2, 5, 10] as const;

type TimerStatus = "idle" | "running" | "paused" | "celebrating";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function encouragement(progress: number) {
  if (progress < 0.34) return "Just this. Nothing else.";
  if (progress < 0.67) return "You're in it now.";
  return "Almost there. Keep it gentle.";
}

const WHITE = "#FFFFFF";
const glassPill: React.CSSProperties = {
  height: "44px", padding: "0 16px", borderRadius: "22px", fontSize: "14px", fontWeight: 600,
  fontFamily: fonts.body, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px",
};
const bigWhiteButton = (deep: string): React.CSSProperties => ({
  flex: 1, height: "56px", borderRadius: "18px", border: "none", background: WHITE, color: deep,
  fontSize: "16px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
});
const bigGlassButton: React.CSSProperties = {
  flex: 1, height: "56px", borderRadius: "18px", fontSize: "16px", fontWeight: 700, fontFamily: fonts.body,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
};
const eyebrowOnColour: React.CSSProperties = { fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.88)" };

function CheckIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
  );
}

function JustStartTimer({ step, mood, onDone }: { step: string; mood: Mood; onDone: () => void }) {
  const [minutes, setMinutes] = useState<number>(5);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [secondsLeft, setSecondsLeft] = useState(5 * 60);
  const [soundOn, setSoundOn] = useState(true);
  const endAtRef = useRef(0);
  // The alarm sound picked in Settings, read when the timer starts.
  const soundRef = useRef<SoundId>("chimes");
  // True when the iPhone app will sound the alarm itself (it works even when the phone is locked).
  const phoneAlarmRef = useRef(false);

  const totalSeconds = minutes * 60;
  const colour = moods[mood];

  // Count down against the clock, not by counting ticks. Phones slow timers
  // down when the screen locks, so this keeps the time honest.
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setStatus("celebrating");
        if (soundOn && !phoneAlarmRef.current) ringAlarm(soundRef.current);
        if ("vibrate" in navigator) navigator.vibrate([120, 80, 120]);
        successHaptic();
        lockScreenTimer.end(true);
      }
    }, 250);
    return () => clearInterval(id);
  }, [status, soundOn]);

  // Show the time left in the browser tab, so you can see it from another tab.
  useEffect(() => {
    if (status !== "running") return;
    const original = document.title;
    document.title = `${formatTime(secondsLeft)} · Start Now`;
    return () => {
      document.title = original;
    };
  }, [status, secondsLeft]);

  // Browsers only allow sound after a tap, so we get the alarm sound ready on button presses.
  const prepareAudio = () => {
    if (unlockAudio()) void loadSound(soundRef.current);
  };

  const chooseMinutes = (m: number) => {
    setMinutes(m);
    setSecondsLeft(m * 60);
  };

  const start = () => {
    stopAlarm();
    soundRef.current = getSound();
    if (soundOn) prepareAudio();
    endAtRef.current = Date.now() + totalSeconds * 1000;
    setSecondsLeft(totalSeconds);
    setStatus("running");
    phoneAlarmRef.current = false;
    void lockScreenTimer.start(step, totalSeconds, endAtRef.current, soundOn, soundRef.current).then((phoneAlarm) => {
      phoneAlarmRef.current = phoneAlarm;
    });
  };

  const pause = () => {
    setStatus("paused");
    lockScreenTimer.pause(secondsLeft);
  };

  const resume = () => {
    endAtRef.current = Date.now() + secondsLeft * 1000;
    setStatus("running");
    lockScreenTimer.resume(endAtRef.current);
  };

  const reset = () => {
    stopAlarm();
    setSecondsLeft(totalSeconds);
    setStatus("idle");
    lockScreenTimer.end();
  };

  // "I'm done": close the timer and count the step as done.
  const finish = () => {
    stopAlarm();
    lockScreenTimer.end(true);
    setSecondsLeft(totalSeconds);
    setStatus("idle");
    onDone();
  };

  // Leaving this screen stops the timer here, so take it off the lock screen too.
  useEffect(
    () => () => {
      stopAlarm();
      lockScreenTimer.end();
    },
    [],
  );

  // The alarm/mute button on the lock screen or in the Dynamic Island updates this screen too.
  useEffect(
    () =>
      lockScreenTimer.onSoundChange((on) => {
        setSoundOn(on);
        if (!on) stopAlarm();
      }),
    [],
  );

  const toggleSound = () => {
    if (!soundOn) prepareAudio();
    else stopAlarm();
    const next = !soundOn;
    setSoundOn(next);
    lockScreenTimer.setSound(next);
  };

  if (status === "idle") {
    return (
      <div style={{ marginTop: "24px" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft }}>JUST START</div>
        <div role="group" aria-label="Timer length" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px", marginTop: "10px" }}>
          {DURATION_OPTIONS.map((m) => {
            const selected = m === minutes;
            return (
              <button
                key={m}
                onClick={() => chooseMinutes(m)}
                aria-pressed={selected}
                className="solid-press"
                style={{
                  height: "44px", borderRadius: "14px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body,
                  border: selected ? "none" : `1px solid ${tint(colors.ink, 0.14)}`,
                  background: selected ? colors.ink : colors.paper,
                  color: selected ? colors.mist : colors.inkSoft,
                }}
              >
                {m} min
              </button>
            );
          })}
        </div>
        <button onClick={start} className="solid-press" style={{ marginTop: "14px", width: "100%", height: "58px", borderRadius: "18px", border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "17px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box", fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: `0 10px 24px ${tint(colors.pineDeep, 0.28)}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
          Start the {minutes} minute timer
        </button>
        <div style={{ marginTop: "10px", textAlign: "center" }}>
          <button onClick={toggleSound} aria-pressed={soundOn} style={{ background: "none", border: "none", color: colors.inkSoft, fontSize: "14px", cursor: "pointer", padding: "10px", fontFamily: fonts.body }}>
            {soundOn ? "Alarm when time is up: on" : "Alarm when time is up: muted"}
          </button>
        </div>
      </div>
    );
  }

  const soundToggleOnColour = (
    <button onClick={toggleSound} aria-pressed={soundOn} style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.88)", fontSize: "14px", cursor: "pointer", padding: "10px", fontFamily: fonts.body }}>
      {soundOn ? "Alarm: on" : "Alarm: muted"}
    </button>
  );

  if (status === "running" || status === "paused") {
    const paused = status === "paused";
    const ringRadius = 110;
    const circumference = 2 * Math.PI * ringRadius;
    const progress = 1 - secondsLeft / totalSeconds;
    const offset = circumference * (secondsLeft / totalSeconds);
    return (
      <div className="fullscreen" role="dialog" aria-label="Timer" style={{ background: colour.background }}>
        <div style={{ maxWidth: "440px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <button onClick={reset} className="glass-button" style={{ ...glassPill, alignSelf: "flex-start" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            Stop early
          </button>

          <div style={{ ...eyebrowOnColour, marginTop: "28px" }}>JUST START · {minutes} MINUTES</div>

          <div style={{ position: "relative", width: "248px", height: "248px", marginTop: "20px", animation: paused ? "none" : "calm-breathe 4s ease-in-out infinite" }}>
            <svg width="248" height="248" viewBox="0 0 248 248" aria-hidden="true" style={{ opacity: paused ? 0.6 : 1 }}>
              <circle cx="124" cy="124" r={ringRadius} fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="14" />
              <circle
                cx="124" cy="124" r={ringRadius} fill="none" stroke={WHITE} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 124 124)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div role="timer" aria-label={`${formatTime(secondsLeft)} remaining`} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "64px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", fontFamily: fonts.body }}>{formatTime(secondsLeft)}</span>
              <span style={{ marginTop: "6px", fontSize: "15px", color: "rgba(255, 255, 255, 0.88)" }}>{paused ? "paused" : "left"}</span>
            </div>
          </div>

          <p style={{ margin: "14px 0 0", fontSize: "15px", color: "rgba(255, 255, 255, 0.9)" }}>
            {paused ? "No rush. Come back when you're ready." : encouragement(progress)}
          </p>
          <p style={{ margin: "18px 8px 0", textAlign: "center", fontSize: "19px", lineHeight: 1.4, fontWeight: 700 }}>{step}</p>

          <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "28px" }}>
            <button onClick={paused ? resume : pause} className="glass-button" style={bigGlassButton}>
              {paused ? (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" fill="currentColor" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" /></svg>
              )}
              {paused ? "Resume" : "Pause"}
            </button>
            <button onClick={finish} className="solid-press" style={bigWhiteButton(colour.deep)}>
              <CheckIcon color={colour.deep} />
              I&apos;m done
            </button>
          </div>

          <div className="app-only" style={{ marginTop: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "16px", background: "rgba(0, 0, 0, 0.18)", fontSize: "14px", lineHeight: 1.4, color: "rgba(255, 255, 255, 0.92)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              You can lock your phone. The timer keeps going.
            </div>
          </div>
          <div style={{ marginTop: "8px" }}>{soundToggleOnColour}</div>
        </div>
      </div>
    );
  }

  // Time is up.
  return (
    <div className="fullscreen" role="dialog" aria-label="Time is up" style={{ background: moods.lagoon.background }}>
      <div style={{ maxWidth: "440px", minHeight: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "streak-pop 0.5s ease-out" }}>
        <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0, 0, 0, 0.2)" }}>
          <CheckIcon size={42} color={moods.lagoon.deep} />
        </div>
        <h2 style={{ margin: "26px 0 8px", fontFamily: fonts.display, fontSize: "40px", lineHeight: 1.08, fontWeight: 500, letterSpacing: "-0.02em" }}>Time&apos;s up. You started.</h2>
        <p style={{ margin: 0, fontSize: "17px", lineHeight: 1.5, color: "rgba(255, 255, 255, 0.92)" }}>{minutes} minutes down. Keep going or stop here. Either way, you showed up.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "30px" }}>
          <button onClick={start} className="solid-press" style={{ ...bigWhiteButton(moods.lagoon.deep), flex: "none" }}>Keep going +{minutes} min</button>
          <button onClick={finish} className="glass-button" style={{ ...bigGlassButton, flex: "none" }}>
            <CheckIcon />
            Mark it done
          </button>
          <button onClick={reset} style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.88)", fontSize: "15px", cursor: "pointer", padding: "12px", fontFamily: fonts.body }}>Stop here</button>
        </div>
      </div>
    </div>
  );
}

function StuckContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskParam = searchParams.get("task") ?? "";
  const [text, setText] = useState(taskParam);
  const [sourceText, setSourceText] = useState(taskParam);
  const [category, setCategory] = useState<Category | null>(null);
  const [mainVariant, setMainVariant] = useState<0 | 1>(0);
  const [shrunk, setShrunk] = useState(false);
  const [doneState, setDoneState] = useState<DoneState>({ status: "idle" });
  const [postDoneChoice, setPostDoneChoice] = useState<"none" | "stopped">("none");

  useEffect(() => {
    if (taskParam.trim()) setCategory(matchCategory(taskParam));
  }, [taskParam]);

  const displayed = category ? (shrunk ? category.smaller : category.options[mainVariant]) : null;
  const mood = moodFor(sourceText);
  const colour = moods[mood];
  const quick = quickStartFor(sourceText);

  const resetStepState = () => {
    setDoneState({ status: "idle" });
    setPostDoneChoice("none");
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSourceText(text);
    setCategory(matchCategory(text));
    setMainVariant(0);
    setShrunk(false);
    resetStepState();
  };

  const tryDifferentStep = () => {
    setMainVariant((v) => (v === 0 ? 1 : 0));
    setShrunk(false);
    resetStepState();
  };

  const stillTooBig = () => {
    setShrunk(true);
    resetStepState();
  };

  const writeSomethingElse = () => {
    setCategory(null);
    setMainVariant(0);
    setShrunk(false);
    resetStepState();
  };

  const doOneMoreThing = () => {
    setText("");
    setSourceText("");
    writeSomethingElse();
  };

  const handleMarkDone = async () => {
    setDoneState({ status: "loading" });
    const res = await completeStep();
    if (res.error === "unauthenticated") {
      setDoneState({ status: "unauthenticated" });
    } else if ("alreadyDone" in res && res.alreadyDone) {
      setDoneState({ status: "alreadyDone", streak: res.streak ?? 0 });
    } else if ("streak" in res && res.streak !== undefined) {
      setDoneState({ status: "success", streak: res.streak });
      successHaptic();
    } else {
      setDoneState({ status: "idle" });
    }
  };

  return (
    <main className={displayed ? "bleed" : undefined} style={{ ...pageBg, padding: "40px 20px 80px" }}>
      <div className="grain-overlay" />
      <section style={{ maxWidth: "640px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {!displayed ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
              <BackButton />
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "0 auto 20px" }}>
              <SparkMark size={40} />
            </div>
            <h1 style={{ fontSize: "clamp(36px, 7vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.03em", margin: "0 0 14px 0", fontWeight: 500, fontFamily: fonts.display }}>Let&apos;s get unstuck.</h1>
            <p style={{ fontSize: "17px", color: colors.inkSoft, maxWidth: "480px", margin: "0 auto 28px", lineHeight: 1.6 }}>Write down what feels heavy right now. We&apos;ll turn it into one small, doable next step.</p>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "28px", padding: "22px", background: moods.lagoon.background, textAlign: "left", boxShadow: "0 18px 40px rgba(31, 90, 75, 0.3)" }}>
              <label htmlFor="heavy" style={{ ...eyebrowOnColour, display: "block", marginBottom: "10px" }}>WHAT FEELS HEAVY?</label>
              <textarea id="heavy" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="e.g. laundry, emails, groceries..." className="glass-field" style={{ width: "100%", minHeight: "130px", padding: "16px", borderRadius: "16px", fontSize: "16px", lineHeight: 1.6, resize: "none", boxSizing: "border-box", fontFamily: fonts.body, display: "block" }} />
              <button onClick={handleSubmit} disabled={!text.trim()} className="solid-press" style={{ marginTop: "12px", width: "100%", height: "52px", borderRadius: "16px", border: "none", background: WHITE, color: moods.lagoon.deep, fontSize: "16px", fontWeight: 700, cursor: text.trim() ? "pointer" : "not-allowed", opacity: text.trim() ? 1 : 0.75, boxSizing: "border-box", fontFamily: fonts.body }}>Give Me My Next Step →</button>
            </div>
          </div>
        ) : (
          <>
            <div className="back-row">
              <BackButton />
            </div>

            {/* The step, on the colour of the feeling you picked */}
            <div className="mood-panel" style={{ position: "relative", overflow: "hidden", borderRadius: "28px", padding: "26px 22px 22px", background: colour.background, color: WHITE }}>
              <div aria-hidden="true" style={{ position: "absolute", top: "30px", right: "-70px", width: "220px", height: "220px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)" }} />
              <div style={{ position: "relative" }}>
                {quick && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", height: "30px", padding: "0 12px", borderRadius: "15px", background: "rgba(255, 255, 255, 0.18)", fontSize: "13px", fontWeight: 600, marginBottom: "18px" }}>
                    <quick.Icon size={14} />
                    {quick.label}
                  </div>
                )}
                <div style={eyebrowOnColour}>{shrunk ? "AN EVEN SMALLER STEP" : "YOUR NEXT STEP"}</div>
                <h1 style={{ margin: "8px 0 12px", fontSize: "28px", lineHeight: 1.18, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: fonts.body }}>{displayed.step}</h1>
                <p style={{ margin: 0, fontSize: "16px", lineHeight: 1.55, color: "rgba(255, 255, 255, 0.92)" }}>{displayed.reason}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "20px" }}>
                  <button onClick={tryDifferentStep} className="glass-button" style={glassPill}>Try a different step</button>
                  {!shrunk && <button onClick={stillTooBig} className="glass-button" style={glassPill}>Still too big?</button>}
                </div>
              </div>
            </div>

            <JustStartTimer key={displayed.step} step={displayed.step} mood={mood} onDone={handleMarkDone} />

            <div style={{ marginTop: "12px" }}>
              {(doneState.status === "idle" || doneState.status === "success") && (
                <button onClick={handleMarkDone} className="solid-press" style={{ width: "100%", height: "52px", borderRadius: "18px", border: `2px solid ${colors.pineDeep}`, background: "transparent", color: colors.pineDeep, fontSize: "16px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box", fontFamily: fonts.body, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <CheckIcon />
                  I did it! Mark as done
                </button>
              )}
              {doneState.status === "loading" && (
                <p style={{ textAlign: "center", color: colors.inkSoft, fontSize: "15px", margin: 0, padding: "14px 0" }}>Saving…</p>
              )}
              {doneState.status === "alreadyDone" && (
                <div style={{ ...cardSurface, padding: "16px 18px", textAlign: "center" }}>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: colors.pineDeep, margin: "0 0 4px" }}>Already marked for today</p>
                  <p style={{ fontSize: "14px", color: colors.inkSoft, margin: 0 }}>{doneState.streak} day streak. Come back tomorrow to make it {doneState.streak + 1}.</p>
                </div>
              )}
              {doneState.status === "unauthenticated" && (
                <div style={{ ...cardSurface, padding: "18px", textAlign: "center" }}>
                  <p style={{ fontSize: "15px", color: colors.inkSoft, margin: "0 0 12px", lineHeight: 1.5 }}>Nice work. Sign in to save your streak and cheer on friends.</p>
                  <button onClick={() => router.push("/auth")} className="solid-press" style={{ height: "48px", padding: "0 22px", borderRadius: "16px", border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Sign in →</button>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: "6px" }}>
              <button onClick={writeSomethingElse} style={{ background: "none", border: "none", color: colors.inkSoft, fontSize: "14px", cursor: "pointer", padding: "12px", fontFamily: fonts.body, textDecoration: "underline", textUnderlineOffset: "3px" }}>Write something else</button>
            </div>
          </>
        )}
      </section>

      {/* You did it: a full-screen celebration */}
      {doneState.status === "success" && (
        <div className="fullscreen" role="dialog" aria-label="You did it" style={{ background: moods.lagoon.background }}>
          {postDoneChoice === "none" && <Confetti />}
          <div style={{ maxWidth: "440px", minHeight: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", animation: "streak-pop 0.5s ease-out" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "50%", background: WHITE, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 40px rgba(0, 0, 0, 0.2)" }}>
              <CheckIcon size={46} color={moods.lagoon.deep} />
            </div>
            {postDoneChoice === "none" ? (
              <>
                <h2 style={{ margin: "28px 0 8px", fontFamily: fonts.display, fontSize: "44px", lineHeight: 1.05, fontWeight: 500, letterSpacing: "-0.02em" }}>You started.</h2>
                <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.5, color: "rgba(255, 255, 255, 0.92)" }}>That&apos;s the win. However small it felt, you did the thing you said you&apos;d do.</p>
                <div style={{ marginTop: "26px", padding: "14px 20px", borderRadius: "22px", background: "rgba(255, 255, 255, 0.14)", border: "1px solid rgba(255, 255, 255, 0.24)" }}>
                  <span style={{ display: "block", fontSize: "22px", fontWeight: 800, lineHeight: 1.15 }}>{doneState.streak} day streak</span>
                  <span style={{ display: "block", fontSize: "14px", color: "rgba(255, 255, 255, 0.9)" }}>{doneState.streak === 1 ? "Day one. Every streak starts here." : "Keep it going tomorrow."}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "32px" }}>
                  <button onClick={doOneMoreThing} className="solid-press" style={{ ...bigWhiteButton(moods.lagoon.deep), flex: "none" }}>Do one more thing →</button>
                  <button onClick={() => setPostDoneChoice("stopped")} className="glass-button" style={{ ...bigGlassButton, flex: "none" }}>Stop here, I&apos;m good</button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: "28px 0 8px", fontFamily: fonts.display, fontSize: "40px", lineHeight: 1.08, fontWeight: 500, letterSpacing: "-0.02em" }}>Good. Rest counts too.</h2>
                <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.5, color: "rgba(255, 255, 255, 0.92)" }}>See you tomorrow for day {doneState.streak + 1}.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "32px" }}>
                  <button onClick={() => router.push("/")} className="solid-press" style={{ ...bigWhiteButton(moods.lagoon.deep), flex: "none" }}>Back to home</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function StuckPage() {
  return <Suspense><StuckContent /></Suspense>;
}
