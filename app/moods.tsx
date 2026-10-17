// The four "quick start" feelings, each with its own colour and icon.
// The step screen and the timer take on the colour of the feeling you picked.

export type Mood = "lagoon" | "dusk" | "tide" | "ember" | "rose";

// background: the colour card (a CSS gradient that also has a dark-mode version in globals.css).
// deep: the darkest shade, for text on a white button that sits on the card.
export const moods: Record<Mood, { background: string; deep: string }> = {
  lagoon: { background: "var(--g-lagoon)", deep: "#1F5A4B" },
  dusk: { background: "var(--g-dusk)", deep: "#4A3A63" },
  tide: { background: "var(--g-tide)", deep: "#2D4A73" },
  ember: { background: "var(--g-ember)", deep: "#8A3B1E" },
  rose: { background: "var(--g-rose)", deep: "#7A2E4A" },
};

export function ListIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <line x1="3" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="13" x2="9" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="9" r="1.9" fill="currentColor" />
    </svg>
  );
}

export function ScatterIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 13 L7 8 L10 11 L15 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 3" />
    </svg>
  );
}

export function CloudIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M5.5 12.5a3 3 0 0 1-.5-5.96A4 4 0 0 1 12.9 6.1 3.2 3.2 0 0 1 12.5 12.5h-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// text: what gets sent to the step screen. label: what the tile says.
export const quickStarts = [
  { text: "I have too many things to do", label: "Too many things to do", mood: "dusk" as Mood, Icon: ListIcon },
  { text: "I need to start one task", label: "Start one task", mood: "tide" as Mood, Icon: TargetIcon },
  { text: "I got distracted again", label: "Got distracted again", mood: "ember" as Mood, Icon: ScatterIcon },
  { text: "I feel overwhelmed", label: "Feeling overwhelmed", mood: "rose" as Mood, Icon: CloudIcon },
];

// Picks the colour for whatever someone wrote. Anything else gets the calm green.
export function moodFor(text: string): Mood {
  const t = text.toLowerCase();
  if (t.includes("too many")) return "dusk";
  if (t.includes("one task")) return "tide";
  if (t.includes("distract")) return "ember";
  if (t.includes("overwhelm") || t.includes("too much") || t.includes("stressed")) return "rose";
  return "lagoon";
}

// The matching quick start, if the text is exactly one of them (for the little label chip).
export function quickStartFor(text: string) {
  return quickStarts.find((q) => q.text === text.trim());
}
