"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isNativeApp, tapHaptic } from "@/app/native";
import { applyTheme } from "@/app/preferences";

// The bottom button bar you see in real iPhone apps.
// It only shows inside the iPhone app (CSS in globals.css hides it everywhere else),
// so the normal website looks exactly the same as before.

function StartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.2L12 4.5l8 6.7" />
      <path d="M6 9.8V19a1 1 0 0 0 1 1h3.2v-5.2h3.6V20H17a1 1 0 0 0 1-1V9.8" />
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
  const router = useRouter();

  // Tapping the home screen widget while the app is open: the iPhone app calls this to jump
  // straight to a page (like a quick start), instead of reloading the whole site.
  useEffect(() => {
    const w = window as unknown as { startNowOpen?: (path: unknown) => boolean };
    w.startNowOpen = (path: unknown) => {
      if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return false;
      router.push(path);
      return true;
    };
    return () => {
      delete w.startNowOpen;
    };
  }, [router]);

  // Light / dark from Settings: also tells the iPhone app and Safari's top bar.
  useEffect(() => {
    applyTheme();
  }, []);

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
        // Signing in and Settings both live inside Profile, so they count as the Profile tab.
        const active =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href) || (href === "/profile" && (pathname.startsWith("/auth") || pathname.startsWith("/settings")));
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
