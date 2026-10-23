"use client";
import { useState, useEffect, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";
import { Avatar } from "@/app/avatar";
import { Reveal } from "@/app/reveal";
import { moods, quickStarts, StarIcon } from "@/app/moods";
import { QuickStartEditor } from "@/app/quick-start-editor";
import { subscribePreferences, getLocalPhoto, getLocalStreak, streakNow, NO_STREAK, getCustomQuickStarts, getServerQuickStarts, MAX_QUICK_STARTS, type CustomQuickStart } from "@/app/preferences";
import { syncWidget } from "@/app/native";

// Today's date for the header, e.g. "SATURDAY, OCTOBER 17", worked out on the phone in its own
// time zone. The server leaves it blank so the page never shows the server's date.
const noSubscribe = () => () => {};
function useToday() {
  return useSyncExternalStore(
    noSubscribe,
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase(),
    () => "",
  );
}

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
  const [account, setAccount] = useState<"checking" | "signedOut" | "signedIn">("checking");
  const [streak, setStreak] = useState<{ count: number; doneToday: boolean } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const today = useToday();
  const localPhoto = useSyncExternalStore(subscribePreferences, getLocalPhoto, () => null);
  const localStreak = useSyncExternalStore(subscribePreferences, getLocalStreak, () => NO_STREAK);
  const router = useRouter();
  const myQuickStarts = useSyncExternalStore(subscribePreferences, getCustomQuickStarts, getServerQuickStarts);
  const [editingQuickStarts, setEditingQuickStarts] = useState(false);
  const [editor, setEditor] = useState<{ editing: CustomQuickStart | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setAccount(user ? "signedIn" : "signedOut");
      if (!user) {
        // Keep the home screen widget in step with the streak on this phone.
        const phone = getLocalStreak();
        syncWidget(phone.count, phone.lastDate);
        return;
      }
      const { data } = await supabase.from("profiles").select("streak_count, last_completed_date, avatar_url").eq("id", user.id).single();
      if (!data) return;
      setAvatarUrl(data.avatar_url ?? null);
      syncWidget(data.streak_count ?? 0, data.last_completed_date ?? null);
      const now = streakNow({ count: data.streak_count ?? 0, longest: 0, lastDate: data.last_completed_date });
      setStreak({ count: now.count, doneToday: now.doneToday });
    });
  }, []);

  const isLoggedIn = account === "signedIn";
  // With a friends account the streak comes from the database; without one, from this phone.
  const shownStreak = account === "signedIn" ? streak : account === "signedOut" ? streakNow(localStreak) : null;

  const startWith = (text: string) => router.push(`/stuck?task=${encodeURIComponent(text)}`);
  const startMine = (q: CustomQuickStart) => router.push(`/stuck?task=${encodeURIComponent(q.label)}&qs=${encodeURIComponent(q.id)}`);
  const editing = editingQuickStarts && myQuickStarts.length > 0;

  const handleStart = () => {
    if (!task.trim()) return;
    router.push(`/stuck?task=${encodeURIComponent(task.trim())}`);
  };

  return (
    <main style={{ ...pageBg, padding: "20px 20px 80px" }}>
      <div className="grain-overlay" />
      <div className="blob blob-a" aria-hidden="true" />
      <div className="blob blob-b" aria-hidden="true" />
      <section style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="enter web-only" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em" }}>
            <SparkMark size={32} />
            Start Now
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => router.push("/friends")} style={navButton}>Friends</button>
            <button onClick={() => router.push("/profile")} style={navButton}>Profile</button>
            <button onClick={() => router.push("/settings")} style={navButton}>Settings</button>
          </div>
        </div>

        <div className="app-only enter" style={{ marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft, minHeight: "18px" }}>{today}</div>
              <h1 style={{ margin: "2px 0 0", fontSize: "34px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: fonts.body }}>Start Now</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <Link href="/settings" aria-label="Settings" style={{ width: "44px", height: "44px", borderRadius: "50%", background: colors.paper, color: colors.ink, border: `1px solid ${tint(colors.ink, 0.1)}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                  <circle cx="15" cy="7" r="2.2" />
                  <circle cx="9" cy="17" r="2.2" />
                </svg>
              </Link>
              <Link href="/profile" aria-label="Your profile" style={{ display: "flex", flexShrink: 0 }}>
                <Avatar url={isLoggedIn ? avatarUrl : localPhoto} size={44} />
              </Link>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "40px", alignItems: "start" }}>
          <div className="web-only">
            <p className="enter" style={{ ["--delay" as string]: "0.1s", fontSize: "13px", color: colors.inkFaint, marginBottom: "14px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
              From stuck to started
            </p>
            <h1 style={{ fontFamily: fonts.display, fontSize: "clamp(32px, 5.5vw, 48px)", lineHeight: 1.15, letterSpacing: "-0.02em", margin: "0 0 20px 0", fontWeight: 500 }}>
              <span className="enter" style={{ display: "block", ["--delay" as string]: "0.2s" }}>One small step</span>
              <span className="enter" style={{ display: "block", ["--delay" as string]: "0.4s" }}>changes everything.</span>
            </h1>
            <p className="enter" style={{ ["--delay" as string]: "0.6s", fontSize: "16px", lineHeight: 1.7, color: colors.inkSoft, maxWidth: "440px", marginBottom: "28px" }}>
              Start Now helps you clear the mental clutter and find one calm, doable next step.
            </p>
            <div className="enter" style={{ ["--delay" as string]: "0.8s", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <a href="/stuck" className="nudge" style={primaryCta}>Help Me Begin →</a>
              <Link href="/how-it-works" className="press" style={{ display: "inline-block", padding: "14px 24px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.14)}`, background: "transparent", color: colors.inkSoft, fontSize: "15px", fontWeight: 500, textDecoration: "none", fontFamily: fonts.body }}>
                See How It Works
              </Link>
            </div>
          </div>

          <div className="enter" style={{ ["--delay" as string]: "0.3s" }}>
            {/* What's on your mind: the main green card */}
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "28px", padding: "22px", background: moods.lagoon.background, color: "#FFFFFF", boxShadow: "0 18px 40px rgba(31, 90, 75, 0.3)" }}>
              <div aria-hidden="true" style={{ position: "absolute", top: "-60px", right: "-50px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.10)" }} />
              <div aria-hidden="true" style={{ position: "absolute", bottom: "-90px", left: "110px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(159, 217, 198, 0.12)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.88)" }}>RIGHT NOW</div>
                <label htmlFor="mind" style={{ display: "block", margin: "6px 0 16px", fontFamily: fonts.display, fontSize: "28px", lineHeight: 1.15, fontWeight: 500 }}>What&apos;s on your mind?</label>
                <textarea
                  id="mind"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStart(); } }}
                  placeholder="Laundry, emails, study, clean my room..."
                  className="glass-field"
                  rows={2}
                  style={{ width: "100%", minHeight: "76px", padding: "14px 16px", borderRadius: "16px", fontSize: "16px", lineHeight: 1.5, resize: "none", boxSizing: "border-box", fontFamily: fonts.body, display: "block" }}
                />
                <button
                  onClick={handleStart}
                  disabled={!task.trim()}
                  className="solid-press"
                  style={{ marginTop: "12px", width: "100%", height: "52px", borderRadius: "16px", border: "none", background: "#FFFFFF", color: moods.lagoon.deep, fontSize: "16px", fontWeight: 700, fontFamily: fonts.body, cursor: task.trim() ? "pointer" : "not-allowed", opacity: task.trim() ? 1 : 0.75 }}
                >
                  Get My Next Step →
                </button>
              </div>
            </div>

            {/* Quick starts: one tap and you're on your way */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", margin: "24px 4px 12px" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, letterSpacing: "-0.01em", fontFamily: fonts.body }}>Quick starts</h2>
              {myQuickStarts.length > 0 ? (
                <button type="button" onClick={() => setEditingQuickStarts((on) => !on)} aria-pressed={editing} style={{ border: "none", background: editing ? colors.pineDeep : tint(colors.ink, 0.06), color: editing ? colors.onAccent : colors.ink, height: "32px", padding: "0 14px", borderRadius: "16px", fontSize: "14px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
                  {editing ? "Done" : "Edit"}
                </button>
              ) : (
                <span style={{ fontSize: "14px", color: colors.inkSoft }}>Tap the one that fits</span>
              )}
            </div>
            {editing && <p style={{ margin: "-4px 4px 12px", fontSize: "14px", color: colors.inkSoft }}>Tap one of yours to change or delete it.</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
              {quickStarts.map(({ text, label, mood, Icon }) => (
                <button
                  key={text}
                  onClick={() => startWith(text)}
                  className="tile"
                  style={{ height: "104px", borderRadius: "24px", border: "none", padding: "14px 16px", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", background: moods[mood].background, color: "#FFFFFF", fontFamily: fonts.body, cursor: "pointer" }}
                >
                  <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon />
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.25 }}>{label}</span>
                </button>
              ))}
              {myQuickStarts.map((q) => (
                <button
                  key={q.id}
                  onClick={() => (editing ? setEditor({ editing: q }) : startMine(q))}
                  aria-label={editing ? `Change ${q.label}` : q.label}
                  className={editing ? "tile wiggle" : "tile"}
                  style={{ position: "relative", height: "104px", borderRadius: "24px", border: "none", padding: "14px 16px", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", background: moods[q.mood].background, color: "#FFFFFF", fontFamily: fonts.body, cursor: "pointer", minWidth: 0 }}
                >
                  <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <StarIcon />
                  </span>
                  {editing && (
                    <span aria-hidden="true" style={{ position: "absolute", top: "12px", right: "12px", width: "30px", height: "30px", borderRadius: "50%", background: "#FFFFFF", color: moods[q.mood].deep, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.18)" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>
                    </span>
                  )}
                  <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.25, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflowWrap: "anywhere" }}>{q.label}</span>
                </button>
              ))}
              {!editing && myQuickStarts.length < MAX_QUICK_STARTS && (
                <button
                  onClick={() => setEditor({ editing: null })}
                  className="tile"
                  style={{ height: "104px", borderRadius: "24px", border: `2px dashed ${tint(colors.ink, 0.22)}`, padding: "14px 16px", textAlign: "left", display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", background: "transparent", color: colors.ink, fontFamily: fonts.body, cursor: "pointer", boxSizing: "border-box" }}
                >
                  <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: tint(colors.ink, 0.07), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                  <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.25 }}>Make your own</span>
                </button>
              )}
            </div>
            {editor && (
              <QuickStartEditor
                key={editor.editing?.id ?? "new"}
                editing={editor.editing}
                onClose={() => {
                  setEditor(null);
                  if (getCustomQuickStarts().length === 0) setEditingQuickStarts(false);
                }}
              />
            )}

            {/* Streak: on this phone, or from your friends account */}
            {shownStreak && (
              <Link href="/profile" style={{ marginTop: "12px", minHeight: "60px", boxSizing: "border-box", borderRadius: "20px", background: colors.paper, border: `1px solid ${tint(colors.ink, 0.06)}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: colors.ink }}>
                <span style={{ width: "36px", height: "36px", borderRadius: "50%", background: tint(colors.pine, 0.14), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "15px", color: colors.pineDeep, flexShrink: 0 }}>{shownStreak.count}</span>
                <span style={{ flexGrow: 1 }}>
                  <span style={{ display: "block", fontSize: "15px", fontWeight: 700 }}>
                    {shownStreak.count === 0 ? "Start a streak today" : `${shownStreak.count} day streak`}
                  </span>
                  <span style={{ display: "block", fontSize: "13px", color: colors.inkSoft }}>
                    {shownStreak.doneToday ? "Done for today. Nice work." : shownStreak.count === 0 ? "One small step is all it takes" : `One small step today makes it ${shownStreak.count + 1}`}
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: colors.inkSoft, flexShrink: 0 }}><path d="M9 5l7 7-7 7" /></svg>
              </Link>
            )}
          </div>
        </div>

        <div id="how-it-works" className="web-only" style={{ marginTop: "96px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.15}>
            <div className="lift" style={{ ...cardSurface, padding: "24px 22px", position: "relative", height: "100%" }}>
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
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
