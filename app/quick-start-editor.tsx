"use client";
// The sheet for making (or changing) your own quick start: a name, your own first tiny
// step if you like, and a colour. It's saved on this phone only.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties, FormEvent } from "react";
import { colors, fonts, tint } from "@/app/theme";
import { moods, StarIcon, type Mood } from "@/app/moods";
import { saveCustomQuickStart, deleteCustomQuickStart, type CustomQuickStart } from "@/app/preferences";

const colourChoices: { mood: Mood; name: string }[] = [
  { mood: "lagoon", name: "Green" },
  { mood: "tide", name: "Blue" },
  { mood: "dusk", name: "Purple" },
  { mood: "rose", name: "Pink" },
  { mood: "ember", name: "Orange" },
];

const fieldLabel: CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: colors.inkSoft, margin: "0 2px 8px",
};
const field: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: "16px", border: `1.5px solid ${colors.fieldBorder}`,
  background: colors.field, color: colors.ink, fontSize: "16px", fontFamily: fonts.body, outline: "none",
};

export function QuickStartEditor({ editing, onClose }: { editing: CustomQuickStart | null; onClose: () => void }) {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [step, setStep] = useState(editing?.step ?? "");
  const [mood, setMood] = useState<Mood>(editing?.mood ?? "lagoon");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const ready = label.trim().length > 0;

  // Close with the Escape key on a computer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!ready) {
      nameRef.current?.focus();
      return;
    }
    saveCustomQuickStart({ id: editing?.id, label, step, mood: mood as CustomQuickStart["mood"] });
    onClose();
  };

  const remove = () => {
    if (editing) deleteCustomQuickStart(editing.id);
    onClose();
  };

  // Drawn on the page itself (not inside the home screen), so it covers the tab bar.
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10, 12, 11, 0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Change your quick start" : "Make your own quick start"}
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="sheet"
        style={{ width: "100%", maxWidth: "520px", maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box", background: colors.paper, color: colors.ink, borderRadius: "28px 28px 0 0", padding: "22px 20px calc(22px + env(safe-area-inset-bottom))", boxShadow: "0 -12px 40px rgba(0, 0, 0, 0.25)" }}
      >
        <div aria-hidden="true" style={{ width: "40px", height: "5px", borderRadius: "3px", background: tint(colors.ink, 0.15), margin: "-8px auto 16px" }} />
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800, letterSpacing: "-0.01em", fontFamily: fonts.body }}>
          {editing ? "Change your quick start" : "Make your own quick start"}
        </h2>
        <p style={{ margin: "0 0 18px", fontSize: "14px", lineHeight: 1.5, color: colors.inkSoft }}>For the things you get stuck on again and again.</p>

        {/* A live preview of the tile */}
        <div aria-hidden="true" style={{ width: "calc(50% - 6px)", height: "104px", boxSizing: "border-box", borderRadius: "24px", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: moods[mood].background, color: "#FFFFFF", marginBottom: "18px" }}>
          <span style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><StarIcon /></span>
          <span style={{ fontSize: "15px", fontWeight: 700, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{label.trim() || "Your quick start"}</span>
        </div>

        <label htmlFor="qs-name" style={fieldLabel}>NAME</label>
        <input ref={nameRef} id="qs-name" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="e.g. Walk the dog" autoComplete="off" className="text-field" style={{ ...field, height: "52px", padding: "0 16px" }} />

        <label htmlFor="qs-step" style={{ ...fieldLabel, marginTop: "16px" }}>YOUR FIRST TINY STEP <span style={{ fontWeight: 600, letterSpacing: 0 }}>(optional)</span></label>
        <textarea id="qs-step" value={step} onChange={(e) => setStep(e.target.value)} maxLength={120} rows={2} placeholder="e.g. Put on my shoes." className="text-field" style={{ ...field, resize: "none", lineHeight: 1.5, display: "block" }} />
        <p style={{ margin: "8px 2px 0", fontSize: "13px", lineHeight: 1.5, color: colors.inkSoft }}>Leave it empty and Start Now suggests one.</p>

        <div style={{ ...fieldLabel, marginTop: "16px" }} id="qs-colour">COLOUR</div>
        <div role="radiogroup" aria-labelledby="qs-colour" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {colourChoices.map((choice) => {
            const on = mood === choice.mood;
            return (
              <button
                key={choice.mood}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={choice.name}
                onClick={() => setMood(choice.mood)}
                style={{ width: "44px", height: "44px", borderRadius: "50%", border: "none", padding: 0, cursor: "pointer", background: moods[choice.mood].background, boxShadow: on ? `0 0 0 3px ${colors.paper}, 0 0 0 5.5px ${colors.ink}` : "none", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {on && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
              </button>
            );
          })}
        </div>

        <button type="submit" disabled={!ready} className="solid-press" style={{ marginTop: "24px", width: "100%", height: "52px", borderRadius: "16px", border: "none", background: ready ? colors.pineDeep : colors.disabledBg, color: ready ? colors.onAccent : colors.disabledText, fontSize: "16px", fontWeight: 700, fontFamily: fonts.body, cursor: ready ? "pointer" : "not-allowed" }}>
          {editing ? "Save changes" : "Add quick start"}
        </button>
        <button type="button" onClick={onClose} style={{ marginTop: "6px", width: "100%", height: "46px", border: "none", background: "none", color: colors.inkSoft, fontSize: "15px", fontWeight: 600, fontFamily: fonts.body, cursor: "pointer" }}>Cancel</button>

        {editing && (
          confirmDelete ? (
            <div style={{ marginTop: "6px", padding: "14px", borderRadius: "16px", background: tint(colors.danger, 0.08), textAlign: "center" }}>
              <p style={{ margin: "0 0 10px", fontSize: "14px", color: colors.ink }}>Delete &ldquo;{editing.label}&rdquo;?</p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button type="button" onClick={remove} className="solid-press" style={{ height: "40px", padding: "0 18px", borderRadius: "20px", border: "none", background: colors.danger, color: "#FFFFFF", fontSize: "14px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>Delete</button>
                <button type="button" onClick={() => setConfirmDelete(false)} style={{ height: "40px", padding: "0 14px", border: "none", background: "none", color: colors.inkSoft, fontSize: "14px", fontWeight: 600, fontFamily: fonts.body, cursor: "pointer" }}>Keep it</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} style={{ width: "100%", height: "46px", border: "none", background: "none", color: colors.danger, fontSize: "15px", fontWeight: 700, fontFamily: fonts.body, cursor: "pointer" }}>Delete this quick start</button>
          )
        )}

        <p style={{ margin: "10px 2px 0", fontSize: "12px", lineHeight: 1.5, color: colors.inkSoft, textAlign: "center" }}>Saved on this phone only.</p>
      </form>
    </div>,
    document.body,
  );
}
