"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    if (error) {
      console.error("Sign-in error:", error);
      let message = error.message || "Something went wrong. Please try again.";
      if ((error as { code?: string }).code === "over_email_send_rate_limit" || error.status === 429) {
        message = "Too many sign-in attempts. Please wait a minute and try again.";
      } else if ((error as { code?: string }).code === "email_address_invalid") {
        message = "That email address doesn't look valid. Please check it.";
      } else if (error.message?.toLowerCase().includes("fetch")) {
        message = "Couldn't reach the server. Check your connection and try again.";
      }
      setError(message);
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  const bg: React.CSSProperties = {
    ...pageBg, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
  };
  const card: React.CSSProperties = {
    ...cardSurface, borderRadius: radius.lg, padding: "36px 32px",
    maxWidth: "420px", width: "100%", textAlign: "center", position: "relative", zIndex: 1,
  };

  if (sent) {
    return (
      <main style={bg}>
        <div className="grain-overlay" />
        <div style={card}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>📬</div>
          <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 12px", fontFamily: fonts.display }}>Check your email</h1>
          <p style={{ color: colors.inkSoft, lineHeight: 1.6, margin: "0 0 24px" }}>
            We sent a sign-in link to <strong>{email}</strong>. Click it to continue.
          </p>
          <button onClick={() => setSent(false)} style={{ color: colors.inkFaint, background: "none", border: "none", fontSize: "14px", cursor: "pointer", fontFamily: fonts.body }}>
            ← Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={bg}>
      <div className="grain-overlay" />
      <div style={card}>
        <button onClick={() => router.push("/")} style={{ color: colors.inkFaint, background: "none", border: "none", fontSize: "14px", cursor: "pointer", marginBottom: "20px", fontFamily: fonts.body }}>← Start Now</button>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <SparkMark size={32} />
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 8px", fontFamily: fonts.display }}>Sign in</h1>
        <p style={{ color: colors.inkSoft, fontSize: "15px", margin: "0 0 28px", lineHeight: 1.5 }}>
          We&apos;ll send a magic link — no password needed.
        </p>
        <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" required
            style={{ padding: "14px 18px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.1)}`, fontSize: "16px", outline: "none", background: "#fff", fontFamily: fonts.body }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: "14px", margin: 0 }}>{error}</p>}
          <button
            type="submit" disabled={loading || !email.trim()}
            style={{ padding: "14px", borderRadius: radius.sm, border: "none", background: email.trim() ? colors.pineDeep : "#e5e7eb", color: email.trim() ? "white" : "#9ca3af", fontSize: "15px", fontWeight: 700, cursor: email.trim() ? "pointer" : "not-allowed", fontFamily: fonts.body }}
          >
            {loading ? "Sending…" : "Send magic link →"}
          </button>
        </form>
      </div>
    </main>
  );
}
