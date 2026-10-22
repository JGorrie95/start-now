"use client";
// The way into friends without an email: pick a nickname and you're in.
// Behind the scenes it makes an anonymous account (no email, no password) that lives on
// this phone. The streak that was saved on the phone carries over, so nothing is lost.
import { useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createProfile } from "@/app/actions";
import { colors, fonts, tint, cardSurface } from "@/app/theme";
import { Avatar, shareLocalPhoto } from "@/app/avatar";
import { subscribePreferences, getLocalPhoto, getLocalStreak, localDate } from "@/app/preferences";

export function JoinFriendsForm({
  buttonLabel,
  onJoined,
  signInHref = "/auth",
  plain = false,
}: {
  buttonLabel: string;
  onJoined: () => Promise<void> | void;
  signInHref?: string;
  plain?: boolean; // true when it already sits inside a card
}) {
  const localPhoto = useSyncExternalStore(subscribePreferences, getLocalPhoto, () => null);
  const [nickname, setNickname] = useState("");
  const [sharePhoto, setSharePhoto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready = nickname.trim().length > 0;

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const name = nickname.trim();
    if (!name || busy) return;
    if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) {
      setError("3–20 characters: letters, numbers and _ only.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        const { error: signInError } = await supabase.auth.signInAnonymously();
        if (signInError) {
          console.error("Anonymous sign-in error:", signInError);
          setError(
            signInError.code === "anonymous_provider_disabled"
              ? "Friends without an email aren't switched on yet. Please try again later."
              : "Couldn't connect. Check your internet and try again.",
          );
          setBusy(false);
          return;
        }
      }
      const result = await createProfile(name, getLocalStreak(), localDate());
      if (result.error) {
        setError(result.error === "unauthenticated" ? "Couldn't connect. Please try again." : result.error);
        setBusy(false);
        return;
      }
      if (sharePhoto && localPhoto) await shareLocalPhoto(localPhoto);
      await onJoined();
    } catch (problem) {
      console.error("Join friends error:", problem);
      setError("Couldn't connect. Check your internet and try again.");
    }
    setBusy(false);
  };

  const form = (
    <form onSubmit={join}>
      <label htmlFor="nickname" style={{ display: "block", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft, marginBottom: "8px", textAlign: "left" }}>
        PICK A NICKNAME
      </label>
      <input
        id="nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="e.g. sunny_day"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={20}
        className="text-field"
        style={{ width: "100%", boxSizing: "border-box", height: "52px", padding: "0 16px", borderRadius: "14px", border: `1.5px solid ${colors.fieldBorder}`, background: colors.field, color: colors.ink, fontSize: "16px", fontFamily: fonts.body, outline: "none" }}
      />
      <p style={{ margin: "8px 2px 0", fontSize: "13px", color: colors.inkSoft, textAlign: "left" }}>Friends will see this. Letters, numbers and _ only.</p>

      {localPhoto && (
        <label style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "14px", padding: "12px", borderRadius: "14px", background: tint(colors.ink, 0.04), cursor: "pointer", textAlign: "left" }}>
          <input type="checkbox" checked={sharePhoto} onChange={(e) => setSharePhoto(e.target.checked)} style={{ width: "22px", height: "22px", accentColor: colors.pineDeep, flexShrink: 0 }} />
          <Avatar url={localPhoto} size={36} />
          <span style={{ fontSize: "14px", lineHeight: 1.4 }}>Let friends see my photo</span>
        </label>
      )}

      {error && <p role="alert" style={{ margin: "12px 2px 0", fontSize: "14px", color: colors.danger, textAlign: "left" }}>{error}</p>}

      <button
        type="submit"
        disabled={busy || !ready}
        className="solid-press"
        style={{ marginTop: "14px", width: "100%", height: "52px", borderRadius: "16px", border: "none", background: ready ? colors.pineDeep : colors.disabledBg, color: ready ? colors.onAccent : colors.disabledText, fontSize: "16px", fontWeight: 700, cursor: busy ? "wait" : ready ? "pointer" : "not-allowed", fontFamily: fonts.body }}
      >
        {busy ? "Setting up…" : buttonLabel}
      </button>
    </form>
  );

  return (
    <div>
      {plain ? form : <div style={{ ...cardSurface, padding: "20px", borderRadius: "22px" }}>{form}</div>}
      <p style={{ fontSize: "13px", lineHeight: 1.55, color: colors.inkSoft, margin: "12px 6px 0", textAlign: "left" }}>
        Your friends account is stored online so your friends can see it: your nickname, your streak and who&apos;s in your circle{localPhoto ? ", plus your photo if you tick the box" : ""}. That&apos;s all we collect, and we never sell or share it. There&apos;s no email or password, so it&apos;s tied to this phone: if you delete the app, it&apos;s gone.
      </p>
      <p style={{ textAlign: "center", margin: "14px 0 0" }}>
        <Link href={signInHref} style={{ color: colors.inkSoft, fontSize: "14px", fontWeight: 600, textUnderlineOffset: "3px" }}>
          Already have an email account? Sign in
        </Link>
      </p>
    </div>
  );
}
