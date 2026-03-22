import { IssMap } from "./IssMap";
import type { CosmoVisuals } from "@/lib/types";

type Props = {
  visuals: CosmoVisuals;
  audioMode: boolean;
};

export function VisualPanel({ visuals, audioMode }: Props) {
  const { apod, iss, mars } = visuals;
  const hasAny = Boolean(apod || iss || mars);

  if (!hasAny) {
    return (
      <aside
        className="rounded-2xl border border-white/10 bg-cosmic-deep/80 p-4 text-sm text-slate-400"
        aria-label="Space visuals"
      >
        <p className="font-display text-base font-semibold text-cosmic-glow">Sky window</p>
        <p className="mt-2">
          Ask Cosmo about the space station, who is in space, today&apos;s NASA picture, or Mars rovers to
          unlock live visuals here.
        </p>
      </aside>
    );
  }

  return (
    <aside
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-cosmic-deep/90 p-4 shadow-glow"
      aria-label="Space visuals and maps"
    >
      <h2 className="font-display text-lg font-semibold text-cosmic-star">Sky window</h2>

      {iss && (
        <section aria-label="International Space Station position">
          <h3 className="mb-2 text-sm font-medium text-cosmic-glow">ISS now</h3>
          <p className="mb-2 text-xs text-slate-400">
            {iss.approxLocation
              ? `Roughly above: ${iss.approxLocation}. Coordinates ${iss.latitude.toFixed(2)}, ${iss.longitude.toFixed(2)}.`
              : `Coordinates ${iss.latitude.toFixed(2)}, ${iss.longitude.toFixed(2)}.`}
          </p>
          {!audioMode && (
            <IssMap
              latitude={iss.latitude}
              longitude={iss.longitude}
              label={`ISS marker at ${iss.latitude.toFixed(1)} north or south, ${iss.longitude.toFixed(1)} east or west`}
            />
          )}
          {audioMode && (
            <p className="rounded-lg bg-cosmic-nebula/50 p-3 text-sm text-slate-200">
              Map hidden in audio-first mode. Cosmo described the view in the message above.
            </p>
          )}
        </section>
      )}

      {apod && apod.media_type === "image" && (
        <section aria-label="NASA Astronomy Picture of the Day">
          <h3 className="mb-2 text-sm font-medium text-cosmic-glow">NASA picture of the day</h3>
          <p className="mb-2 text-xs text-slate-400">{apod.title}</p>
          {!audioMode && (
            <img
              src={apod.url}
              alt={apod.title}
              className="max-h-64 w-full rounded-lg object-cover object-center"
            />
          )}
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{apod.explanation}</p>
        </section>
      )}

      {mars?.url && (
        <section aria-label="Latest Mars rover photo">
          <h3 className="mb-2 text-sm font-medium text-cosmic-glow">Mars rover snapshot</h3>
          <p className="mb-2 text-xs text-slate-400">
            {mars.rover} · Earth date {mars.earthDate}
          </p>
          {!audioMode && (
            <div className="mars-polaroid">
              <div className="mars-polaroid-inner">
                <img
                  src={mars.url}
                  alt={`Latest photo from the ${mars.rover} rover on Mars`}
                  className="mars-polaroid-img"
                />
              </div>
              <p className="mars-polaroid-caption">
                {mars.rover} · {mars.earthDate}
              </p>
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
