"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { completeStep } from "@/app/actions";

function getNextStep(input: string): { step: string; reason: string } {
  const lower = input.toLowerCase();
  if (lower.includes("laundry") || lower.includes("clothes") || lower.includes("washing")) return { step: "Put one load of laundry in the washer.", reason: "It takes about 2 minutes and creates an easy, visible win." };
  if (lower.includes("email") || lower.includes("inbox") || lower.includes("reply")) return { step: "Open the email and write one messy first sentence.", reason: "You don't need to finish it — starting removes the hardest part." };
  if (lower.includes("clean") || lower.includes("mess") || lower.includes("tidy")) return { step: "Clear one small surface for 3 minutes.", reason: "A tiny clean area helps your brain feel less chaotic." };
  if (lower.includes("call") || lower.includes("phone") || lower.includes("dentist")) return { step: "Write down the phone number and what you need to say.", reason: "Preparing the first line makes the call feel less overwhelming." };
  if (lower.includes("groceries") || lower.includes("food") || lower.includes("shopping")) return { step: "Write down 3 things you actually need right now.", reason: "A tiny list is far easier to act on than a full grocery plan." };
  if (lower.includes("study") || lower.includes("school") || lower.includes("homework")) return { step: "Open the material and read the first heading only.", reason: "Seeing the first small piece helps your brain enter the task." };
  if (lower.includes("work") || lower.includes("project") || lower.includes("deadline")) return { step: "Write the first sentence or first bullet point — even rough.", reason: "A rough start gives your brain something to build from." };
  if (lower.includes("bill") || lower.includes("money") || lower.includes("finance")) return { step: "Open the bill or account page without trying to solve everything.", reason: "Seeing the first detail reduces uncertainty and makes action easier." };
  if (lower.includes("overwhelm") || lower.includes("too much") || lower.includes("stressed")) return { step: "Write down the one thing that feels most urgent right now.", reason: "Getting it out of your head and onto paper reduces the mental load." };
  return { step: "Pick the easiest thing on your list and do it for just 5 minutes.", reason: "Starting small lowers pressure and creates real momentum." };
}

type DoneState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; streak: number }
  | { status: "alreadyDone"; streak: number }
  | { status: "unauthenticated" };

function StuckContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const taskParam = searchParams.get("task") ?? "";
  const [text, setText] = useState(taskParam);
  const [result, setResult] = useState<{ step: string; reason: string } | null>(null);
  const [doneState, setDoneState] = useState<DoneState>({ status: "idle" });

  useEffect(() => {
    if (taskParam.trim()) setResult(getNextStep(taskParam));
  }, [taskParam]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setResult(getNextStep(text));
    setDoneState({ status: "idle" });
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
    <main style={{ minHeight: "100vh", background: "#FAF8F3", padding: "48px 24px 80px", fontFamily: "system-ui, sans-serif", color: "#1c1917", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(253,186,116,0.18)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <section style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <button onClick={() => router.push("/")} style={{ display: "inline-block", marginBottom: "24px", color: "#a8a29e", fontSize: "14px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Start Now</button>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "16px", background: "rgba(245,158,11,0.15)", marginBottom: "20px" }}><span style={{ fontSize: "24px" }}>✦</span></div>
        <h1 style={{ fontSize: "clamp(38px, 7vw, 64px)", lineHeight: 0.97, letterSpacing: "-0.05em", margin: "0 0 16px 0", fontWeight: 700, fontFamily: "Georgia, serif" }}>Let&apos;s get unstuck.</h1>
        <p style={{ fontSize: "17px", color: "#78716c", maxWidth: "480px", margin: "0 auto 32px", lineHeight: 1.65 }}>Write down what feels heavy right now. We&apos;ll turn it into one small, doable next step.</p>
        <div style={{ background: "rgba(255,255,255,0.65)", borderRadius: "28px", padding: "24px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 20px 50px rgba(0,0,0,0.07)", backdropFilter: "blur(16px)", textAlign: "left" }}>
          <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: "22px", padding: "22px" }}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }} placeholder="What's on your mind? e.g. laundry, emails, groceries..." style={{ width: "100%", minHeight: "160px", padding: "16px", borderRadius: "18px", border: "1px solid rgba(0,0,0,0.08)", fontSize: "16px", lineHeight: 1.6, resize: "none", outline: "none", background: "#ffffff", color: "#1c1917", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }} />
            <button onClick={handleSubmit} disabled={!text.trim()} style={{ marginTop: "14px", width: "100%", padding: "15px 20px", borderRadius: "999px", border: "none", background: text.trim() ? "#f59e0b" : "#e5e7eb", color: text.trim() ? "white" : "#9ca3af", fontSize: "15px", fontWeight: 700, cursor: text.trim() ? "pointer" : "not-allowed", boxSizing: "border-box" }}>Give Me My Next Step →</button>

            {result && (
              <>
                <div style={{ marginTop: "18px", background: "#fffbeb", borderRadius: "20px", padding: "20px 22px", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <p style={{ fontSize: "13px", color: "#d97706", marginBottom: "8px", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>Your next step</p>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#1c1917", margin: "0 0 14px 0", lineHeight: 1.45, fontFamily: "Georgia, serif" }}>{result.step}</p>
                  <p style={{ fontSize: "14px", color: "#78716c", margin: 0, lineHeight: 1.6 }}>{result.reason}</p>
                </div>

                <div style={{ marginTop: "12px" }}>
                  {doneState.status === "idle" && (
                    <button onClick={handleMarkDone} style={{ width: "100%", padding: "14px", borderRadius: "999px", border: "2px solid #f59e0b", background: "transparent", color: "#d97706", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxSizing: "border-box" }}>
                      ✓ I did it! Mark as done
                    </button>
                  )}
                  {doneState.status === "loading" && (
                    <p style={{ textAlign: "center", color: "#a8a29e", fontSize: "14px", margin: 0, padding: "14px 0" }}>Saving…</p>
                  )}
                  {doneState.status === "success" && (
                    <div style={{ background: "linear-gradient(135deg, #fef3c7, #fffbeb)", borderRadius: "16px", padding: "16px", textAlign: "center", border: "1px solid rgba(245,158,11,0.3)" }}>
                      <p style={{ fontSize: "24px", margin: "0 0 4px" }}>🔥</p>
                      <p style={{ fontSize: "18px", fontWeight: 700, color: "#d97706", margin: "0 0 4px", fontFamily: "Georgia, serif" }}>{doneState.streak} day streak!</p>
                      <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 12px" }}>Keep it going tomorrow.</p>
                      <button onClick={() => router.push("/friends")} style={{ padding: "10px 20px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>See your friends →</button>
                    </div>
                  )}
                  {doneState.status === "alreadyDone" && (
                    <div style={{ background: "#f0fdf4", borderRadius: "16px", padding: "14px 16px", textAlign: "center", border: "1px solid rgba(22,163,74,0.2)" }}>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#16a34a", margin: "0 0 2px" }}>✓ Already marked for today</p>
                      <p style={{ fontSize: "13px", color: "#78716c", margin: 0 }}>🔥 {doneState.streak} day streak — come back tomorrow!</p>
                    </div>
                  )}
                  {doneState.status === "unauthenticated" && (
                    <div style={{ background: "rgba(255,255,255,0.8)", borderRadius: "16px", padding: "14px 16px", textAlign: "center", border: "1px solid rgba(0,0,0,0.07)" }}>
                      <p style={{ fontSize: "14px", color: "#78716c", margin: "0 0 10px" }}>Sign in to save your streak and compete with friends.</p>
                      <button onClick={() => router.push("/auth")} style={{ padding: "10px 20px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Sign in →</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function StuckPage() {
  return <Suspense><StuckContent /></Suspense>;
}
