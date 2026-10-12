"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNativeApp, tapHaptic } from "@/app/native";

// The bottom button bar you see in real iPhone apps.
// It only shows inside the iPhone app (CSS in globals.css hides it everywhere else),
// so the normal website looks exactly the same as before.

function StartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19 C 9 19, 14 15, 16.5 8" />
      <circle cx="18" cy="5.5" r="2.6" fill="currentColor" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M18 13.8c1.8.6 3 2.2 3 5.2" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  );
}

const tabs = [
  { href: "/", label: "Start", Icon: StartIcon },
  { href: "/friends", label: "Friends", Icon: FriendsIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

// Screens where you are focused on one thing, so the bar stays out of the way.
const focusScreens = ["/stuck", "/invite"];

export function AppShell() {
  const pathname = usePathname() ?? "/";

  // A tiny buzz whenever you tap a button or link, like a real app.
  useEffect(() => {
    if (!isNativeApp()) return;
    const onTap = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest("button, a")) tapHaptic();
    };
    document.addEventListener("click", onTap, true);
    return () => document.removeEventListener("click", onTap, true);
  }, []);

  if (focusScreens.some((screen) => pathname === screen || pathname.startsWith(`${screen}/`))) return null;

  return (
    <nav className="app-tabbar" aria-label="Main">
      {tabs.map(({ href, label, Icon }) => {
        // Signing in happens when you tap Friends or Profile, so it counts as the Profile tab.
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/profile" && pathname.startsWith("/auth"));
        return (
          <Link key={href} href={href} className="app-tab" aria-current={active ? "page" : undefined}>
            <span className="app-tab-pill">
              <Icon />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
