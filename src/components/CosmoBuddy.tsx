type BuddyMood = "welcome" | "thinking" | "error" | "celebrate";

type Props = {
  mood: BuddyMood;
  onTryPrompt: (prompt: string) => void;
};

const MOOD_COPY: Record<BuddyMood, { face: string; line: string }> = {
  welcome: {
    face: "(*^_^*)",
    line: "Hi explorer! I am Baby Cosmo. Want to ask me something sparkly?",
  },
  thinking: {
    face: "(o_o)",
    line: "Warp engines online — hold tight!",
  },
  error: {
    face: "(;_;)",
    line: "Oopsie space bump! Try again and I will keep helping.",
  },
  celebrate: {
    face: "(^o^)/",
    line: "Yay! You asked an awesome space question!",
  },
};

const PROMPTS = [
  "Where is the ISS right now?",
  "Show me today's coolest NASA picture!",
  "Tell me a funny black hole fact.",
];

export function CosmoBuddy({ mood, onTryPrompt }: Props) {
  const copy = MOOD_COPY[mood];

  return (
    <section
      className="relative mb-4 overflow-hidden rounded-2xl border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-950/40 via-violet-900/30 to-cyan-950/30 p-4"
      aria-label="Baby Cosmo helper"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-cyan-300/20 blur-2xl" />

      <div className="flex items-start gap-3">
        <div className="relative mt-0.5 h-14 w-14 shrink-0 rounded-full border border-white/30 bg-violet-950/70 p-1 shadow-glow">
          <div className="flex h-full w-full items-center justify-center rounded-full border border-cyan-200/40 bg-slate-900/80 text-xs text-cyan-100">
            {copy.face}
          </div>
          <span className="absolute -right-1 -top-1 text-sm" aria-hidden="true">
            ✨
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-cosmic-star">Baby Cosmo</p>
          <p className="mt-1 text-sm text-slate-200">{copy.line}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onTryPrompt(p)}
            className="rounded-full border border-cyan-200/30 bg-cyan-400/15 px-3 py-1.5 text-xs text-cyan-50 transition hover:bg-cyan-300/25"
          >
            {p}
          </button>
        ))}
      </div>
    </section>
  );
}
