import { colors, tint } from "@/app/theme";

export function SparkMark({ size = 24, stroke = colors.pineDeep, dot = colors.pine, glow = false }: { size?: number; stroke?: string; dot?: string; glow?: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      {glow && (
        <span
          className="lit-glow"
          style={{ position: "absolute", top: size * 0.02, right: -size * 0.18, width: size * 0.4, height: size * 0.4, borderRadius: "50%", background: tint(colors.pine, 0.4), filter: "blur(5px)" }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "relative" }}>
        <path d="M4 19 C 9 19, 14 15, 16.5 8" stroke={stroke} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <circle cx="18" cy="5.5" r="4.2" fill={dot} />
      </svg>
    </span>
  );
}
