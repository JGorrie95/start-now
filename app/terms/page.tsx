import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { colors, fonts, cardSurface, pageBg } from "@/app/theme";
import Link from "next/link";
import { BackButton } from "@/app/back-button";

export const metadata: Metadata = {
  title: "Terms of Use · Start Now",
  description: "The simple rules for using Start Now.",
};

// Change these two lines when they change, and the page updates everywhere.
const UPDATED = "October 21, 2026";
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

export default function TermsPage() {
  return (
    <main style={{ ...pageBg, padding: "20px 20px 80px" }}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "640px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <BackButton previous label="Back" style={{ marginBottom: "22px" }} />
        <h1 style={{ margin: 0, fontSize: "34px", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.02em", fontFamily: fonts.body }}>Terms of Use</h1>
        <p style={{ ...p, margin: "8px 0 22px" }}>Last updated {UPDATED}. By using the Start Now app or startnowadhd.app, you agree to these terms. They&apos;re short, we promise.</p>

        <Section title="Not medical advice">
          <p style={p}>Start Now is a tool to help you get started on everyday tasks. It is not medical or mental health care. It doesn&apos;t diagnose, treat or cure ADHD or any other condition, and it isn&apos;t a replacement for a doctor, therapist or medication.</p>
          <p style={{ ...p, margin: 0 }}>If you&apos;re struggling, please talk to a health professional. If you&apos;re in crisis, call or text 988 (Canada and the US) or your local emergency number.</p>
        </Section>

        <Section title="Using Start Now">
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li style={li}>Start Now is for your own personal use.</li>
            <li style={li}>You need to be at least 13 to make a friends account.</li>
            <li style={li}>Please don&apos;t try to break, overload or misuse the app or other people&apos;s accounts.</li>
          </ul>
        </Section>

        <Section title="Be kind with friends">
          <p style={p}>If you make a friends account, your nickname and any photo you share are seen by your friends. Please keep them kind and appropriate, and only use photos you have the right to use.</p>
          <p style={{ ...p, margin: 0 }}>We may remove a nickname or photo, or close an account, if it&apos;s hurtful, harmful or breaks these terms.</p>
        </Section>

        <Section title="What's yours and what's ours">
          <p style={p}>Your photo and nickname stay yours. You only let us store them and show them to your friends so the app works.</p>
          <p style={{ ...p, margin: 0 }}>The Start Now name, design, sounds and app are ours. Please don&apos;t copy them.</p>
        </Section>

        <Section title="Alarms, streaks and things going wrong">
          <p style={p}>We work hard to keep Start Now working, but we can&apos;t promise it will always be available or free of mistakes. Please don&apos;t rely on the timer or alarm for anything important, like medicine, travel or safety. Phone settings, low battery or updates can stop it from ringing.</p>
          <p style={{ ...p, margin: 0 }}>Things saved only on your device, like your streak or photo, can be lost if you delete the app or clear your data. As far as the law allows, Start Now isn&apos;t responsible for losses that come from using the app.</p>
        </Section>

        <Section title="Stopping and changes">
          <p style={p}>You can stop using Start Now at any time, and delete your account in Settings.</p>
          <p style={{ ...p, margin: 0 }}>If we change these terms, we&apos;ll update the date at the top. If a change is important, we&apos;ll tell you in the app first.</p>
        </Section>

        <Section title="The law and contact">
          <p style={{ ...p, margin: 0 }}>
            These terms follow the laws of British Columbia, Canada. Questions? Email <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: colors.pineDeep, fontWeight: 700 }}>{CONTACT_EMAIL}</a>. You can also read our <Link href="/privacy" style={{ color: colors.pineDeep, fontWeight: 700 }}>privacy policy</Link>.
          </p>
        </Section>
      </div>
    </main>
  );
}
