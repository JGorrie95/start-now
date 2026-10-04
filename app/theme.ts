import type { CSSProperties } from "react";

export const colors = {
  mist: "#EAE3D2",
  paper: "#FBFAF5",
  ink: "#262421",
  inkSoft: "#5B5750",
  inkFaint: "#96938C",
  pine: "#3D8B76",
  pineDeep: "#2F6F5E",
  slate: "#6E7C93",
  heather: "#8B7B96",
} as const;

export function tint(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const radius = { sm: "12px", md: "20px", lg: "28px", full: "999px" } as const;

export const fonts = {
  display: "var(--font-display), Georgia, serif",
  body: "var(--font-body), system-ui, sans-serif",
} as const;

export const shadow = {
  card: `0 1px 2px ${tint(colors.ink, 0.05)}, 0 20px 44px ${tint(colors.ink, 0.10)}`,
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
