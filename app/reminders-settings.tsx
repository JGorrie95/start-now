"use client";
// Settings > Reminders (iPhone app): a morning reminder, an evening reminder, and a few
// gentle nudges spread through the day. The choices are saved on the phone, and the iPhone
// app schedules the notifications itself, so nothing is sent to us.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { colors, fonts, tint, cardSurface } from "@/app/theme";
import { moods } from "@/app/moods";
import { subscribePreferences, getReminders, getServerReminders, saveReminders, MAX_NUDGES, type Reminders } from "@/app/preferences";
import { applyReminders, sendTestReminder, openNotificationSettings } from "@/app/native";

const sectionLabel: CSSProperties = {
  fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft, margin: "30px 6px 10px",
};
const group: CSSProperties = { ...cardSurface, borderRadius: "22px", overflow: "hidden", marginBottom: "12px" };
const footnote: CSSProperties = { fontSize: "13px", lineHeight: 1.5, color: colors.inkSoft, margin: "10px 6px 0" };
const row: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", minHeight: "56px", padding: "8px 16px", boxSizing: "border-box" };
const divider: CSSProperties = { borderTop: `1px solid ${tint(colors.ink, 0.07)}` };

const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Same spreading as the iPhone app does, so we can say when the nudges will arrive.
function nudgeMinutes(count: number, from: string, to: string): number[] {
  const a = minutesOf(from);
  const b = minutesOf(to);
  if (count < 1 || b <= a) return [];
  const nearest5 = (m: number) => Math.floor((m + 2) / 5) * 5;
  if (count === 1) return [nearest5(Math.floor((a + b) / 2))];
  return Array.from({ length: count }, (_, i) => nearest5(a + Math.floor(((b - a) * i) / (count - 1))));
}

function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function listOf(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function Toggle({ label, detail, checked, onChange, icon }: { label: string; detail?: string; checked: boolean; onChange: (on: boolean) => void; icon: React.ReactNode }) {
  return (
    <label style={{ ...row, minHeight: "64px", cursor: "pointer" }}>
      <span aria-hidden="true" style={{ width: "40px", height: "40px", borderRadius: "12px", background: moods.tide.background, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: "16px", fontWeight: 700 }}>{label}</span>
        {detail && <span style={{ display: "block", fontSize: "14px", color: colors.inkSoft, marginTop: "2px" }}>{detail}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="ios-switch" aria-label={label} />
    </label>
  );
}

function TimeRow({ label, value, onChange, disabled }: { label: string; value: string; onChange: (time: string) => void; disabled?: boolean }) {
  return (
    <label style={{ ...row, ...divider, opacity: disabled ? 0.45 : 1 }}>
      <span style={{ fontSize: "16px" }}>{label}</span>
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label={label}
        className="text-field"
        style={{ height: "40px", padding: "0 12px", borderRadius: "12px", border: "none", background: tint(colors.pine, 0.14), color: colors.pineDeep, fontSize: "16px", fontWeight: 700, fontFamily: fonts.body, outline: "none", minWidth: "104px", boxSizing: "border-box" }}
      />
    </label>
  );
}

const sunIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></svg>
);
const moonIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></svg>
);

