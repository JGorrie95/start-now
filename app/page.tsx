"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [task, setTask] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  const handleStart = () => {
    if (!task.trim()) return;
    router.push(`/stuck?task=${encodeURIComponent(task.trim())}`);
  };

  const quickStarts = [
    "I have too many things to do",
    "I need to start one task",
    "I got distracted again",
    "I feel overwhelmed",
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#FAF8F3", color: "#1c1917", fontFamily: "Georgia, serif", padding: "32px 20px 80px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(253,186,116,0.18)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <section style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "64px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>✦ Start Now</div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                <button onClick={() => router.push("/friends")} style={{ fontSize: "13px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>Friends</button>
                <button onClick={() => router.push("/profile")} style={{ fontSize: "13px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>Profile</button>
              </>
            ) : (
              <button onClick={() => router.push("/auth")} style={{ fontSize: "13px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer", fontFamily: "system-ui, sans-serif" }}>Sign in</button>
            )}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "14px", color: "#a8a29e", marginBottom: "14px", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>From stuck to started</p>
            <h1 style={{ fontSize: "clamp(44px, 8vw, 82px)", lineHeight: 0.95, letterSpacing: "-0.05em", margin: "0 0 24px 0", fontWeight: 700 }}>One small step<br />changes<br />everything.</h1>
            <p style={{ fontSize: "18px", lineHeight: 1.7, color: "#78716c", maxWidth: "500px", marginBottom: "32px", fontFamily: "system-ui, sans-serif" }}>Start Now helps you clear the mental clutter and find one calm, doable next step.</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <a href="/stuck" style={{ display: "inline-block", padding: "14px 26px", borderRadius: "999px", background: "#f59e0b", color: "white", fontSize: "15px", fontWeight: 600, textDecoration: "none", fontFamily: "system-ui, sans-serif", boxShadow: "0 8px 24px rgba(245,158,11,0.3)" }}>Help Me Begin →</a>
              <a href="#how-it-works" style={{ display: "inline-block", padding: "14px 26px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.7)", color: "#44403c", fontSize: "15px", fontWeight: 500, textDecoration: "none", fontFamily: "system-ui, sans-serif" }}>See How It Works</a>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.8)", borderRadius: "28px", padding: "24px", backdropFilter: "blur(16px)", boxShadow: "0 20px 50px rgba(0,0,0,0.07)" }}>
            <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: "22px", padding: "22px" }}>
              <p style={{ fontSize: "13px", color: "#a8a29e", marginBottom: "6px", fontFamily: "system-ui, sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>Right now</p>
              <h2 style={{ fontSize: "26px", margin: "0 0 18px 0", letterSpacing: "-0.04em", fontWeight: 600 }}>What&apos;s on your mind?</h2>
              <textarea value={task} onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStart(); } }} placeholder="Laundry, emails, study, clean my room..." style={{ width: "100%", minHeight: "100px", padding: "16px", borderRadius: "18px", border: "1px solid rgba(0,0,0,0.08)", fontSize: "16px", lineHeight: 1.5, resize: "none", outline: "none", background: "#ffffff", color: "#1c1917", marginBottom: "14px", boxSizing: "border-box", fontFamily: "system-ui, sans-serif" }} />
              <div style={{ display: "grid", gap: "8px", marginBottom: "16px" }}>
                {quickStarts.map((item) => (
                  <button key={item} onClick={() => setTask(item)} style={{ padding: "12px 16px", borderRadius: "14px", background: task === item ? "#fef3c7" : "#ffffff", border: task === item ? "1px solid #fbbf24" : "1px solid rgba(0,0,0,0.07)", fontSize: "14px", color: "#44403c", cursor: "pointer", textAlign: "left", fontFamily: "system-ui, sans-serif" }}>{item}</button>
                ))}
              </div>
              <button onClick={handleStart} disabled={!task.trim()} style={{ display: "block", width: "100%", padding: "15px 20px", borderRadius: "999px", border: "none", background: task.trim() ? "#f59e0b" : "#e5e7eb", color: task.trim() ? "white" : "#9ca3af", fontSize: "15px", fontWeight: 700, cursor: task.trim() ? "pointer" : "not-allowed", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }}>Get My Next Step →</button>
            </div>
          </div>
        </div>
        <div id="how-it-works" style={{ marginTop: "90px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {[{ title: "1. Dump the chaos", body: "Write whatever is spinning in your head. It does not need to be organised." }, { title: "2. Pick one direction", body: "Start Now cuts the noise and points you toward one small action." }, { title: "3. Begin gently", body: "No shame. No giant plan. Just one doable next step." }].map((step) => (
            <div key={step.title} style={{ background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "22px", padding: "22px", backdropFilter: "blur(8px)" }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: "18px", letterSpacing: "-0.03em" }}>{step.title}</h3>
              <p style={{ margin: 0, color: "#78716c", lineHeight: 1.6, fontSize: "14px", fontFamily: "system-ui, sans-serif" }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
