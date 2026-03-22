import { useState } from "react";

const CARDS = [
  {
    id: "sky-dark",
    icon: "🌌",
    tag: "Space",
    title: "Why is space black if the Sun is so bright?",
    teaser: "No air to scatter sunlight the way Earth’s sky does.",
    detail:
      "On Earth, our thick atmosphere scatters sunlight in every direction, so the sky looks blue or bright. In space there is almost no air, so light travels in straight lines — you only see something when it hits your eyes or a camera. Between stars, there is just empty space, so it looks black (even though the universe has lots of light overall!).",
  },
  {
    id: "iss-speed",
    icon: "🛰️",
    tag: "ISS",
    title: "How fast does the space station move?",
    teaser: "Fast enough to orbit Earth in about 90 minutes.",
    detail:
      "The International Space Station travels at roughly 17,500 miles per hour (about 28,000 km/h). That is about 5 miles per second! At that speed, it completes one lap around Earth roughly every 90 minutes, so astronauts see a sunrise and sunset about every 45 minutes.",
  },
  {
    id: "venus-day",
    icon: "🪐",
    tag: "Planets",
    title: "Which planet has a longer day than its year?",
    teaser: "A weird spin on a hot world.",
    detail:
      "Venus rotates very slowly — one ‘day’ on Venus (one spin) takes longer than one Venus year (one orbit around the Sun). Plus Venus spins backwards compared to most planets! It is also incredibly hot and wrapped in thick clouds.",
  },
  {
    id: "sound-space",
    icon: "🔇",
    tag: "Physics",
    title: "Can you hear sounds in space?",
    teaser: "Movies love noisy lasers — real space is quieter.",
    detail:
      "Sound is vibrations traveling through matter like air or water. In the vacuum of space there is almost no air to carry those vibrations to your ears, so space itself is silent. Inside a spacecraft or spacesuit, there is air — so astronauts can talk to each other normally there!",
  },
  {
    id: "mars-sunset",
    icon: "🌅",
    tag: "Mars",
    title: "What color are sunsets on Mars?",
    teaser: "Not orange like Earth — often bluish!",
    detail:
      "Mars has a thin, dusty atmosphere. Fine dust scatters light differently than Earth’s air, so Martian sunsets can look more blue or gray around the Sun, while daytime skies may look butterscotch or tan. Rovers have photographed this for real!",
  },
  {
    id: "jupiter-storm",
    icon: "🌀",
    tag: "Giants",
    title: "How big is Jupiter’s Great Red Spot?",
    teaser: "A storm wider than Earth.",
    detail:
      "The Great Red Spot is a giant storm on Jupiter. It has been observed for centuries and is so large that multiple Earths could fit across it. Storms on giant planets can last a very long time because there is no solid ground below to break them up the way mountains do on Earth.",
  },
];

export function DidYouKnow() {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-violet-200/20 bg-gradient-to-br from-indigo-950/80 via-fuchsia-950/50 to-slate-950/80 p-5 shadow-glow"
      aria-label="Did you know facts"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Learn &amp; wonder</p>
          <h2 className="neon-text font-display text-xl font-semibold md:text-2xl">Did you know?</h2>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-cyan-100">Tap a card to flip</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => {
          const isFlipped = Boolean(flipped[c.id]);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFlipped((s) => ({ ...s, [c.id]: !s[c.id] }))}
              className="flip-card dy-know-flip text-left"
              aria-pressed={isFlipped}
              aria-label={isFlipped ? `${c.title} — showing answer. Click to see question again.` : `${c.title}. Click to reveal the answer.`}
            >
              <div className={`flip-inner ${isFlipped ? "flip-inner--on" : ""}`}>
                <div className="flip-face flip-front space-card relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/45 p-4 backdrop-blur-sm">
                  <div className="space-sparkle" aria-hidden="true" />
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-2xl" aria-hidden="true">
                      {c.icon}
                    </span>
                    <span className="rounded-full border border-cyan-200/30 bg-cyan-400/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-cyan-100">
                      {c.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-cosmic-glow">{c.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{c.teaser}</p>
                  <p className="mt-3 text-xs text-cyan-200/80">Tap to flip →</p>
                </div>
                <div className="flip-face flip-back space-card relative overflow-hidden rounded-2xl border border-fuchsia-400/35 bg-violet-950/80 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200">Here’s the scoop</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-100">{c.detail}</p>
                  <p className="mt-3 text-xs text-slate-500">Tap again to flip back</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
