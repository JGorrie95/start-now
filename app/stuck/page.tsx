"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { completeStep } from "@/app/actions";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";

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
  const pieceColors = [colors.pineDeep, colors.pine, colors.slate, colors.heather, colors.ink, colors.paper];
  const pieces = Array.from({ length: 44 });
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60, overflow: "hidden" }}>
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

const JUST_START_SECONDS = 300;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function JustStartTimer() {
  const [status, setStatus] = useState<"idle" | "running" | "celebrating">("idle");
  const [secondsLeft, setSecondsLeft] = useState(JUST_START_SECONDS);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (status === "running" && secondsLeft <= 0) setStatus("celebrating");
  }, [status, secondsLeft]);

  const start = () => { setSecondsLeft(JUST_START_SECONDS); setStatus("running"); };
  const stopEarly = () => setStatus("idle");
  const keepGoing = () => { setSecondsLeft(JUST_START_SECONDS); setStatus("running"); };
  const stopProud = () => setStatus("idle");

  if (status === "idle") {
    return (
      <div style={{ marginTop: "12px" }}>
        <button onClick={start} style={{ width: "100%", padding: "15px 20px", borderRadius: radius.sm, border: "none", background: colors.pineDeep, color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box", fontFamily: fonts.body }}>
          ▶ Just Start — 5 minutes
        </button>
      </div>
    );
  }

  if (status === "running") {
    const ringRadius = 42;
    const circumference = 2 * Math.PI * ringRadius;
    const offset = circumference * (secondsLeft / JUST_START_SECONDS);
    return (
      <div style={{ marginTop: "12px", background: colors.paper, border: `1px solid ${tint(colors.ink, 0.07)}`, borderRadius: radius.md, padding: "24px", textAlign: "center", animation: "calm-breathe 4s ease-in-out infinite" }}>
        <svg width="96" height="96" viewBox="0 0 96 96" style={{ display: "block", margin: "0 auto 12px" }}>
          <circle cx="48" cy="48" r={ringRadius} fill="none" stroke={tint(colors.pine, 0.18)} strokeWidth="8" />
          <circle
            cx="48" cy="48" r={ringRadius} fill="none" stroke={colors.pineDeep} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <p style={{ fontSize: "32px", fontWeight: 700, fontFamily: fonts.display, fontVariantNumeric: "tabular-nums", margin: "0 0 6px" }}>{formatTime(Math.max(secondsLeft, 0))}</p>
        <p style={{ fontSize: "14px", color: colors.inkSoft, margin: "0 0 14px" }}>Just this. Five minutes.</p>
        <button onClick={stopEarly} style={{ background: "none", border: "none", color: colors.inkFaint, fontSize: "13px", cursor: "pointer", padding: 0, fontFamily: fonts.body }}>Stop early</button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "12px", background: `linear-gradient(135deg, ${tint(colors.pine, 0.16)}, ${tint(colors.pine, 0.05)})`, borderRadius: radius.sm, padding: "20px 16px", textAlign: "center", border: `1px solid ${tint(colors.pine, 0.3)}`, animation: "streak-pop 0.5s ease-out" }}>
      <p style={{ fontSize: "22px", fontWeight: 700, color: colors.pineDeep, margin: "0 0 6px", fontFamily: fonts.display }}>You started. That&apos;s the win.</p>
      <p style={{ fontSize: "13px", color: colors.inkSoft, margin: "0 0 16px", lineHeight: 1.5 }}>Five minutes down. Keep the momentum or stop here — either way, you showed up.</p>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={keepGoing} style={{ flex: 1, padding: "12px", borderRadius: radius.sm, border: `2px solid ${colors.pineDeep}`, background: "transparent", color: colors.pineDeep, fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Keep Going +5</button>
        <button onClick={stopProud} style={{ flex: 1, padding: "12px", borderRadius: radius.sm, border: "none", background: colors.pineDeep, color: "white", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>Stop, I&apos;m proud</button>
      </div>
    </div>
  );
}

const secondaryButton: React.CSSProperties = {
  padding: "14px", borderRadius: radius.sm, border: `2px solid ${colors.pineDeep}`, background: "transparent",
  color: colors.pineDeep, fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body, flex: 1,
};

const tertiaryLink: React.CSSProperties = {
  background: "none", border: "none", color: colors.inkFaint, fontSize: "13px", cursor: "pointer", padding: 0, fontFamily: fonts.body,
};

function StuckContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskParam = searchParams.get("task") ?? "";
  const [text, setText] = useState(taskParam);
  const [category, setCategory] = useState<Category | null>(null);
  const [mainVariant, setMainVariant] = useState<0 | 1>(0);
  const [shrunk, setShrunk] = useState(false);
  const [doneState, setDoneState] = useState<DoneState>({ status: "idle" });
  const [postDoneChoice, setPostDoneChoice] = useState<"none" | "stopped">("none");

  useEffect(() => {
    if (taskParam.trim()) setCategory(matchCategory(taskParam));
  }, [taskParam]);

  const displayed = category ? (shrunk ? category.smaller : category.options[mainVariant]) : null;

  const resetStepState = () => {
    setDoneState({ status: "idle" });
    setPostDoneChoice("none");
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
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

  const doOneMoreThing = () => {
    setText("");
    setCategory(null);
    setMainVariant(0);
    setShrunk(false);
    resetStepState();
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
    } else {
      setDoneState({ status: "idle" });
    }
  };

  return (
    <main style={{ ...pageBg, padding: "48px 24px 80px" }}>
      <div className="grain-overlay" />
      <section style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <button onClick={() => router.push("/")} style={{ display: "block", width: "fit-content", margin: "0 auto 24px", color: colors.inkFaint, fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: fonts.body }}>← Start Now</button>
        <div style={{ display: "flex", justifyContent: "center", margin: "0 auto 20px" }}>
          <SparkMark size={40} />
        </div>
        <h1 style={{ fontSize: "clamp(38px, 7vw, 64px)", lineHeight: 0.97, letterSpacing: "-0.05em", margin: "0 0 16px 0", fontWeight: 700, fontFamily: fonts.display }}>Let&apos;s get unstuck.</h1>
        <p style={{ fontSize: "17px", color: colors.inkSoft, maxWidth: "480px", margin: "0 auto 32px", lineHeight: 1.65 }}>Write down what feels heavy right now. We&apos;ll turn it into one small, doable next step.</p>
        <div style={{ ...cardSurface, padding: "22px", textAlign: "left" }}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="What's on your mind? e.g. laundry, emails, groceries..." style={{ width: "100%", minHeight: "160px", padding: "16px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.12)}`, fontSize: "16px", lineHeight: 1.6, resize: "none", outline: "none", background: "#ffffff", color: colors.ink, boxSizing: "border-box", fontFamily: fonts.body }} />
          <button onClick={handleSubmit} disabled={!text.trim()} style={{ marginTop: "14px", width: "100%", padding: "15px 20px", borderRadius: radius.sm, border: "none", background: colors.pineDeep, color: "white", fontSize: "15px", fontWeight: 700, cursor: text.trim() ? "pointer" : "not-allowed", boxSizing: "border-box", fontFamily: fonts.body, boxShadow: text.trim() ? `0 10px 24px ${tint(colors.pineDeep, 0.28)}` : "none" }}>Give Me My Next Step →</button>

          {displayed && (
            <>
              <div style={{ marginTop: "18px", background: tint(colors.pine, 0.08), borderRadius: radius.md, padding: "20px 22px", border: `1px solid ${tint(colors.pine, 0.22)}` }}>
                <p style={{ fontSize: "13px", color: colors.pineDeep, marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Your next step</p>
                <p style={{ fontSize: "18px", fontWeight: 600, color: colors.ink, margin: "0 0 14px 0", lineHeight: 1.45, fontFamily: fonts.display }}>{displayed.step}</p>
                <p style={{ fontSize: "14px", color: colors.inkSoft, margin: 0, lineHeight: 1.6 }}>{displayed.reason}</p>
              </div>

              <div style={{ marginTop: "10px", textAlign: "center" }}>
                <button onClick={tryDifferentStep} style={tertiaryLink}>Try a different step</button>
                {!shrunk && (
                  <>
                    <span style={{ color: colors.inkFaint, fontSize: "13px", margin: "0 8px" }}>·</span>
                    <button onClick={stillTooBig} style={tertiaryLink}>Still feels too big?</button>
                  </>
                )}
              </div>

              <JustStartTimer key={displayed.step} />

              <div style={{ marginTop: "12px" }}>
                {doneState.status === "idle" && (
                  <button onClick={handleMarkDone} style={{ width: "100%", padding: "14px", borderRadius: radius.sm, border: `2px solid ${colors.pineDeep}`, background: "transparent", color: colors.pineDeep, fontSize: "15px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box", fontFamily: fonts.body }}>
                    ✓ I did it! Mark as done
                  </button>
                )}
                {doneState.status === "loading" && (
                  <p style={{ textAlign: "center", color: colors.inkFaint, fontSize: "14px", margin: 0, padding: "14px 0" }}>Saving…</p>
                )}
                {doneState.status === "success" && (
                  <>
                    <Confetti />
                    {postDoneChoice === "none" ? (
                      <div style={{ background: `linear-gradient(135deg, ${tint(colors.pine, 0.16)}, ${tint(colors.pine, 0.05)})`, borderRadius: radius.sm, padding: "20px 16px", textAlign: "center", border: `1px solid ${tint(colors.pine, 0.3)}`, animation: "streak-pop 0.5s ease-out" }}>
                        <p style={{ fontSize: "22px", fontWeight: 700, color: colors.pineDeep, margin: "0 0 6px", fontFamily: fonts.display }}>That&apos;s done. Nice work.</p>
                        <p style={{ fontSize: "13px", color: colors.inkSoft, margin: "0 0 16px", lineHeight: 1.5 }}>However small it felt, you did the thing you said you&apos;d do.</p>
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={doOneMoreThing} style={secondaryButton}>Do one more thing</button>
                          <button onClick={() => setPostDoneChoice("stopped")} style={secondaryButton}>Stop here — I&apos;m good</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: tint(colors.pine, 0.08), borderRadius: radius.sm, padding: "18px 16px", textAlign: "center", border: `1px solid ${tint(colors.pine, 0.22)}` }}>
                        <p style={{ fontSize: "15px", color: colors.pineDeep, margin: 0, fontFamily: fonts.display, fontWeight: 600 }}>Good. Rest counts too.</p>
                      </div>
                    )}
                  </>
                )}
                {doneState.status === "alreadyDone" && (
                  <div style={{ background: tint(colors.pine, 0.08), borderRadius: radius.sm, padding: "14px 16px", textAlign: "center", border: `1px solid ${tint(colors.pine, 0.22)}` }}>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: colors.pineDeep, margin: "0 0 2px" }}>✓ Already marked for today</p>
                    <p style={{ fontSize: "13px", color: colors.inkSoft, margin: 0 }}>🔥 {doneState.streak} day streak — come back tomorrow!</p>
                  </div>
                )}
                {doneState.status === "unauthenticated" && (
                  <div style={{ background: colors.paper, borderRadius: radius.sm, padding: "14px 16px", textAlign: "center", border: `1px solid ${tint(colors.ink, 0.07)}` }}>
                    <p style={{ fontSize: "14px", color: colors.inkSoft, margin: "0 0 10px" }}>Sign in to save your streak and compete with friends.</p>
                    <button onClick={() => router.push("/auth")} style={{ padding: "10px 20px", borderRadius: radius.sm, border: "none", background: colors.pineDeep, color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>Sign in →</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default function StuckPage() {
  return <Suspense><StuckContent /></Suspense>;
}
