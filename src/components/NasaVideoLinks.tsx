const VIDEOS = [
  {
    id: "libAa6yH1QQ",
    title: "Solar System 101",
    channel: "National Geographic",
    tag: "Planets",
  },
  {
    id: "QAa2O_8wBUQ",
    title: "Black Holes Explained",
    channel: "Kurzgesagt",
    tag: "Black Holes",
  },
  {
    id: "e-8PuXDo4u0",
    title: "NASA's Artemis I Launch",
    channel: "NASA",
    tag: "Launch",
  },
  {
    id: "4993sBLAzRA",
    title: "Life on the ISS",
    channel: "NASA",
    tag: "ISS",
  },
  {
    id: "w-9tb-V2iEg",
    title: "Mars in 4K — Curiosity Rover",
    channel: "NASA JPL",
    tag: "Mars",
  },
  {
    id: "zSgiXGELjbc",
    title: "What Is the Universe Made Of?",
    channel: "Kurzgesagt",
    tag: "Universe",
  },
];

export function NasaVideoLinks() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-gradient-to-br from-violet-950/70 via-slate-950/80 to-indigo-950/70 p-5 shadow-glow"
      aria-label="NASA and space videos on YouTube"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-3xl" />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200/80">Space on YouTube</p>
          <h2 className="neon-text font-display text-xl font-semibold md:text-2xl">Watch &amp; explore</h2>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">Opens on YouTube</span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {VIDEOS.map((v) => (
          <li key={v.id}>
            <a
              href={`https://www.youtube.com/watch?v=${v.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-3 transition hover:border-fuchsia-400/40 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/60"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
                <img
                  src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`}
                  alt=""
                  className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 shadow-lg">
                    <svg viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5 translate-x-0.5" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <span className="mb-1 inline-block rounded-full border border-fuchsia-400/30 bg-fuchsia-400/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-fuchsia-200">
                  {v.tag}
                </span>
                <p className="text-sm font-medium leading-snug text-slate-100 group-hover:text-white">{v.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{v.channel}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
