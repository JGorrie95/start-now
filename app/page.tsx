import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 30%), radial-gradient(circle at top right, rgba(236,72,153,0.16), transparent 28%), linear-gradient(180deg, #f8f8f5 0%, #f3f4f6 100%)",
        color: "#111111",
        fontFamily: "Arial, sans-serif",
        padding: "32px 20px 80px",
      }}
    >
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "60px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            Start Now
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#555",
              background: "rgba(255,255,255,0.65)",
              padding: "10px 16px",
              borderRadius: "999px",
              border: "1px solid rgba(0,0,0,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            For overwhelmed brains
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "30px",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "15px",
                color: "#666",
                marginBottom: "12px",
              }}
            >
              From stuck to started
            </p>

            <h1
              style={{
                fontSize: "clamp(48px, 9vw, 92px)",
                lineHeight: 0.95,
                letterSpacing: "-0.06em",
                margin: "0 0 20px 0",
              }}
            >
              One small step
              <br />
              can change
              <br />
              your whole day.
            </h1>

            <p
              style={{
                fontSize: "20px",
                lineHeight: 1.6,
                color: "#555",
                maxWidth: "560px",
                marginBottom: "30px",
              }}
            >
              Start Now helps you clear the mental clutter, calm the overwhelm,
              and choose one doable next step.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <Link href="/stuck">
                <button
                  style={{
                    padding: "16px 26px",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(135deg, #111111 0%, #3b82f6 100%)",
                    color: "white",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 12px 30px rgba(59,130,246,0.22)",
                  }}
                >
                  Help Me Begin
                </button>
              </Link>

              <button
                style={{
                  padding: "16px 26px",
                  borderRadius: "999px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  background: "rgba(255,255,255,0.7)",
                  color: "#111",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                }}
              >
                See How It Works
              </button>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.6)",
              borderRadius: "32px",
              padding: "22px",
              backdropFilter: "blur(14px)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.8)",
                borderRadius: "26px",
                padding: "22px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  color: "#777",
                  marginBottom: "8px",
                }}
              >
                Right now
              </p>

              <h2
                style={{
                  fontSize: "30px",
                  margin: "0 0 18px 0",
                  letterSpacing: "-0.04em",
                }}
              >
                What’s on your mind?
              </h2>

              <textarea
                placeholder="Laundry, call dentist, text mom back, groceries, finish that one email..."
                style={{
                  width: "100%",
                  minHeight: "150px",
                  padding: "18px",
                  borderRadius: "22px",
                  border: "1px solid rgba(0,0,0,0.08)",
                  fontSize: "17px",
                  lineHeight: 1.5,
                  resize: "none",
                  outline: "none",
                  background: "#ffffff",
                  color: "#111",
                  marginBottom: "16px",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gap: "10px",
                  marginBottom: "18px",
                }}
              >
                {[
                  "I have too many things to do",
                  "I need to start one task",
                  "I got distracted",
                  "I feel overwhelmed",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "18px",
                      background: "#ffffff",
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: "15px",
                      color: "#222",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <button
  onClick={() => window.location.href = "/stuck"}
  style={{
    width: "100%",
    padding: "16px 20px",
    borderRadius: "999px",
    border: "none",
    background:
      "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
    color: "white",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(236,72,153,0.22)",
  }}
>
  Get My Next Step
</button>
  