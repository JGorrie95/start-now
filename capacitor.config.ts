import type { CapacitorConfig } from "@capacitor/cli";

// The iPhone app is a native shell that opens the live Start Now site.
// Changes to the website show up in the app without a new App Store release.
// "capacitor-web" is only a fallback page shown if the phone has no internet.
const config: CapacitorConfig = {
  appId: "app.startnowadhd.StartNow",
  appName: "Start Now",
  webDir: "capacitor-web",
  server: {
    url: "https://startnowadhd.app",
    cleartext: false,
    allowNavigation: ["startnowadhd.app", "*.supabase.co"],
  },
  ios: {
    // The website handles the notch and home bar itself (app mode in globals.css),
    // so the page can fill the whole screen and match light or dark mode edge to edge.
    contentInset: "never",
    backgroundColor: "#EAE3D2",
  },
};

export default config;
