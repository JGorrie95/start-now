"use client";
import { useEffect, useId, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { colors, fonts, tint, cardSurface, pageBg } from "@/app/theme";
import { BackButton } from "@/app/back-button";
import { moods } from "@/app/moods";
import { Avatar, uploadAvatar, removeAvatar, makeLocalPhoto } from "@/app/avatar";
import { alarmSounds, previewSound, stopPreviewSound, type AlarmSound } from "@/app/sounds";
import { subscribePreferences, getTheme, setTheme, getSound, setSound, getLocalPhoto, setLocalPhoto, saveLocalStreak, type ThemeChoice, type SoundId } from "@/app/preferences";
import { testPhoneAlarm } from "@/app/native";
import { leaveFriends } from "@/app/actions";

type Account =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; email: string; username: string | null; avatarUrl: string | null; anonymous: boolean };

const sectionLabel: CSSProperties = {
  fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft, margin: "30px 6px 10px",
};
const group: CSSProperties = { ...cardSurface, borderRadius: "22px", overflow: "hidden" };
const footnote: CSSProperties = { fontSize: "13px", lineHeight: 1.5, color: colors.inkSoft, margin: "10px 6px 0" };
const pillButton: CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", height: "40px", padding: "0 16px",
  borderRadius: "20px", border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "14px",
  fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", boxSizing: "border-box",
};
const textButton: CSSProperties = {
  height: "40px", padding: "0 10px", border: "none", background: "none", color: colors.inkSoft, fontSize: "14px",
  fontWeight: 600, fontFamily: fonts.body, cursor: "pointer",
};

