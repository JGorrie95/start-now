"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendFriendRequest, acceptFriendRequest } from "@/app/actions";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { BackButton } from "@/app/back-button";
import { moods } from "@/app/moods";
import { JoinFriendsForm } from "@/app/join-friends";
import { Avatar } from "@/app/avatar";

type FriendProfile = {
  username: string;
  streak_count: number;
  longest_streak: number;
  avatar_url: string | null;
};

type PendingRequest = {
  requester_id: string;
  username: string;
  streak_count: number;
};

const card: React.CSSProperties = { ...cardSurface, padding: "20px 22px" };

const navButton: React.CSSProperties = {
  fontSize: "14px", color: colors.inkSoft, background: colors.paper, padding: "8px 14px",
  borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.08)}`, cursor: "pointer", fontFamily: fonts.body,
};

export default function FriendsPage() {
  const router = useRouter();
  const [myProfile, setMyProfile] = useState<{ username: string; streak_count: number; longest_streak: number; avatar_url: string | null } | null>(null);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<{ message: string; isError: boolean } | null>(null);
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  // No friends account yet: show the nickname page instead.
  const [needsNickname, setNeedsNickname] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNeedsNickname(true); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, streak_count, longest_streak, invite_code, avatar_url")
      .eq("id", user.id)
      .single();

    if (!profile) { setNeedsNickname(true); setLoading(false); return; }
    setNeedsNickname(false);
    setMyProfile({ username: profile.username, streak_count: profile.streak_count, longest_streak: profile.longest_streak, avatar_url: profile.avatar_url });
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
        .select("username, streak_count, longest_streak, avatar_url")
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
  }, []);

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

  const bg: React.CSSProperties = { ...pageBg, padding: "40px 20px 80px" };

  if (loading) return (
    <main style={bg}>
      <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center", paddingTop: "80px", color: colors.inkFaint }}>Loading…</div>
    </main>
  );

  if (needsNickname) return (
    <main style={bg}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "540px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="web-only" style={{ marginBottom: "32px" }}>
          <BackButton />
        </div>
        <h1 style={{ fontSize: "34px", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 16px", fontFamily: fonts.body }}>Friends</h1>
        <div style={{ borderRadius: "28px", padding: "24px 22px", background: moods.dusk.background, color: "#FFFFFF", marginBottom: "16px", boxShadow: "0 18px 40px rgba(74, 58, 99, 0.28)" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255, 255, 255, 0.88)" }}>KEEP EACH OTHER GOING</div>
          <p style={{ margin: "10px 0 6px", fontFamily: fonts.display, fontSize: "28px", lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.01em" }}>See each other&apos;s streaks. Cheer each other on.</p>
          <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.5, color: "rgba(255, 255, 255, 0.92)" }}>No email. No password. Just a nickname.</p>
        </div>
        <JoinFriendsForm
          buttonLabel="Start my circle →"
          onJoined={async () => {
            setLoading(true);
            await loadData();
          }}
        />
      </div>
    </main>
  );

  return (
    <main style={bg}>
      <div className="grain-overlay" />

      <div style={{ maxWidth: "540px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="web-only" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <BackButton />
          <button onClick={() => router.push("/profile")} style={navButton}>Profile</button>
        </div>

        <h1 style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 6px", fontFamily: fonts.display }}>Your circle</h1>
        <p style={{ color: colors.inkSoft, margin: "0 0 28px", lineHeight: 1.6 }}>Friends ranked by streak. Stay consistent, climb the board.</p>

        {/* Leaderboard */}
        <div style={{ ...card, marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: colors.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Streak leaderboard</p>
          {leaderboard.length === 0 ? (
            <p style={{ color: colors.inkFaint, fontSize: "14px", margin: 0, textAlign: "center", padding: "16px 0" }}>Add friends to see the leaderboard</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {leaderboard.map((person, i) => (
                <div key={person.username} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: radius.sm, background: person.isMe ? tint(colors.pine, 0.08) : colors.field, border: person.isMe ? `1px solid ${tint(colors.pine, 0.22)}` : `1px solid ${tint(colors.ink, 0.06)}` }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: i === 0 ? colors.pineDeep : colors.inkFaint, width: "24px", textAlign: "center", fontFamily: fonts.display }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                  </div>
                  <Avatar url={person.avatar_url} size={34} label={person.username} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>{person.username}</span>
                    {person.isMe && <span style={{ fontSize: "12px", color: colors.pineDeep, marginLeft: "8px" }}>you</span>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: colors.pineDeep, fontSize: "18px", fontFamily: fonts.display }}>{person.streak_count}</div>
                    <div style={{ fontSize: "11px", color: colors.inkFaint }}>day streak</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div style={{ ...card, marginBottom: "16px" }}>
            <p style={{ fontSize: "12px", color: colors.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Friend requests</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pending.map((req) => (
                <div key={req.requester_id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: radius.sm, background: colors.field, border: `1px solid ${tint(colors.ink, 0.06)}` }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600 }}>{req.username}</span>
                    <span style={{ fontSize: "13px", color: colors.inkFaint, marginLeft: "8px" }}>🔥 {req.streak_count} day streak</span>
                  </div>
                  <button onClick={() => handleAccept(req.requester_id)} style={{ padding: "8px 16px", borderRadius: radius.sm, border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>Accept</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add by username */}
        <div style={{ ...card, marginBottom: "16px" }}>
          <p style={{ fontSize: "12px", color: colors.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 14px", fontWeight: 600 }}>Add by username</p>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="username" autoComplete="off"
              className="text-field" style={{ flex: 1, padding: "12px 16px", borderRadius: radius.sm, border: `1.5px solid ${colors.fieldBorder}`, fontSize: "15px", outline: "none", background: colors.field, fontFamily: fonts.body }}
            />
            <button type="submit" disabled={searching || !searchUsername.trim()} style={{ padding: "12px 18px", borderRadius: radius.sm, border: "none", background: searchUsername.trim() ? colors.pineDeep : colors.disabledBg, color: searchUsername.trim() ? colors.onAccent : colors.disabledText, fontWeight: 600, fontSize: "14px", cursor: searchUsername.trim() ? "pointer" : "not-allowed", fontFamily: fonts.body }}>
              {searching ? "…" : "Add"}
            </button>
          </form>
          {searchResult && (
            <p style={{ fontSize: "13px", color: searchResult.isError ? colors.danger : colors.success, margin: "10px 0 0" }}>{searchResult.message}</p>
          )}
        </div>

        {/* Invite link */}
        <div style={card}>
          <p style={{ fontSize: "12px", color: colors.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px", fontWeight: 600 }}>Invite via link</p>
          <p style={{ fontSize: "13px", color: colors.inkSoft, margin: "0 0 12px", lineHeight: 1.5 }}>Send this to a friend. They can join your circle with just a nickname, no email needed.</p>
          <button onClick={copyInvite} style={{ width: "100%", padding: "12px", borderRadius: radius.sm, border: "none", background: copied ? colors.pineDeep : tint(colors.pine, 0.1), color: copied ? colors.onAccent : colors.pineDeep, fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
            {copied ? "Copied! ✓" : "Copy invite link"}
          </button>
        </div>
      </div>
    </main>
  );
}
