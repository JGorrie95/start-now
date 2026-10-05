import type { CSSProperties } from "react";

// Every colour points at a CSS variable defined in globals.css.
// The variables have a light and a dark value, and the browser picks one
// automatically from the device's light/dark setting. Nothing to toggle.
export const colors = {
  mist: "var(--c-mist)",        // page background
  paper: "var(--c-paper)",      // cards
  field: "var(--c-field)",      // text boxes and inset panels
  fieldBorder: "var(--c-field-border)", // outline around text boxes
  ink: "var(--c-ink)",          // main text
  inkSoft: "var(--c-ink-soft)",
  inkFaint: "var(--c-ink-faint)",
  pine: "var(--c-pine)",
  pineDeep: "var(--c-pine-deep)", // main green: buttons and accent text
  onAccent: "var(--c-on-accent)", // text sitting on a green button
  slate: "var(--c-slate)",
  heather: "var(--c-heather)",
  disabledBg: "var(--c-disabled-bg)",
  disabledText: "var(--c-disabled-text)",
  danger: "var(--c-danger)",
  success: "var(--c-success)",
  shadow: "var(--c-shadow)",
} as const;

// Makes a see-through version of a colour. Works with the CSS variables above,
// so tints switch between light and dark mode too.
export function tint(color: string, alpha: number) {
  const percent = Math.round(alpha * 1000) / 10;
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export const radius = { sm: "12px", md: "20px", lg: "28px", full: "999px" } as const;

export const fonts = {
  display: "var(--font-display), Georgia, serif",
  body: "var(--font-body), system-ui, sans-serif",
} as const;

export const shadow = {
  card: `0 1px 2px ${tint(colors.shadow, 0.05)}, 0 20px 44px ${tint(colors.shadow, 0.10)}`,
} as const;

export const cardSurface: CSSProperties = {
  background: colors.paper,
  borderRadius: radius.md,
  border: `1px solid ${tint(colors.ink, 0.06)}`,
  boxShadow: shadow.card,
};

export const pageBg: CSSProperties = {
  minHeight: "100vh",
  background: colors.mist,
  color: colors.ink,
  fontFamily: fonts.body,
  position: "relative",
  overflow: "hidden",
};
