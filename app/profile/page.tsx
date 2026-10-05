"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/app/actions";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";

type Profile = {
  username: string;
  streak_count: number;
  longest_streak: number;
  invite_code: string;
  avatar_url: string | null;
};

const card: React.CSSProperties = { ...cardSurface, padding: "24px" };

const navButton: React.CSSProperties = {
  fontSize: "14px", color: colors.inkSoft, background: colors.paper, padding: "8px 14px",
  borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.08)}`, cursor: "pointer", fontFamily: fonts.body,
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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { data } = await supabase
      .from("profiles")
      .select("username, streak_count, longest_streak, invite_code, avatar_url")
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5MB."); return; }
    if (!file.type.startsWith("image/")) { setUploadError("Please choose an image file."); return; }

    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });

    if (upErr) {
      console.error("Avatar upload error:", upErr);
      setUploadError("Upload failed. Make sure the 'avatars' storage bucket exists.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const bustedUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: bustedUrl }).eq("id", user.id);
    await loadProfile();
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

  if (needsSetup) return (
    <main style={bg}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "480px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <button onClick={() => router.push("/")} style={{ color: colors.inkFaint, background: "none", border: "none", fontSize: "14px", cursor: "pointer", marginBottom: "32px", fontFamily: fonts.body }}>← Start Now</button>
        <h1 style={{ fontSize: "36px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 8px", fontFamily: fonts.display }}>Pick your username</h1>
        <p style={{ color: colors.inkSoft, marginBottom: "28px", lineHeight: 1.6 }}>This is how your friends will find you and see your streak.</p>
        <div style={card}>
          <form onSubmit={handleCreateProfile} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jakob_g" autoComplete="off"
              style={{ padding: "14px 18px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.1)}`, fontSize: "16px", outline: "none", background: colors.field, fontFamily: fonts.body }}
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
          <button onClick={() => router.push("/")} style={{ color: colors.inkFaint, background: "none", border: "none", fontSize: "14px", cursor: "pointer", fontFamily: fonts.body }}>← Start Now</button>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => router.push("/friends")} style={navButton}>Friends</button>
            <button onClick={handleSignOut} style={navButton}>Sign out</button>
          </div>
        </div>

        <div style={{ ...card, marginBottom: "16px", textAlign: "center", padding: "32px 24px" }}>
          <label style={{ display: "block", width: "84px", height: "84px", margin: "0 auto 16px", cursor: uploading ? "wait" : "pointer", position: "relative" }}>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: "none" }} />
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.username} style={{ width: "84px", height: "84px", borderRadius: radius.md, objectFit: "cover", border: `2px solid ${tint(colors.pine, 0.3)}` }} />
            ) : (
              <div style={{ width: "84px", height: "84px", borderRadius: radius.md, background: `linear-gradient(135deg, ${colors.pine}, ${colors.pineDeep})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SparkMark size={36} stroke={colors.onAccent} dot={colors.onAccent} />
              </div>
            )}
            <div style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "28px", height: "28px", borderRadius: "50%", background: colors.pineDeep, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", border: `2px solid ${colors.paper}`, color: colors.onAccent }}>
              {uploading ? "…" : "📷"}
            </div>
          </label>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.04em", margin: "0 0 4px", fontFamily: fonts.display }}>{profile?.username}</h1>
          <p style={{ color: colors.inkFaint, fontSize: "13px", margin: 0 }}>{uploading ? "Uploading…" : "Tap your photo to change it"}</p>
          {uploadError && <p style={{ color: colors.danger, fontSize: "13px", margin: "8px 0 0" }}>{uploadError}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.pineDeep, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{profile?.streak_count ?? 0}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>🔥 Current streak</div>
          </div>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: colors.ink, fontFamily: fonts.display, letterSpacing: "-0.04em" }}>{profile?.longest_streak ?? 0}</div>
            <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "4px" }}>⭐ Best streak</div>
          </div>
        </div>

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
      </div>
    </main>
  );
}
