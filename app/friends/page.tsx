"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendFriendRequest, acceptFriendRequest } from "@/app/actions";

type FriendProfile = {
  username: string;
  streak_count: number;
  longest_streak: number;
};

type PendingRequest = {
  requester_id: string;
  username: string;
  streak_count: number;
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)", borderRadius: "24px", padding: "20px 22px",
  border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
};

export default function FriendsPage() {
  const router = useRouter();
  const [myProfile, setMyProfile] = useState<{ username: string; streak_count: number; longest_streak: number } | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<{ message: string; isError: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, streak_count, longest_streak, invite_code")
      .eq("id", user.id)
      .single();

    if (!profile) { router.push("/profile"); return; }
    setMyProfile({ username: profile.username, streak_count: profile.streak_count, longest_streak: profile.longest_streak });
    setInviteCode(profile.invite_code);

    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    const friendIds = (friendships ?? []).map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );

    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from("profiles")
        .select("username, streak_count, longest_streak")
        .in("id", friendIds);
      setFriends(friendProfiles ?? []);
    } else {
      setFriends([]);
    }

    const { data: incomingRaw } = await supabase
      .from("friendships")
      .select("requester_id, profiles!friendships_requester_id_fkey(username, streak_count)")
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incoming: PendingRequest[] = ((incomingRaw ?? []) as any[]).map((r) => {
      const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
      return { requester_id: r.requester_id, username: p?.username ?? "unknown", streak_count: p?.streak_count ?? 0 };
    });
    setPending(incoming);
    setLoading(false);
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setSearching(true);
    setSearchResult(null);
    const result = await sendFriendRequest(searchUsername);
    setSearchResult({
      message: result.error ?? `Friend request sent to @${searchUsername.trim()} ✓`,
      isError: !!result.error,
    });
    if (!result.error) setSearchUsername("");
    setSearching(false);
  };

  const handleAccept = async (requesterId: string) => {
    await acceptFriendRequest(requesterId);
    await loadData();
  };

  const copyInvite = () => {
    if (!inviteCode) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const leaderboard = myProfile
    ? [{ ...myProfile, isMe: true }, ...friends.map((f) => ({ ...f, isMe: false }))]
        .sort((a, b) => b.streak_count - a.streak_count)
    : [];

  const bg: React.CSSProperties = {
    minHeight: "100vh", background: "#FAF8F3", padding: "40px 20px 80px",
    fontFamily: "system-ui, sans-serif", color: "#1c1917", position: "relative", overflow: "hidden",
  };

  if (loading) return (
    <main style={bg}>
      <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center", paddingTop: "80px", color: "#a8a29e" }}>Loading…</div>
    </main>
  );

  return (
    <main style={bg}>
      <div style={{ position: "fixed", top: "-15%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(251,191,36,0.2)", filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-15%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "rgba(253,186,116,0.18)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: "540px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => router.push("/")} style={{ color: "#a8a29e", background: "none", border: "none", fontSize: "14px", cursor: "pointer" }}>← Start Now</button>
          <button onClick={() => router.push("/profile")} style={{ fontSize: "14px", color: "#78716c", background: "rgba(255,255,255,0.7)", padding: "8px 14px", borderRadius: "999px", border: "1px solid rgba(0,0,0,0.07)", cursor: "pointer" }}>Profile</button>
        </div>

        <h1 style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: "Georgia, serif" }}>Your circle</h1>
        <p style={{ color: "#78716c", margin: "0 0 28px", lineHeight: 1.6 }}>Friends ranked by streak. Stay consistent, climb the board.</p>

        {/* Leaderboard */}
        <div style={{ ...glassCard, marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Streak leaderboard</p>
          {leaderboard.length === 0 ? (
            <p style={{ color: "#a8a29e", fontSize: "14px", margin: 0, textAlign: "center", padding: "16px 0" }}>Add friends to see the leaderboard</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {leaderboard.map((person, i) => (
                <div key={person.username} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: person.isMe ? "rgba(245,158,11,0.08)" : "#fff", border: person.isMe ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: i === 0 ? "#f59e0b" : "#a8a29e", width: "24px", textAlign: "center", fontFamily: "Georgia, serif" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{person.username}</span>
                    {person.isMe && <span style={{ fontSize: "12px", color: "#d97706", marginLeft: "8px" }}>you</span>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "18px", fontFamily: "Georgia, serif" }}>{person.streak_count}</div>
                    <div style={{ fontSize: "11px", color: "#a8a29e" }}>day streak</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div style={{ ...glassCard, marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Friend requests</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pending.map((req) => (
                <div key={req.requester_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "#fff", border: "1px solid rgba(0,0,0,0.06)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{req.username}</span>
                    <span style={{ fontSize: "13px", color: "#a8a29e", marginLeft: "8px" }}>🔥 {req.streak_count} day streak</span>
                  </div>
                  <button onClick={() => handleAccept(req.requester_id)} style={{ padding: "8px 16px", borderRadius: "999px", border: "none", background: "#f59e0b", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add by username */}
        <div style={{ ...glassCard, marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Add by username</p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="username" autoComplete="off"
              style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "15px", outline: "none", background: "#fff" }}
            />
            <button type="submit" disabled={searching || !searchUsername.trim()} style={{ padding: "12px 18px", borderRadius: "12px", border: "none", background: searchUsername.trim() ? "#f59e0b" : "#e5e7eb", color: searchUsername.trim() ? "white" : "#9ca3af", fontWeight: 600, fontSize: "14px", cursor: searchUsername.trim() ? "pointer" : "not-allowed" }}>
              {searching ? "…" : "Add"}
            </button>
          </form>
          {searchResult && (
            <p style={{ fontSize: "13px", color: searchResult.isError ? "#ef4444" : "#16a34a", margin: "10px 0 0" }}>{searchResult.message}</p>
          )}
        </div>

        {/* Invite link */}
        <div style={glassCard}>
          <p style={{ fontSize: "12px", color: "#a8a29e", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px", fontWeight: 600 }}>Invite via link</p>
          <p style={{ fontSize: "13px", color: "#78716c", margin: "0 0 12px", lineHeight: 1.5 }}>Anyone who opens this link and signs in gets added to your circle automatically.</p>
          <button onClick={copyInvite} style={{ width: "100%", padding: "12px", borderRadius: "999px", border: "none", background: copied ? "#f59e0b" : "rgba(245,158,11,0.1)", color: copied ? "white" : "#d97706", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            {copied ? "Copied! ✓" : "Copy invite link"}
          </button>
        </div>
      </div>
    </main>
  );
}
