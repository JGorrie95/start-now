"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/app/actions";

type Profile = {
  username: string;
  streak_count: number;
  longest_streak: number;
  invite_code: string;
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)", borderRadius: "24px", padding: "24px",
  border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [username, setUsername] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { data } = await supabase
      .from("profiles")
      .select("username, streak_count, longest_streak, invite_code")
      .eq("id", user.id)
      .single();

    if (!data) { setNeedsSetup(true); } else { setProfile(data); }
    setLoading(false);
  }, [router]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");
    const result = await createProfile(username);
    if (result.error) { setFormError(result.error); setSubmitting(false); return; }
    await loadProfile();
    setNeedsSetup(false);
    setSubmitting(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const copyInvite = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${profile.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bg: React.CSSProperties = {
    minHeight: "100vh", background: "#FAF8F3", padding: "40px 20px 80px",
    fontFamily: "system-ui, sans-serif", color: "#1c1917", position: "relative", overflow: "hidden",
  };

  if (loading) return (
    <main style={bg}>
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", paddingTop: "80px", color: "#a8a29e" }}>Loading…</div>
    </main>
  );

  if (needsSetup) return (
    <main style={bg}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <button onClick={() => router.push("/")} style={{ color: "#a8a29e", background: "none", border: "none", fontSize: "14px", cursor: "pointer", marginBottom: "32px" }}>← Start Now</button>
        <h1 style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 8px", fontFamily: "Georgia, serif" }}>Pick your username</h1>
        <p style={{ color: "#78716c", marginBottom: "28px", lineHeight: 1.6 }}>This is how your friends will find you and see your streak.</p>
        <div style={glassCard}>
          <form onSubmit={handleCreateProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jakob_g" autoComplete="off"
              style={{ padding: "14px 18px", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "16px", outline: "none", background: "#fff" }}
            />
            <p style={{ fontSize: "12px", color: "#a8a29e", margin: 0 }}>3–20 characters. Letters, numbers and _ only.</p>
            {formError && <p style={{ color: "#ef4444", fontSize: "14px", margin: 0 }}>{formError}</p>}
            <button
              type="submit" disabled={submitting || !username.trim()}
              style={{ padding: "14px", borderRadius: "999px", border: "none", background: username.trim() ? "#f59e0b" : "#e5e7eb", color: username.trim() ? "white" : "#9ca3af", fontSize: "15px", fontWeight: 700, cursor: username.trim() ? "pointer" : "not-allowed" }}
            >
              {submitting ? "Creating…" : "Create profile →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${profile?.invite_code}` : "";

  return (
    <main style={bg}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => router.push("/")} style={{ color: "#a8a29e", background: "none", border: "none", fontSize: "14px", cursor: "pointer" }}>← Start Now</button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => router.push("/friends")} style={{ fontSize: "14px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer" }}>Friends</button>
            <button onClick={handleSignOut} style={{ fontSize: "14px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer" }}>Sign out</button>
          </div>
        </div>

        <div style={{ ...glassCard, marginBottom: "16px", textAlign: "center", padding: "32px 24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>✦</div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 4px", fontFamily: "Georgia, serif" }}>{profile?.username}</h1>
          <p style={{ color: "#a8a29e", fontSize: "13px", margin: 0 }}>Your profile</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ ...glassCard, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#f59e0b", fontFamily: "Georgia, serif", letterSpacing: "-0.04em" }}>{profile?.streak_count ?? 0}</div>
            <div style={{ fontSize: "13px", color: "#78716c", marginTop: "4px" }}>🔥 Current streak</div>
          </div>
          <div style={{ ...glassCard, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#1c1917", fontFamily: "Georgia, serif", letterSpacing: "-0.04em" }}>{profile?.longest_streak ?? 0}</div>
            <div style={{ fontSize: "13px", color: "#78716c", marginTop: "4px" }}>⭐ Best streak</div>
          </div>
        </div>

        <div style={glassCard}>
          <p style={{ fontSize: "13px", color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px", fontWeight: 600 }}>Your invite link</p>
          <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 12px", lineHeight: 1.5 }}>Share this with friends so they can join your circle.</p>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "12px 14px", border: "1px solid rgba(0,0,0,0.07)", fontSize: "13px", color: "#44403c", wordBreak: "break-all", marginBottom: "10px" }}>
            {inviteUrl}
          </div>
          <button
            onClick={copyInvite}
            style={{ width: "100%", padding: "12px", borderRadius: "999px", border: "none", background: copied ? "#f59e0b" : "rgba(245,158,11,0.1)", color: copied ? "white" : "#d97706", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            {copied ? "Copied! ✓" : "Copy invite link"}
          </button>
        </div>
      </div>
    </main>
  );
}
