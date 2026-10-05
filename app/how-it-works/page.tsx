import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { colors, fonts, radius, tint, cardSurface, pageBg } from "@/app/theme";
import { SparkMark } from "@/app/spark-mark";

export const metadata: Metadata = {
  title: "How it works · Start Now",
  description:
    "Start Now turns “I’m overwhelmed” into one small, doable next step. Here is the thinking behind it, and how each part works.",
};

const eyebrow: CSSProperties = {
  fontSize: "13px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 600,
  margin: "0 0 14px 0",
};

const sectionTitle: CSSProperties = {
  fontFamily: fonts.display,
  fontSize: "clamp(26px, 4vw, 34px)",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  fontWeight: 500,
  margin: "0 0 18px 0",
};

const bodyText: CSSProperties = {
  fontSize: "16px",
  lineHeight: 1.75,
  color: colors.inkSoft,
  margin: "0 0 16px 0",
};

const primaryCta: CSSProperties = {
  display: "inline-block",
  padding: "14px 24px",
  borderRadius: radius.sm,
  background: colors.pineDeep,
  color: colors.onAccent,
  fontSize: "15px",
  fontWeight: 600,
  fontFamily: fonts.body,
  textDecoration: "none",
  boxShadow: `0 10px 24px ${tint(colors.pineDeep, 0.28)}`,
};

const quietLink: CSSProperties = {
  display: "inline-block",
  padding: "14px 24px",
  borderRadius: radius.sm,
  border: `1px solid ${tint(colors.ink, 0.14)}`,
  color: colors.inkSoft,
  fontSize: "15px",
  fontWeight: 500,
  fontFamily: fonts.body,
  textDecoration: "none",
};

const movements = [
  {
    n: "1",
    tone: tint(colors.ink, 0.45),
    kicker: "Say it badly",
    title: "Dump the chaos",
    body: [
      "Start by writing down whatever is on your mind, in whatever shape it arrives. A single word, half a sentence, a tangle of three worries at once. There is no format to follow, and nothing you write is sorted, scored or judged.",
      "The aim here is relief, not organisation. Moving the weight out of your head and onto a screen is often enough to loosen it, and it gives the next step something real to work with.",
    ],
  },
  {
    n: "2",
    tone: colors.slate,
    kicker: "Narrowing is a kindness",
    title: "Pick one direction",
    body: [
      "Start Now reads what you wrote and offers a single small step. Not a plan and not a list: one action, sized so that you could do it in a couple of minutes. “Put one load of laundry in the washer.” “Open the email and write one messy first sentence.”",
      "Every step arrives with a short reason, so you can see why it is so small. If it still does not fit, you can ask for a different one, or tell it the step still feels too big and it will shrink it again, down to something almost absurdly easy. Sometimes the whole step is simply opening the app.",
    ],
  },
  {
    n: "3",
    tone: colors.pineDeep,
    glow: true,
    kicker: "Five minutes, not forever",
    title: "Begin gently",
    body: [
      "When you are ready, the Just Start timer gives you two, five or ten minutes. You are not promising to finish the task. You are only promising to be in it for a short stretch, and the timer carries the time-keeping so your attention does not have to.",
      "When it ends, you choose. Keep going while the momentum is there, or stop and be proud of having started. Both count, and neither is the wrong answer.",
    ],
  },
];

const principles = [
  {
    title: "Smaller than you think",
    body: "A step is sized to beat resistance, not to impress anyone. If you can picture yourself doing it right now, it is the right size.",
  },
  {
    title: "No shame, ever",
    body: "No overdue counters, no red badges, no scolding. Streaks exist to celebrate showing up, not to punish a day you could not.",
  },
  {
    title: "One thing at a time",
    body: "You will never be shown a long list. A crowded screen is the very thing that makes starting harder, so there is only ever one next step.",
  },
  {
    title: "Calm by default",
    body: "Soft colours, slow motion, and nothing that interrupts you while you work. If your device is set to reduce motion, Start Now respects it.",
  },
];

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. You can ask for a next step and use the timer without signing in. An account is only needed if you want to save your streak or add friends.",
  },
  {
    q: "How does it choose my step?",
    a: "Start Now recognises common kinds of tasks, such as laundry, email, phone calls, bills, studying and tidying, and offers steps written for each. For anything else it falls back to a gentle, general way to begin. It is a carefully written set of steps, not a black box.",
  },
  {
    q: "Is it only for people with ADHD?",
    a: "It was designed with ADHD brains in mind, but the freeze it addresses is familiar to many people: the avoidance, the overwhelm, the staring at a task without being able to touch it. If that sounds like you, it is for you.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. Start Now works in your phone’s browser, and you can add it to your home screen so it opens like an app.",
  },
  {
    q: "How does signing in work?",
    a: "There is no password. You enter your email, we send you a link, and tapping it signs you in.",
  },
];

