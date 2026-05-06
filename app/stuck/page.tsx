"use client";

import { useState } from "react";

export default function StuckPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  function getNextStep() {
    const lower = text.toLowerCase();

    let step = "Pick the easiest thing on your list and do it for 5 minutes.";
    let reason = "Starting small lowers pressure and creates momentum.";

    if (lower.includes("laundry") || lower.includes("clothes")) {
      step = "Put one load of laundry in the washer.";
      reason = "It takes about 2 minutes and creates an easy visible win.";
    } else if (lower.includes("email") || lower.includes("boss")) {
      step = "Open the email and write one messy first sentence.";
      reason = "You do not need to finish it yet — starting removes the hardest part.";
    } else if (lower.includes("clean") || lower.includes("mess")) {
      step = "Clear one small surface for 3 minutes.";
      reason = "A tiny clean area can make your brain feel less chaotic.";
    } else if (lower.includes("call") || lower.includes("appointment")) {
      step = "Write down the phone number and what you need to say.";
      reason = "Preparing the first line makes the call feel less overwhelming.";
    } else if (lower.includes("groceries") || lower.includes("food")) {
      step = "Write down 3 things you actually need today.";
      reason = "A tiny list is easier to act on than a full grocery plan.";
    }

    setResult(`Your next step:\n${step}\n\nWhy this helps:\n${reason}`);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.12), transparent 30%), linear-gradient(180deg, #f8f8f5 0%, #f3f4f6 100%)",
        padding: "60px 24px",
        fontFamily: "Arial, sans-serif",
        color: "#111",
      }}
    >
      <section style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "#666", marginBottom: "12px", fontSize: "15px" }}>
          Start Now
        </p>

        <h1
          style={{
            fontSize: "clamp(42px, 8vw, 72px)",
            lineHeight: 0.95,
            letterSpacing: "-0.05em",
            margin: "0 0 18px 0",
          }}
        >
          Let’s get unstuck.
        </h1>

        <p
          style={{
            fontSize: "20px",
            color: "#555",
            maxWidth: "650px",
            margin: "0 auto 34px",
            lineHeight: 1.6,
          }}
        >
          Write down what feels overwhelming right now. We’ll turn it into one
          small next step.
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.78)",
            borderRadius: "28px",
            padding: "24px",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.06)",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Example: laundry, emails, groceries, cleaning, phone calls..."
            style={{
              width: "100%",
              minHeight: "180px",
              padding: "18px",
              borderRadius: "22px",
              border: "1px solid rgba(0,0,0,0.08)",
              fontSize: "17px",
              lineHeight: 1.5,
              resize: "none",
              outline: "none",
              background: "#fff",
              color: "#111",
            }}
          />

          <button
            onClick={getNextStep}
            style={{
              marginTop: "18px",
              width: "100%",
              padding: "16px 20px",
              borderRadius: "999px",
              border: "none",
              background: "linear-gradient(135deg, #111111 0%, #3b82f6 100%)",
              color: "white",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Give Me My Next Step
          </button>

          {result && (
            <div
              style={{
                marginTop: "20px",
                textAlign: "left",
                background: "#fff",
                borderRadius: "22px",
                padding: "20px",
                border: "1px solid rgba(0,0,0,0.08)",
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                fontSize: "16px",
              }}
            >
              {result}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}