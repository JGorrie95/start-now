import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { colors, fonts, cardSurface, pageBg } from "@/app/theme";
import Link from "next/link";
import { BackButton } from "@/app/back-button";

export const metadata: Metadata = {
  title: "Privacy Policy · Start Now",
  description: "What Start Now keeps, what it doesn't, and your choices.",
};

// Change these two lines when they change, and the page updates everywhere.
const UPDATED = "October 23, 2026";
const CONTACT_EMAIL = "privacy@startnowadhd.app";

const h2: CSSProperties = { margin: "0 0 10px", fontSize: "19px", fontWeight: 800, letterSpacing: "-0.01em", fontFamily: fonts.body };
const p: CSSProperties = { margin: "0 0 10px", fontSize: "15px", lineHeight: 1.65, color: colors.inkSoft };
const li: CSSProperties = { margin: "0 0 6px", fontSize: "15px", lineHeight: 1.6, color: colors.inkSoft };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ ...cardSurface, borderRadius: "22px", padding: "22px", marginBottom: "14px" }}>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main style={{ ...pageBg, padding: "20px 20px 80px" }}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "640px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <BackButton previous label="Back" style={{ marginBottom: "22px" }} />
        <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: fonts.body }}>Privacy Policy</h1>
        <p style={{ ...p, margin: "8px 0 22px" }}>Last updated {UPDATED}. This applies to the Start Now app and the website startnowadhd.app.</p>

        <Section title="The short version">
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={li}>You can use Start Now without an account. Then your streak, photo and settings stay on your device, and we collect nothing.</li>
            <li style={li}>If you choose to make a friends account, it&apos;s stored online so your friends can see it. We keep only what&apos;s needed for that.</li>
            <li style={li}>We never sell your data, never share it with advertisers, and don&apos;t use ads or tracking.</li>
            <li style={li}>You can delete your friends account at any time.</li>
          </ul>
        </Section>

        <Section title="Without an account">
          <p style={p}>Your streak, your profile photo, your alarm sound and your light or dark choice are saved only on your device. They are not sent to us. The text you type to get your next step is used to pick your step and isn&apos;t saved.</p>
          <p style={{ ...p, margin: 0 }}>If you delete the app or clear your browser data, these are deleted too, and we can&apos;t get them back.</p>
        </Section>

        <Section title="If you make a friends account">
          <p style={p}>A friends account is optional. To show your streak to your friends, we store:</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: "20px" }}>
            <li style={li}>the nickname you pick</li>
            <li style={li}>your streak: your current and best streak, and the days you marked a step as done</li>
            <li style={li}>who is in your circle, and any friend requests</li>
            <li style={li}>your profile photo, only if you choose to share it</li>
            <li style={li}>a random account number that links these together</li>
            <li style={li}>your email address, only if you sign in with email instead of a nickname</li>
          </ul>
          <p style={{ ...p, margin: 0 }}>Your friends can see your nickname, your streak and your photo (if you shared it). Nobody else can. We don&apos;t ask for your real name, and we don&apos;t collect your location or contacts.</p>
        </Section>

        <Section title="On iPhone">
          <p style={p}>The app may ask to use these. Each one stays on your phone and you can turn it off in your iPhone&apos;s Settings app:</p>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={li}>Alarms and notifications: to let you know when your timer is up, and to send the reminders you choose in Settings. Reminders are set up on your phone, so nothing about them is sent to us.</li>
            <li style={li}>Camera and photos: only when you choose a profile photo. We only get the one photo you pick.</li>
            <li style={li}>Live Activities: to show your timer on the lock screen. That information stays on your phone.</li>
          </ul>
        </Section>

        <Section title="Who helps us run Start Now">
          <p style={p}>We use two companies to run the service. They store data for us and are not allowed to use it for anything else:</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: "20px" }}>
            <li style={li}>Supabase, which stores friends accounts. Its servers are in the United States.</li>
            <li style={li}>Vercel, which runs our website. Like most websites, it keeps short-term technical logs (such as IP addresses and which pages were opened) to keep the service working and safe.</li>
          </ul>
          <p style={{ ...p, margin: 0 }}>We don&apos;t sell or share your data with anyone else. We would only hand it over if the law required us to.</p>
        </Section>

        <Section title="How long we keep it">
          <p style={{ ...p, margin: 0 }}>We keep an account until you delete it. In Settings, tap Leave friends (nickname accounts) or Delete my account (email accounts): your nickname or email, streak, circle, photo and the account itself are deleted. If anything doesn&apos;t delete properly, email us and we&apos;ll delete it within 30 days.</p>
        </Section>

        <Section title="Your rights">
          <p style={{ ...p, margin: 0 }}>You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Email us and we&apos;ll reply within 30 days. If you&apos;re not happy with our answer, you can contact the privacy commissioner where you live (in Canada, the Office of the Privacy Commissioner of Canada).</p>
        </Section>

        <Section title="Children">
          <p style={{ ...p, margin: 0 }}>Start Now isn&apos;t meant for children under 13, and we don&apos;t knowingly let them make friends accounts. If you think a child under 13 has made one, email us and we&apos;ll delete it.</p>
        </Section>

        <Section title="Changes">
          <p style={{ ...p, margin: 0 }}>If we change this policy, we&apos;ll update the date at the top. If a change affects what we collect, we&apos;ll tell you in the app before it happens.</p>
        </Section>

        <Section title="Contact">
          <p style={{ ...p, margin: 0 }}>
            Questions or requests: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.pineDeep, fontWeight: 700 }}>{CONTACT_EMAIL}</a>. Start Now is made in British Columbia, Canada. See also our <Link href="/terms" style={{ color: colors.pineDeep, fontWeight: 700 }}>terms of use</Link>.
          </p>
        </Section>
      </div>
    </main>
  );
}