function Section({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ marginTop: "88px", ...style }}>{children}</section>;
}

export default function HowItWorksPage() {
  return (
    <main style={{ ...pageBg, padding: "20px 20px 96px" }}>
      <div className="grain-overlay" />
      <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "64px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: 600, letterSpacing: "-0.01em", color: colors.ink, textDecoration: "none" }}>
            <SparkMark size={32} />
            Start Now
          </Link>
          <Link href="/stuck" style={{ fontSize: "13px", color: colors.inkSoft, background: colors.paper, padding: "8px 14px", borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.08)}`, textDecoration: "none" }}>
            Help me begin →
          </Link>
        </header>

        <div style={{ maxWidth: "720px" }}>
          <p style={eyebrow}>The method</p>
          <h1 style={{ fontFamily: fonts.display, fontSize: "clamp(36px, 6vw, 56px)", lineHeight: 1.08, letterSpacing: "-0.025em", fontWeight: 500, margin: "0 0 24px 0" }}>
            Starting is the hard part. So we make it small.
          </h1>
          <p style={{ ...bodyText, fontSize: "18px", maxWidth: "640px" }}>
            Start Now rests on a simple observation: for many people, and especially for those with ADHD, the difficulty is rarely the task itself. It is the threshold, the invisible gap between knowing what needs doing and actually beginning.
          </p>
          <p style={{ ...bodyText, maxWidth: "640px" }}>
            Everything in this app is designed to shrink that gap until it nearly disappears. Here is how, one step at a time.
          </p>
        </div>

        <Section>
          <div style={{ ...cardSurface, padding: "clamp(24px, 4vw, 40px)", maxWidth: "820px" }}>
            <p style={eyebrow}>Why another tool?</p>
            <h2 style={sectionTitle}>Most productivity tools ask you to be organised before you have begun.</h2>
            <p style={bodyText}>
              Prioritise your tasks. Sort them into projects. Assign dates, tags and levels of importance. For a calm, focused mind that is a reasonable workflow. For a mind that is already overloaded, it is the very thing that cannot be done, and the tool becomes one more thing to avoid.
            </p>
            <p style={{ ...bodyText, margin: 0 }}>
              Start Now turns the order around. It asks you to begin first, and to organise later, or never. The only system you need is the next small action.
            </p>
          </div>
        </Section>

        <Section>
          <p style={eyebrow}>Three movements</p>
          <h2 style={{ ...sectionTitle, maxWidth: "640px" }}>From a head full of noise to one thing in your hands.</h2>
          <div style={{ display: "grid", gap: "20px", marginTop: "32px" }}>
            {movements.map((m) => (
              <article key={m.title} style={{ ...cardSurface, padding: "clamp(22px, 4vw, 36px)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "clamp(20px, 4vw, 48px)", alignItems: "start" }}>
                <div>
                  <div style={{ position: "relative", display: "inline-block", marginBottom: "10px" }}>
                    {m.glow && (
                      <span className="lit-glow" style={{ position: "absolute", inset: "-12px", borderRadius: "50%", background: tint(colors.pine, 0.28), filter: "blur(12px)" }} />
                    )}
                    <span style={{ position: "relative", fontFamily: fonts.display, fontStyle: "italic", fontWeight: 500, fontSize: "64px", color: m.tone, lineHeight: 1 }}>
                      {m.n}
                    </span>
                  </div>
                  <p style={{ ...eyebrow, margin: "0 0 6px 0", color: m.glow ? colors.pineDeep : colors.inkFaint }}>{m.kicker}</p>
                  <h3 style={{ fontFamily: fonts.display, fontSize: "26px", letterSpacing: "-0.015em", fontWeight: 500, margin: 0 }}>{m.title}</h3>
                </div>
                <div>
                  {m.body.map((p, i) => (
                    <p key={i} style={{ ...bodyText, margin: i === m.body.length - 1 ? 0 : "0 0 16px 0" }}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section>
          <p style={eyebrow}>In practice</p>
          <h2 style={{ ...sectionTitle, maxWidth: "640px" }}>What it feels like.</h2>
          <p style={{ ...bodyText, maxWidth: "640px" }}>
            Say the thing on your mind is a pile of washing you have been avoiding for days.
          </p>
          <div style={{ ...cardSurface, padding: "clamp(20px, 4vw, 32px)", maxWidth: "720px", marginTop: "24px", display: "grid", gap: "18px" }}>
            <div>
              <p style={{ ...eyebrow, margin: "0 0 8px 0" }}>You write</p>
              <p style={{ margin: 0, padding: "14px 16px", background: colors.field, borderRadius: radius.sm, border: `1px solid ${tint(colors.ink, 0.1)}`, fontSize: "16px", color: colors.ink }}>
                laundry
              </p>
            </div>
            <div style={{ background: tint(colors.pine, 0.08), borderRadius: radius.md, padding: "20px 22px", border: `1px solid ${tint(colors.pine, 0.22)}` }}>
              <p style={{ ...eyebrow, color: colors.pineDeep, margin: "0 0 8px 0" }}>Your next step</p>
              <p style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 600, lineHeight: 1.4, margin: "0 0 10px 0" }}>
                Put one load of laundry in the washer.
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: colors.inkSoft, margin: 0 }}>
                It takes about 2 minutes and creates an easy, visible win.
              </p>
            </div>
            <div>
              <p style={{ ...eyebrow, margin: "0 0 8px 0" }}>Still feels too big? It shrinks.</p>
              <p style={{ fontFamily: fonts.display, fontSize: "18px", lineHeight: 1.4, color: colors.ink, margin: 0 }}>
                Just pick up one piece of clothing off the floor.
              </p>
            </div>
            <div style={{ borderTop: `1px solid ${tint(colors.ink, 0.08)}`, paddingTop: "18px" }}>
              <p style={{ fontFamily: fonts.display, fontSize: "20px", fontWeight: 600, color: colors.pineDeep, margin: "0 0 6px 0" }}>
                You started. That&apos;s the win.
              </p>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: colors.inkSoft, margin: 0 }}>
                However small it felt, you did the thing you said you would do.
              </p>
            </div>
          </div>
        </Section>

        <Section>
          <p style={eyebrow}>Principles</p>
          <h2 style={{ ...sectionTitle, maxWidth: "640px" }}>Four ideas the whole app is built on.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginTop: "28px" }}>
            {principles.map((p) => (
              <div key={p.title} style={{ ...cardSurface, padding: "24px 22px" }}>
                <h3 style={{ fontFamily: fonts.display, fontSize: "20px", letterSpacing: "-0.01em", fontWeight: 500, margin: "0 0 10px 0" }}>{p.title}</h3>
                <p style={{ margin: 0, color: colors.inkSoft, lineHeight: 1.65, fontSize: "14.5px" }}>{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section>
          <div style={{ maxWidth: "720px" }}>
            <p style={eyebrow}>Momentum, with company</p>
            <h2 style={sectionTitle}>Small wins add up. Better with someone beside you.</h2>
            <p style={bodyText}>
              Once a step is done, you can mark it, and each day you show up adds to your streak. If you would like company, you can add friends, share an invite link, and see each other&apos;s streaks on a friendly leaderboard. It is there for encouragement. It is never there to make you feel behind.
            </p>
            <p style={bodyText}>
              All of it is optional. You can use Start Now as often as you like without ever signing in.
            </p>
          </div>
        </Section>

        <Section>
          <div style={{ maxWidth: "720px" }}>
            <p style={eyebrow}>An honest note</p>
            <h2 style={sectionTitle}>What Start Now is not.</h2>
            <p style={bodyText}>
              It is not a to-do list, a calendar or a project planner, and it is not a replacement for medical care or professional support. It is a small tool for one specific moment: the moment you are stuck and cannot find the first move.
            </p>
            <p style={{ ...bodyText, margin: 0 }}>
              If you are struggling with more than that, please reach out to a doctor, therapist or someone you trust. You deserve real support, too.
            </p>
          </div>
        </Section>

        <Section>
          <p style={eyebrow}>Questions</p>
          <h2 style={{ ...sectionTitle, marginBottom: "24px" }}>A few things people ask.</h2>
          <div style={{ display: "grid", gap: "10px", maxWidth: "720px" }}>
            {faqs.map((f) => (
              <details key={f.q} style={{ ...cardSurface, borderRadius: radius.sm, padding: "0" }}>
                <summary style={{ cursor: "pointer", listStyle: "none", padding: "18px 20px", fontSize: "16px", fontWeight: 600, fontFamily: fonts.body, color: colors.ink }}>
                  {f.q}
                </summary>
                <p style={{ margin: 0, padding: "0 20px 20px 20px", color: colors.inkSoft, lineHeight: 1.7, fontSize: "15px" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <Section style={{ textAlign: "center" }}>
          <div style={{ ...cardSurface, padding: "clamp(32px, 6vw, 56px) 24px", maxWidth: "820px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
              <SparkMark size={44} glow />
            </div>
            <h2 style={{ ...sectionTitle, margin: "0 0 12px 0" }}>Ready? Pick the smallest thing.</h2>
            <p style={{ ...bodyText, maxWidth: "460px", margin: "0 auto 28px" }}>
              It does not have to be the right thing, or the important thing. It only has to be a thing.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/stuck" style={primaryCta}>Help me begin →</Link>
              <Link href="/" style={quietLink}>Back to home</Link>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
