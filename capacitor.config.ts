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
    contentInset: "automatic",
    backgroundColor: "#EAE3D2",
  },
};

export default config;
