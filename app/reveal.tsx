"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

// Fades its children in once they scroll into view. Plays one time only.
export function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}`}
      style={{ ...style, ["--delay" as string]: `${delay}s` }}
    >
      {children}
    </div>
  );
}
