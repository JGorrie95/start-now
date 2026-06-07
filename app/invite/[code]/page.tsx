"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addFriendByInvite } from "@/app/actions";

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [inviterUsername, setInviterUsername] = useState<string | null>(null);
  const [inviterStreak, setInviterStreak] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [result, setResult] = useState<{ message: string; isError: boolean } | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();

      const { data: inviter } = await supabase
        .from("profiles")
        .select("username, streak_count")
        .eq("invite_code", code)
        .single();

      if (inviter) {
        setInviterUsername(inviter.username);
        setInviterStreak(inviter.streak_count);
      }

      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    };
    init();
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    const res = await addFriendByInvite(code);
    if (res.error) {
      setResult({ message: res.error, isError: true });
    } else {
      setResult({ message: `Added! You're now in ${inviterUsername}'s circle.`, isError: false });
      setTimeout(() => router.push("/friends"), 1800);
    }
    setJoining(false);
  };

  const bg: React.CSSProperties = {
    minHeight: "100vh", background: "#FAF8F3", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "24px", fontFamily: "system-ui, sans-serif",
    position: "relative", overflow: "hidden",
  };

  return (
    <main style={bg}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(253,186,116,0.18)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: "28px", padding: "36px 32px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.07)", border: "1px solid rgba(255,255,255,0.9)", textAlign: "center", position: "relative", zIndex: 1 }}>
        {loading ? (
          <p style={{ color: "#a8a29e" }}>Loading…</p>
        ) : !inviterUsername ? (
          <>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>🤔</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "24px", margin: "0 0 12px" }}>Invalid invite</h1>
            <p style={{ color: "#78716c", marginBottom: "24px" }}>This invite link doesn&apos;t exist or has expired.</p>
            <button onClick={() => router.push("/")} style={{ padding: "12px 24px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Go home</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>✦</div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: "26px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 8px" }}>You&apos;re invited!</h1>
            <p style={{ color: "#78716c", marginBottom: "6px", fontSize: "16px" }}>
              <strong>{inviterUsername}</strong> wants you in their Start Now circle.
            </p>
            <p style={{ color: "#a8a29e", fontSize: "14px", marginBottom: "28px" }}>
              🔥 {inviterStreak} day streak
            </p>

            {result ? (
              <p style={{ color: result.isError ? "#ef4444" : "#16a34a", fontWeight: 600, fontSize: "15px" }}>{result.message}</p>
            ) : isLoggedIn ? (
              <button onClick={handleJoin} disabled={joining} style={{ width: "100%", padding: "14px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "15px", fontWeight: 700, cursor: joining ? "not-allowed" : "pointer" }}>
                {joining ? "Joining…" : `Join ${inviterUsername}'s circle →`}
              </button>
            ) : (
              <>
                <p style={{ color: "#78716c", fontSize: "14px", marginBottom: "16px" }}>Sign in first, then you&apos;ll be added automatically.</p>
                <button onClick={() => router.push(`/auth?next=/invite/${code}`)} style={{ width: "100%", padding: "14px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
                  Sign in to join →
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
