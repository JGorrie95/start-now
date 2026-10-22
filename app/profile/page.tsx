"use client";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/app/actions";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { BackButton } from "@/app/back-button";
import { Avatar, uploadAvatar, makeLocalPhoto } from "@/app/avatar";
import { subscribePreferences, getLocalPhoto, setLocalPhoto, getLocalStreak, streakNow, NO_STREAK } from "@/app/preferences";

type Profile = {
  username: string;
  streak_count: number;
  longest_streak: number;
  invite_code: string;
  avatar_url: string | null;
  last_completed_date: string | null;
};

const card: React.CSSProperties = { ...cardSurface, padding: "24px" };
const sectionHeading: React.CSSProperties = { margin: "26px 6px 10px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft };

const navButton: React.CSSProperties = {
  fontSize: "14px", color: colors.inkSoft, background: colors.paper, padding: "8px 14px",
  borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.08)}`, cursor: "pointer", fontFamily: fonts.body,
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const localPhoto = useSyncExternalStore(subscribePreferences, getLocalPhoto, () => null);
  const phoneStreak = streakNow(useSyncExternalStore(subscribePreferences, getLocalStreak, () => NO_STREAK));
  const [username, setUsername] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    // No account is fine: they get the on-device profile below.
    if (!user) { setSignedOut(true); setLoading(false); return; }
    setAnonymous(!!user.is_anonymous);

    const { data } = await supabase
      .from("profiles")
      .select("username, streak_count, longest_streak, invite_code, avatar_url, last_completed_date")
      .eq("id", user.id)
      .single();

    if (!data) { setNeedsSetup(true); } else { setProfile(data); }
    setLoading(false);
  }, []);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same photo again still works
    if (!file) return;
    setUploading(true);
    setUploadError("");
    if (signedOut) {
      // No account: the photo is saved on this device only.
      const result = await makeLocalPhoto(file);
      if (result.url) setLocalPhoto(result.url);
      else setUploadError(result.error ?? "That photo couldn't be saved.");
    } else {
      const result = await uploadAvatar(file);
      if (result.error) setUploadError(result.error);
      else await loadProfile();
    }
    setUploading(false);
  };

  const copyInvite = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/invite/${profile.invite_code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bg: React.CSSProperties = { ...pageBg, padding: "40px 20px 80px" };

  if (loading) return (
    <main style={bg}>
      <div style={{ maxWidth: "480px", margin: "0 auto", textAlign: "center", paddingTop: "80px", color: colors.inkFaint }}>Loading…</div>
    </main>
  );

  if (signedOut) return (
    <main style={bg}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <BackButton className="web-only" style={{ marginBottom: "32px" }} />

        <div style={{ ...card, marginBottom: "14px", textAlign: "center", padding: "32px 24px" }}>
          <label style={{ display: "block", width: "104px", height: "104px", margin: "0 auto 16px", cursor: uploading ? "wait" : "pointer", position: "relative" }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: "none" }} />
            <span style={{ display: "block", opacity: uploading ? 0.5 : 1 }}>
              <Avatar url={localPhoto} size={104} />
            </span>
            <span aria-hidden="true" style={{ position: "absolute", right: "-2px", bottom: "-2px", width: "34px", height: "34px", borderRadius: "50%", background: colors.pineDeep, color: colors.onAccent, border: `3px solid ${colors.paper}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3V19H4z" /><circle cx="12" cy="13.2" r="3.2" /></svg>
            </span>
          </label>
          <h1 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 6px", fontFamily: fonts.display }}>Your profile</h1>
          <p style={{ color: colors.inkSoft, fontSize: "14px", lineHeight: 1.5, margin: 0 }}>
            {uploading ? "Saving…" : localPhoto ? "Tap your photo to change it." : "Tap the circle to add a photo."}
            {" "}It stays on this phone. Nothing is uploaded.
          </p>
          {localPhoto && !uploading && (
            <button type="button" onClick={() => setLocalPhoto(null)} style={{ marginTop: "10px", background: "none", border: "none", color: colors.inkSoft, fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}>
              Remove photo
            </button>
          )}
          {uploadError && <p role="alert" style={{ color: colors.danger, fontSize: "13px", margin: "8px 0 0" }}>{uploadError}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
          <div style={{ ...card, textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.pineDeep, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{phoneStreak.count}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>🔥 Current streak</div>
          </div>
          <div style={{ ...card, textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.ink, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{phoneStreak.longest}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>⭐ Best streak</div>
          </div>
        </div>

        <Link href="/settings" className="settings-row" style={{ ...card, display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", marginBottom: "14px", textDecoration: "none", color: colors.ink }}>
          <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: tint(colors.pine, 0.14), color: colors.pineDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="17" r="2.2" /></svg>
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: "17px", fontWeight: 700 }}>Settings</span>
            <span style={{ display: "block", fontSize: "14px", color: colors.inkSoft, marginTop: "2px" }}>Alarm sound and dark mode</span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.inkFaint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </Link>

        <h2 style={sectionHeading}>YOUR PRIVACY</h2>
        <div style={{ ...card, padding: "20px", marginBottom: "14px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: tint(colors.pine, 0.14), color: colors.pineDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </span>
          <div>
            <p style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700 }}>What&apos;s yours stays yours.</p>
            <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.55, color: colors.inkSoft }}>
              Privacy matters to us. Without a friends account, your streak, photo and settings never leave this phone, and we collect nothing.
            </p>
            <p style={{ margin: "10px 0 0", fontSize: "15px", lineHeight: 1.55, color: colors.inkSoft }}>
              If you choose to make a friends account, it&apos;s stored online so your friends can see it: your nickname, your streak, who&apos;s in your circle, and your photo only if you choose. That&apos;s all we collect, and we will never sell or share your data with anyone.
            </p>
          </div>
        </div>

        <h2 style={sectionHeading}>FRIENDS (OPTIONAL)</h2>
        <div style={{ ...card, padding: "20px" }}>
          <p style={{ margin: "0 0 14px", fontSize: "15px", lineHeight: 1.55, color: colors.inkSoft }}>
            Want friends to cheer you on? Make a friends account with just a nickname, no email needed. It&apos;s stored online so your friends can see it, and you can delete it any time in Settings.
          </p>
          <button type="button" onClick={() => router.push("/friends")} className="solid-press" style={{ height: "48px", padding: "0 22px", borderRadius: "16px", border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: fonts.body }}>
            Add friends
          </button>
          <p style={{ margin: "14px 0 0" }}>
            <Link href="/auth" style={{ color: colors.inkSoft, fontSize: "14px", fontWeight: 600, textUnderlineOffset: "3px" }}>Have an email account? Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );

  if (needsSetup) return (
    <main style={bg}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <BackButton className="web-only" style={{ marginBottom: "32px" }} />
        <h1 style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 8px", fontFamily: fonts.display }}>Pick your username</h1>
        <p style={{ color: colors.inkSoft, marginBottom: "28px", lineHeight: 1.6 }}>This is how your friends will find you and see your streak.</p>
        <div style={card}>
          <form onSubmit={handleCreateProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jakob_g" autoComplete="off"
              className="text-field" style={{ padding: "14px 18px", borderRadius: radius.sm, border: `1.5px solid ${colors.fieldBorder}`, fontSize: "16px", outline: "none", background: colors.field, fontFamily: fonts.body }}
            />
            <p style={{ fontSize: "12px", color: colors.inkFaint, margin: 0 }}>3–20 characters. Letters, numbers and _ only.</p>
            {formError && <p style={{ color: colors.danger, fontSize: "14px", margin: 0 }}>{formError}</p>}
            <button
              type="submit" disabled={submitting || !username.trim()}
              style={{ padding: "14px", borderRadius: radius.sm, border: "none", background: username.trim() ? colors.pineDeep : colors.disabledBg, color: username.trim() ? colors.onAccent : colors.disabledText, fontSize: "15px", fontWeight: 700, cursor: username.trim() ? "pointer" : "not-allowed", fontFamily: fonts.body }}
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
      <div className="grain-overlay" />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <BackButton className="web-only" />
          <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
            <button className="web-only" onClick={() => router.push("/friends")} style={navButton}>Friends</button>
            {!anonymous && <button onClick={handleSignOut} style={navButton}>Sign out</button>}
          </div>
        </div>

        <div style={{ ...card, marginBottom: "16px", textAlign: "center", padding: "32px 24px" }}>
          <label style={{ display: "block", width: "84px", height: "84px", margin: "0 auto 16px", cursor: uploading ? "wait" : "pointer", position: "relative" }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: "none" }} />
            <Avatar url={profile?.avatar_url} size={84} label={profile?.username ?? "Your profile photo"} />
            <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "28px", height: "28px", borderRadius: "50%", background: colors.pineDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", border: `2px solid ${colors.paper}`, color: colors.onAccent }}>
              {uploading ? "…" : "📷"}
            </div>
          </label>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 4px", fontFamily: fonts.display }}>{profile?.username}</h1>
          <p style={{ color: colors.inkFaint, fontSize: "13px", margin: 0 }}>{uploading ? "Uploading…" : "Tap your photo to change it. Friends can see it."}</p>
          {uploadError && <p style={{ color: colors.danger, fontSize: "13px", margin: "8px 0 0" }}>{uploadError}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.pineDeep, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{profile ? streakNow({ count: profile.streak_count ?? 0, longest: 0, lastDate: profile.last_completed_date }).count : 0}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>🔥 Current streak</div>
          </div>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.ink, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{profile?.longest_streak ?? 0}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>⭐ Best streak</div>
          </div>
        </div>

        <Link href="/settings" className="settings-row" style={{ ...card, display: "flex", alignItems: "center", gap: "14px", padding: "16px 18px", marginBottom: "14px", textDecoration: "none", color: colors.ink }}>
          <span style={{ width: "44px", height: "44px", borderRadius: "14px", background: tint(colors.pine, 0.14), color: colors.pineDeep, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2.2" /><circle cx="9" cy="17" r="2.2" /></svg>
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: "17px", fontWeight: 700 }}>Settings</span>
            <span style={{ display: "block", fontSize: "14px", color: colors.inkSoft, marginTop: "2px" }}>Alarm sound and dark mode</span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.inkFaint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </Link>

        <div style={card}>
          <p style={{ fontSize: "13px", color: colors.inkFaint, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px", fontWeight: 600 }}>Your invite link</p>
          <p style={{ fontSize: "13px", color: colors.inkSoft, margin: "0 0 12px", lineHeight: 1.5 }}>Share this with friends so they can join your circle.</p>
          <div style={{ background: colors.field, borderRadius: radius.sm, padding: "12px 14px", border: `1px solid ${tint(colors.ink, 0.07)}`, fontSize: "13px", color: colors.inkSoft, wordBreak: "break-all", marginBottom: "10px" }}>
            {inviteUrl}
          </div>
          <button
            onClick={copyInvite}
            style={{ width: "100%", padding: "12px", borderRadius: radius.sm, border: "none", background: copied ? colors.pineDeep : tint(colors.pine, 0.1), color: copied ? colors.onAccent : colors.pineDeep, fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: fonts.body }}
          >
            {copied ? "Copied! ✓" : "Copy invite link"}
          </button>
        </div>

        <p style={{ margin: "16px 6px 0", fontSize: "13px", lineHeight: 1.55, color: colors.inkSoft }}>
          Your privacy: we only keep your {anonymous ? "nickname" : "email, username"}, your streak{profile?.avatar_url ? ", the photo you chose" : ""} and who&apos;s in your circle, so your friends can see them. We never sell or share your data with anyone.
        </p>
      </div>
    </main>
  );
}
