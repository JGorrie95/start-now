"use client";
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";

function ListIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <line x1="3" y1="5" x2="15" y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="3" y1="9" x2="12" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="3" y1="13" x2="9" y2="13" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TargetIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="6" stroke={color} strokeWidth="1.6" />
      <circle cx="9" cy="9" r="1.8" fill={color} />
    </svg>
  );
}

function ScatterIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3 13 L7 8 L10 11 L15 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3" />
    </svg>
  );
}

function CloudIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <path d="M5.5 12.5a3 3 0 0 1-.5-5.96A4 4 0 0 1 12.9 6.1 3.2 3.2 0 0 1 12.5 12.5h-7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

const quickStarts = [
  { text: "I have too many things to do", tone: colors.slate, Icon: ListIcon },
  { text: "I need to start one task", tone: colors.pineDeep, Icon: TargetIcon },
  { text: "I got distracted again", tone: colors.heather, Icon: ScatterIcon },
  { text: "I feel overwhelmed", tone: colors.ink, Icon: CloudIcon },
];

const steps = [
  { n: "1", title: "Dump the chaos", body: "Write whatever is spinning in your head. It does not need to be organised.", tone: tint(colors.ink, 0.45) },
  { n: "2", title: "Pick one direction", body: "Start Now cuts the noise and points you toward one small action.", tone: colors.slate },
  { n: "3", title: "Begin gently", body: "No shame. No giant plan. Just one doable next step.", tone: colors.pineDeep, glow: true },
];

const navButton: CSSProperties = {
  fontSize: "13px", color: colors.inkSoft, background: colors.paper, padding: "8px 14px",
  borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.08)}`, cursor: "pointer",
  fontFamily: fonts.body, textDecoration: "none",
};

const primaryCta: CSSProperties = {
  display: "inline-block", padding: "14px 24px", borderRadius: radius.sm, border: "none",
  background: colors.pineDeep, color: colors.onAccent, fontSize: "15px", fontWeight: 600,
  fontFamily: fonts.body, textDecoration: "none", cursor: "pointer",
  boxShadow: `0 10px 24px ${tint(colors.pineDeep, 0.28)}`,
};

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

  return (
    <main style={{ ...pageBg, padding: "20px 20px 80px" }}>
      <div className="grain-overlay" />
      <section style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            <SparkMark size={32} />
            Start Now
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {isLoggedIn ? (
              <>
                <button onClick={() => router.push("/friends")} style={navButton}>Friends</button>
                <button onClick={() => router.push("/profile")} style={navButton}>Profile</button>
              </>
            ) : (
              <button onClick={() => router.push("/auth")} style={navButton}>Sign in</button>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "start" }}>
          <div>
            <p style={{ fontSize: "13px", color: colors.inkFaint, marginBottom: "14px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              From stuck to started
            </p>
            <h1 style={{ fontFamily: fonts.display, fontSize: "clamp(32px, 5.5vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 20px 0", fontWeight: 500 }}>
              One small step<br />changes everything.
            </h1>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: colors.inkSoft, maxWidth: "440px", marginBottom: "28px" }}>
              Start Now helps you clear the mental clutter and find one calm, doable next step.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <a href="/stuck" style={primaryCta}>Help Me Begin →</a>
              <Link href="/how-it-works" style={{ display: "inline-block", padding: "14px 24px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.14)}`, background: "transparent", color: colors.inkSoft, fontSize: "15px", fontWeight: 500, textDecoration: "none", fontFamily: fonts.body }}>
                See How It Works
              </Link>
            </div>
          </div>

          <div style={{ ...cardSurface, padding: "24px" }}>
            <p style={{ fontSize: "13px", color: colors.inkFaint, marginBottom: "6px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Right now</p>
            <h2 style={{ fontFamily: fonts.display, fontSize: "24px", margin: "0 0 18px 0", letterSpacing: "-0.01em", fontWeight: 500 }}>What&apos;s on your mind?</h2>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStart(); } }}
              placeholder="Laundry, emails, study, clean my room..."
              className="text-field" style={{ width: "100%", minHeight: "100px", padding: "16px", borderRadius: radius.sm, border: `1.5px solid ${colors.fieldBorder}`, fontSize: "16px", lineHeight: 1.5, resize: "none", outline: "none", background: colors.field, color: colors.ink, marginBottom: "14px", boxSizing: "border-box", fontFamily: fonts.body }}
            />
            <div style={{ display: "grid", gap: "8px", marginBottom: "18px" }}>
              {quickStarts.map(({ text, tone, Icon }) => {
                const selected = task === text;
                return (
                  <button
                    key={text}
                    onClick={() => setTask(text)}
                    style={{
                      display: "flex", alignItems: "center", gap: "10px",
                      padding: "12px 14px", borderRadius: radius.sm,
                      background: tint(tone, selected ? 0.34 : 0.22),
                      border: `1px solid ${tint(tone, 0.45)}`,
                      borderLeft: selected ? `4px solid ${tone}` : `1px solid ${tint(tone, 0.45)}`,
                      fontSize: "14px", color: colors.ink, cursor: "pointer", textAlign: "left",
                      fontFamily: fonts.body, fontWeight: selected ? 600 : 400,
                    }}
                  >
                    <Icon color={tone} />
                    {text}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleStart}
              disabled={!task.trim()}
              style={{
                ...primaryCta, display: "block", width: "100%", boxSizing: "border-box", textAlign: "center",
                boxShadow: task.trim() ? primaryCta.boxShadow : "none",
                cursor: task.trim() ? "pointer" : "not-allowed",
              }}
            >
              Get My Next Step →
            </button>
          </div>
        </div>

        <div id="how-it-works" style={{ marginTop: "96px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {steps.map((step) => (
            <div key={step.title} style={{ ...cardSurface, padding: "24px 22px", position: "relative" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: "6px" }}>
                {step.glow && (
                  <span className="lit-glow" style={{ position: "absolute", inset: "-10px", borderRadius: "50%", background: tint(colors.pine, 0.28), filter: "blur(10px)" }} />
                )}
                <span style={{ position: "relative", fontFamily: fonts.display, fontStyle: "italic", fontWeight: 500, fontSize: "44px", color: step.tone, lineHeight: 1 }}>
                  {step.n}
                </span>
              </div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", letterSpacing: "-0.01em", fontFamily: fonts.body, fontWeight: 600 }}>{step.title}</h3>
              <p style={{ margin: 0, color: colors.inkSoft, lineHeight: 1.6, fontSize: "14px" }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