export function RemindersSettings() {
  const reminders = useSyncExternalStore(subscribePreferences, getReminders, getServerReminders);
  const [message, setMessage] = useState<{ kind: "denied" | "update" | "test"; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // Saves the change right away, then (a moment after you stop sliding) tells the iPhone.
  const change = (patch: Partial<Reminders>) => {
    saveReminders(patch);
    setMessage(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const result = await applyReminders(getReminders());
      if (result === "denied") {
        // Notifications are off for the app, so don't leave switches on that can't do anything.
        saveReminders({ morningOn: false, eveningOn: false, nudges: 0 });
        setMessage({ kind: "denied", text: "Notifications are switched off for Start Now. Turn them on in your iPhone's Settings app, then switch reminders on again." });
      } else if (result === "update") {
        setMessage({ kind: "update", text: "Reminders need the newest version of the app." });
      }
    }, 500);
  };

  const sendTest = async () => {
    setMessage({ kind: "test", text: "Sending…" });
    const result = await sendTestReminder();
    setMessage(
      result === "ok"
        ? { kind: "test", text: "On its way! Go to your Home Screen or lock your phone. It arrives in about 6 seconds. (iPhone keeps notifications quiet while the app is open.)" }
        : result === "denied"
          ? { kind: "denied", text: "Notifications are switched off for Start Now. Turn them on in your iPhone's Settings app." }
          : { kind: "update", text: "Reminders need the newest version of the app." },
    );
  };

  const times = nudgeMinutes(reminders.nudges, reminders.nudgeFrom, reminders.nudgeTo);
  const badRange = reminders.nudges > 0 && minutesOf(reminders.nudgeTo) <= minutesOf(reminders.nudgeFrom);
  const nudgeTitle = reminders.nudges === 0 ? "I don't want any nudges" : `I want ${reminders.nudges} ${reminders.nudges === 1 ? "nudge" : "nudges"} a day`;

  return (
    <>
      <div className="app-only">
        <h2 style={sectionLabel}>REMINDERS</h2>

        <div style={group}>
          <Toggle label="Morning reminder" checked={reminders.morningOn} onChange={(on) => change({ morningOn: on })} icon={sunIcon} />
          <TimeRow label="Remind me at" value={reminders.morningTime} onChange={(time) => change({ morningTime: time })} disabled={!reminders.morningOn} />
        </div>

        <div style={group}>
          <Toggle label="Evening reminder" checked={reminders.eveningOn} onChange={(on) => change({ eveningOn: on })} icon={moonIcon} />
          <TimeRow label="Remind me at" value={reminders.eveningTime} onChange={(time) => change({ eveningTime: time })} disabled={!reminders.eveningOn} />
        </div>

        <h2 style={{ ...sectionLabel, marginTop: "22px" }}>NUDGES THROUGH THE DAY</h2>
        <div style={group}>
          <div style={{ padding: "16px 16px 14px" }}>
            <label htmlFor="nudge-count" style={{ display: "block", fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>{nudgeTitle}</label>
            <input
              id="nudge-count"
              type="range"
              min={0}
              max={MAX_NUDGES}
              step={1}
              value={reminders.nudges}
              onChange={(e) => change({ nudges: Number(e.target.value) })}
              style={{ width: "100%", height: "28px", accentColor: colors.pineDeep, margin: 0 }}
            />
            <div aria-hidden="true" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: colors.inkSoft, marginTop: "4px" }}>
              <span>0</span><span>{MAX_NUDGES}</span>
            </div>
          </div>
          <TimeRow label="From" value={reminders.nudgeFrom} onChange={(time) => change({ nudgeFrom: time })} disabled={reminders.nudges === 0} />
          <TimeRow label="To" value={reminders.nudgeTo} onChange={(time) => change({ nudgeTo: time })} disabled={reminders.nudges === 0} />
        </div>
        <p style={footnote}>
          {badRange
            ? "“To” needs to be later than “From”."
            : times.length > 0
              ? `Gentle reminders to start something small, around ${listOf(times.map(clock))}.`
              : "Nudges are gentle reminders to start something small. Slide up to turn them on."}
        </p>

        <button type="button" onClick={() => void sendTest()} className="solid-press" style={{ marginTop: "14px", width: "100%", height: "52px", borderRadius: "18px", border: `2px solid ${colors.pineDeep}`, background: "transparent", color: colors.pineDeep, fontSize: "16px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer", boxSizing: "border-box" }}>
          Send me a test reminder
        </button>
        {message && (
          <div role="status" style={{ ...footnote, padding: "12px 14px", borderRadius: "14px", background: tint(colors.pine, 0.12), color: colors.ink }}>
            {message.text}
            {message.kind === "denied" && (
              <button type="button" onClick={openNotificationSettings} className="solid-press" style={{ display: "block", marginTop: "10px", height: "40px", padding: "0 16px", borderRadius: "20px", border: "none", background: colors.pineDeep, color: colors.onAccent, fontSize: "14px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>
                Open iPhone Settings
              </button>
            )}
          </div>
        )}
        <p style={footnote}>Reminders are set up on your phone. Nothing is sent to us.</p>
      </div>

      <div className="web-only">
        <h2 style={sectionLabel}>REMINDERS</h2>
        <p style={{ ...footnote, margin: "0 6px" }}>Morning, evening and through-the-day reminders come with the Start Now iPhone app.</p>
      </div>
    </>
  );
}