const themeOptions: { id: ThemeChoice; label: string }[] = [
  { id: "system", label: "Automatic" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

// ---------- Little pictures ----------

// A tiny drawing of the app in each look. "Automatic" is half light, half dark.
function ThemePicture({ kind }: { kind: ThemeChoice }) {
  const clipId = useId();
  const light = { bg: "#EAE3D2", card: "#FBFAF5", line: "#CDC5B4", accent: "#2F6F5E" };
  const dark = { bg: "#171614", card: "#2A2824", line: "#5A554C", accent: "#7CCBB2" };
  const scene = (c: typeof light) => (
    <>
      <rect width="96" height="64" rx="10" fill={c.bg} />
      <rect x="10" y="10" width="76" height="24" rx="7" fill={c.card} />
      <rect x="17" y="17" width="38" height="4" rx="2" fill={c.line} />
      <rect x="17" y="25" width="26" height="3" rx="1.5" fill={c.line} />
      <rect x="10" y="41" width="46" height="13" rx="6.5" fill={c.accent} />
    </>
  );
  return (
    <svg width="100%" viewBox="0 0 96 64" aria-hidden="true" style={{ display: "block", borderRadius: "10px", border: `1px solid ${tint(colors.ink, 0.1)}` }}>
      {scene(kind === "dark" ? dark : light)}
      {kind === "system" && (
        <>
          <clipPath id={clipId}>
            <polygon points="58,0 96,0 96,64 38,64" />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>{scene(dark)}</g>
        </>
      )}
    </svg>
  );
}

function SoundIcon({ id }: { id: SoundId }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (id) {
    case "iphone": // alarm clock
      return (
        <svg {...common}><circle cx="12" cy="13" r="7" /><path d="M12 9.5V13l2.5 1.5M4.5 5.5l3-2.5M19.5 5.5l-3-2.5" /></svg>
      );
    case "chimes": // wind chimes
      return (
        <svg {...common}><path d="M4 4h16M7 4v9M12 4v13M17 4v7" /><circle cx="7" cy="15" r="1.6" fill="currentColor" /><circle cx="12" cy="19" r="1.6" fill="currentColor" /><circle cx="17" cy="13" r="1.6" fill="currentColor" /></svg>
      );
    case "bell":
      return (
        <svg {...common}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></svg>
      );
    case "bounce": // music note
      return (
        <svg {...common}><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" fill="currentColor" /><circle cx="16.5" cy="16" r="2.5" fill="currentColor" /></svg>
      );
    default: // beeps: sound waves
      return (
        <svg {...common}><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4" /></svg>
      );
  }
}

function PlayingBars() {
  return (
    <span aria-label="Playing" style={{ display: "inline-flex", alignItems: "flex-end", gap: "3px", height: "16px", flexShrink: 0 }}>
      {[0, 0.2, 0.4].map((delay) => (
        <span key={delay} className="eq-bar" style={{ width: "3px", height: "16px", borderRadius: "2px", background: colors.pineDeep, animationDelay: `${delay}s` }} />
      ))}
    </span>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden="true" style={{ width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", background: selected ? colors.pineDeep : "transparent", border: selected ? "none" : `2px solid ${tint(colors.ink, 0.2)}` }}>
      {selected && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.onAccent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      )}
    </span>
  );
}

function SoundRow({ sound, selected, playing, last, onPick }: { sound: AlarmSound; selected: boolean; playing: boolean; last: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onPick}
      className="settings-row"
      style={{
        width: "100%", minHeight: "68px", display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px",
        background: "transparent", border: "none", borderBottom: last ? "none" : `1px solid ${tint(colors.ink, 0.07)}`,
        textAlign: "left", cursor: "pointer", color: colors.ink, fontFamily: fonts.body, boxSizing: "border-box",
      }}
    >
      <span style={{ width: "42px", height: "42px", borderRadius: "13px", background: moods[sound.mood].background, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <SoundIcon id={sound.id} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "16px", fontWeight: 700 }}>{sound.name}</span>
        <span style={{ display: "block", fontSize: "13px", lineHeight: 1.4, color: colors.inkSoft, marginTop: "2px" }}>{sound.detail}</span>
      </span>
      {playing && <PlayingBars />}
      <RadioMark selected={selected} />
    </button>
  );
}

// ---------- The page ----------

export default function SettingsPage() {
  const router = useRouter();
  const theme = useSyncExternalStore(subscribePreferences, getTheme, () => "system" as ThemeChoice);
  const sound = useSyncExternalStore(subscribePreferences, getSound, () => "chimes" as SoundId);
  const localPhoto = useSyncExternalStore(subscribePreferences, getLocalPhoto, () => null);
  const [playing, setPlaying] = useState<SoundId | null>(null);
  const [account, setAccount] = useState<Account>({ status: "loading" });
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(async ({ data: { user } }) => {
        if (cancelled) return;
        if (!user) {
          setAccount({ status: "signedOut" });
          return;
        }
        const { data } = await supabase.from("profiles").select("username, avatar_url").eq("id", user.id).maybeSingle();
        if (cancelled) return;
        setAccount({ status: "signedIn", email: user.email ?? "", username: data?.username ?? null, avatarUrl: data?.avatar_url ?? null, anonymous: !!user.is_anonymous });
      })
      .catch(() => {
        if (!cancelled) setAccount({ status: "signedOut" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Leaving the page stops any preview that's still playing.
  useEffect(() => () => stopPreviewSound(), []);

  const pickSound = async (choice: AlarmSound) => {
    setSound(choice.id);
    setTestMessage("");
    if (!choice.file || playing === choice.id) {
      // The iPhone alarm can't play inside the page (use "Test my alarm"), and tapping a
      // sound that's playing stops it.
      stopPreviewSound();
      setPlaying(null);
      return;
    }
    setPlaying(choice.id);
    const finished = () => setPlaying((current) => (current === choice.id ? null : current));
    const ok = await previewSound(choice.id, finished);
    if (!ok) finished();
  };

  const testAlarm = async () => {
    stopPreviewSound();
    setPlaying(null);
    setTestMessage("Setting it…");
    const result = await testPhoneAlarm(sound, 5);
    setTestMessage(
      result === "alarm"
        ? "It rings in 5 seconds. Lock your phone to see it the way it'll look."
        : result === "notification"
          ? "Alarms are switched off for Start Now, so you'll get a notification instead. You can turn alarms on for Start Now in your iPhone's Settings app."
          : result === "off"
            ? "Alarms and notifications are switched off for Start Now. You can turn them on in your iPhone's Settings app."
            : "This needs the newest version of the app.",
    );
  };

  const changePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // so picking the same photo again still works
    if (!file || account.status === "loading") return;
    setPhotoBusy(true);
    setPhotoError("");
    if (account.status === "signedOut") {
      // No account: the photo stays on this device.
      const local = await makeLocalPhoto(file);
      if (local.url) setLocalPhoto(local.url);
      else setPhotoError(local.error ?? "That photo couldn't be saved.");
      setPhotoBusy(false);
      return;
    }
    const result = await uploadAvatar(file);
    if (result.url) setAccount({ ...account, avatarUrl: result.url });
    else setPhotoError(result.error ?? "The photo didn't save.");
    setPhotoBusy(false);
  };

  const deletePhoto = async () => {
    if (account.status !== "signedIn") return;
    setPhotoBusy(true);
    setPhotoError("");
    const result = await removeAvatar();
    if (result.error) setPhotoError(result.error);
    else setAccount({ ...account, avatarUrl: null });
    setPhotoBusy(false);
  };

  // Before signing out or leaving, copy the streak onto this phone so it keeps going.
  const keepStreakOnPhone = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("streak_count, longest_streak, last_completed_date").eq("id", user.id).maybeSingle();
      if (data) saveLocalStreak({ count: data.streak_count ?? 0, longest: data.longest_streak ?? 0, lastDate: data.last_completed_date ?? null });
    } catch {
      // Offline: the phone keeps whatever streak it already had.
    }
  };

  const signOut = async () => {
    await keepStreakOnPhone();
    await createClient().auth.signOut();
    router.push("/");
  };

  // Friends accounts without an email: leave the circle and delete the nickname for good.
  const leave = async () => {
    setLeaving(true);
    await keepStreakOnPhone();
    try {
      await leaveFriends();
    } catch {
      // Still sign out below.
    }
    await createClient().auth.signOut();
    router.push("/profile");
  };

  const lastSound = alarmSounds[alarmSounds.length - 1].id;

  return (
    <main style={{ ...pageBg, padding: "20px 20px 80px" }}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "520px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <BackButton href="/" previous label="Back" style={{ marginBottom: "22px" }} />
        <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: fonts.body }}>Settings</h1>
        <p style={{ margin: "6px 0 0", fontSize: "15px", color: colors.inkSoft }}>Make Start Now feel like yours.</p>

        {/* Profile photo */}
        <h2 style={sectionLabel}>PROFILE PHOTO</h2>
        <div style={{ ...group, padding: "18px", display: "flex", alignItems: "center", gap: "16px" }}>
          {account.status === "loading" ? (
            <>
              <span style={{ width: "72px", height: "72px", borderRadius: "50%", background: tint(colors.ink, 0.08), flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", width: "55%", height: "14px", borderRadius: "7px", background: tint(colors.ink, 0.08) }} />
                <span style={{ display: "block", width: "80%", height: "12px", borderRadius: "6px", background: tint(colors.ink, 0.06), marginTop: "10px" }} />
              </span>
            </>
          ) : account.status === "signedIn" ? (
            <>
              <label style={{ position: "relative", cursor: photoBusy ? "wait" : "pointer", flexShrink: 0 }}>
                <input type="file" accept="image/*" onChange={changePhoto} disabled={photoBusy} style={{ display: "none" }} />
                <span style={{ display: "block", opacity: photoBusy ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                  <Avatar url={account.avatarUrl} size={72} />
                </span>
                <span aria-hidden="true" style={{ position: "absolute", right: "-2px", bottom: "-2px", width: "28px", height: "28px", borderRadius: "50%", background: colors.pineDeep, color: colors.onAccent, border: `3px solid ${colors.paper}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3V19H4z" /><circle cx="12" cy="13.2" r="3.2" /></svg>
                </span>
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "17px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.username ?? "Your profile"}</div>
                <div style={{ fontSize: "13px", color: colors.inkSoft, marginTop: "2px" }}>Your friends can see this photo.</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", flexWrap: "wrap" }}>
                  <label className="solid-press" style={{ ...pillButton, cursor: photoBusy ? "wait" : "pointer" }}>
                    <input type="file" accept="image/*" onChange={changePhoto} disabled={photoBusy} style={{ display: "none" }} />
                    {photoBusy ? "Saving…" : account.avatarUrl ? "Change photo" : "Add a photo"}
                  </label>
                  {account.avatarUrl && !photoBusy && (
                    <button type="button" onClick={deletePhoto} style={textButton}>Remove</button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <label style={{ position: "relative", cursor: photoBusy ? "wait" : "pointer", flexShrink: 0 }}>
                <input type="file" accept="image/*" onChange={changePhoto} disabled={photoBusy} style={{ display: "none" }} />
                <span style={{ display: "block", opacity: photoBusy ? 0.5 : 1 }}>
                  <Avatar url={localPhoto} size={72} />
                </span>
                <span aria-hidden="true" style={{ position: "absolute", right: "-2px", bottom: "-2px", width: "28px", height: "28px", borderRadius: "50%", background: colors.pineDeep, color: colors.onAccent, border: `3px solid ${colors.paper}`, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h3l1.8-2.5h6.4L17 8.5h3V19H4z" /><circle cx="12" cy="13.2" r="3.2" /></svg>
                </span>
              </label>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>Your photo</div>
                <div style={{ fontSize: "13px", lineHeight: 1.45, color: colors.inkSoft, marginTop: "2px" }}>Stays on this phone. No account needed.</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "10px", flexWrap: "wrap" }}>
                  <label className="solid-press" style={{ ...pillButton, cursor: photoBusy ? "wait" : "pointer" }}>
                    <input type="file" accept="image/*" onChange={changePhoto} disabled={photoBusy} style={{ display: "none" }} />
                    {photoBusy ? "Saving…" : localPhoto ? "Change photo" : "Add a photo"}
                  </label>
                  {localPhoto && !photoBusy && (
                    <button type="button" onClick={() => setLocalPhoto(null)} style={textButton}>Remove</button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        {photoError && <p role="alert" style={{ ...footnote, color: colors.danger }}>{photoError}</p>}

        {/* Light / dark */}
        <h2 style={sectionLabel}>APPEARANCE</h2>
        <div role="radiogroup" aria-label="Appearance" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
          {themeOptions.map(({ id, label }) => {
            const selected = theme === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(id)}
                className="solid-press"
                style={{
                  ...cardSurface, borderRadius: "20px", padding: "10px 10px 12px", cursor: "pointer", color: colors.ink,
                  fontFamily: fonts.body, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
                  border: `2px solid ${selected ? colors.pineDeep : "transparent"}`, boxSizing: "border-box",
                }}
              >
                <ThemePicture kind={id} />
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700 }}>
                  <RadioMark selected={selected} />
                  {label}
                </span>
              </button>
            );
          })}
        </div>
        <p style={footnote}>Automatic follows your phone or computer: light in the day, dark at night if it&apos;s set up that way.</p>

        {/* Alarm sound */}
        <h2 style={sectionLabel}>ALARM SOUND</h2>
        <div role="radiogroup" aria-label="Alarm sound" style={group}>
          {alarmSounds.map((choice) => {
            const row = (
              <SoundRow
                key={choice.id}
                sound={choice}
                selected={sound === choice.id}
                playing={playing === choice.id}
                last={choice.id === lastSound}
                onPick={() => void pickSound(choice)}
              />
            );
            return choice.appOnly ? (
              <div key={choice.id} className="app-only">{row}</div>
            ) : (
              row
            );
          })}
        </div>
        <p style={footnote}>
          Tap a sound to hear it. It plays when your timer is up.
          <span className="app-only-inline"> The iPhone alarm rings until you tap Stop. The others ring for about 30 seconds.</span>
        </p>

        <div className="app-only" style={{ marginTop: "14px" }}>
          <button type="button" onClick={() => void testAlarm()} className="solid-press" style={{ ...pillButton, width: "100%", height: "52px", borderRadius: "18px", fontSize: "16px", boxShadow: `0 10px 24px ${tint(colors.pineDeep, 0.25)}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="7" /><path d="M12 9.5V13l2.5 1.5M4.5 5.5l3-2.5M19.5 5.5l-3-2.5" /></svg>
            Test my alarm
          </button>
          {testMessage && (
            <p role="status" style={{ ...footnote, padding: "12px 14px", borderRadius: "14px", background: tint(colors.pine, 0.12), color: colors.ink }}>{testMessage}</p>
          )}
        </div>

        {/* Account */}
        {account.status === "signedIn" && account.anonymous && (
          <>
            <h2 style={sectionLabel}>FRIENDS</h2>
            <div style={group}>
              <div style={{ padding: "16px", borderBottom: `1px solid ${tint(colors.ink, 0.07)}`, fontSize: "14px", lineHeight: 1.5, color: colors.inkSoft }}>
                Your nickname is <strong style={{ color: colors.ink }}>{account.username ?? "not set yet"}</strong>. There&apos;s no email or password, so it lives on this phone.
              </div>
              {confirmLeave ? (
                <div style={{ padding: "16px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.5, color: colors.ink }}>
                    Leave your circle? Friends won&apos;t see you anymore and this nickname is deleted for good. Your streak stays on this phone.
                  </p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => void leave()} disabled={leaving} className="solid-press" style={{ ...pillButton, background: colors.danger, color: "#FFFFFF" }}>
                      {leaving ? "Leaving…" : "Leave friends"}
                    </button>
                    <button type="button" onClick={() => setConfirmLeave(false)} disabled={leaving} style={textButton}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmLeave(true)} className="settings-row" style={{ width: "100%", padding: "16px", border: "none", background: "transparent", textAlign: "left", fontSize: "16px", fontWeight: 700, color: colors.danger, cursor: "pointer", fontFamily: fonts.body }}>
                  Leave friends
                </button>
              )}
            </div>
          </>
        )}
        {account.status === "signedIn" && !account.anonymous && (
          <>
            <h2 style={sectionLabel}>ACCOUNT</h2>
            <div style={group}>
              <div style={{ padding: "16px", borderBottom: `1px solid ${tint(colors.ink, 0.07)}`, fontSize: "14px", color: colors.inkSoft }}>
                Signed in as <strong style={{ color: colors.ink, wordBreak: "break-all" }}>{account.email}</strong>
              </div>
              <button type="button" onClick={() => void signOut()} className="settings-row" style={{ width: "100%", padding: "16px", border: "none", background: "transparent", textAlign: "left", fontSize: "16px", fontWeight: 700, color: colors.danger, cursor: "pointer", fontFamily: fonts.body }}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
