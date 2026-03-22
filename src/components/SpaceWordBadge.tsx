import { useMemo } from "react";
import { getSpaceWordOfDay } from "@/lib/spaceWordOfDay";

export function SpaceWordBadge() {
  const { word, hint } = useMemo(() => getSpaceWordOfDay(), []);
  return (
    <div
      className="pointer-events-none fixed right-4 top-24 z-40 max-w-[11rem] rounded-2xl border border-cyan-400/40 bg-slate-950/80 px-3 py-2 text-xs text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.35)] backdrop-blur-md md:top-28"
      role="status"
    >
      <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cyan-300/90">Space Word of the Day</p>
      <p className="neon-text mt-1 font-display text-base font-bold">{word}</p>
      <p className="mt-1 text-[0.7rem] leading-snug text-slate-300">{hint}</p>
    </div>
  );
}
