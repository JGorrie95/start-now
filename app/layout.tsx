import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/app/app-shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT"],
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Start Now",
  description: "From stuck to started.",
  appleWebApp: {
    capable: true,
    title: "Start Now",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2F6F5E" },
    { media: "(prefers-color-scheme: dark)", color: "#171614" },
  ],
  width: "device-width",
  initialScale: 1,
  // Lets the page fill the whole screen on iPhones with a notch. The iPhone app
  // adds its own padding for the notch and the home bar (see "iPhone app mode" in globals.css).
  viewportFit: "cover",
};

// Runs before the page is drawn. Inside the iPhone app the shell adds a `Capacitor`
// object to the page, and then we mark the page as "native" so the app-style layout
// can switch on without a flash. In a normal browser nothing happens.
const detectNativeApp = `(function(){try{var c=window.Capacitor;if(c&&c.isNativePlatform&&c.isNativePlatform()){document.documentElement.setAttribute("data-app","native");}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hankenGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: detectNativeApp }} />
      </head>
      <body>
        {children}
        <AppShell />
      </body>
    </html>
  );
}
