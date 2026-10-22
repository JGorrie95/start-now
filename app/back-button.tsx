"use client";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors, fonts, radius, tint } from "@/app/theme";

// A clear, easy-to-tap "Back" button (44px tall, the size Apple recommends for fingers).
// It takes you to the home screen, or to `href` when a page sits inside another one
// (Settings goes back to your Profile).
export function BackButton({
  className,
  style,
  href = "/",
  label = "Back to the home screen",
}: {
  className?: string;
  style?: CSSProperties;
  href?: string;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(href)}
      className={`press back-button${className ? ` ${className}` : ""}`}
      aria-label={label}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        height: "44px", padding: "0 18px 0 12px", borderRadius: radius.full,
        background: colors.paper, color: colors.ink,
        border: `1px solid ${tint(colors.ink, 0.12)}`,
        boxShadow: `0 2px 8px ${tint(colors.shadow, 0.06)}`,
        fontSize: "15px", fontWeight: 600, fontFamily: fonts.body, cursor: "pointer",
        ...style,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Back
    </button>
  );
}
