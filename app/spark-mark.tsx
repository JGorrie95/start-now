import { tint } from "@/app/theme";

// The Start Now logo: the same blue "S" as the app icon, so the app looks the same everywhere.
export function SparkMark({ size = 24, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      {glow && (
        <span
          className="lit-glow"
          aria-hidden="true"
          style={{ position: "absolute", inset: -size * 0.12, borderRadius: size * 0.3, background: tint("#4F6DB8", 0.35), filter: "blur(10px)" }}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={size} height={size} style={{ position: "relative", width: size, height: size, borderRadius: size * 0.225, display: "block" }} />
    </span>
  );
}
