import { useEffect, useState } from "react";
import { getMoonPhase, moonTip } from "@/lib/astronomy";

type GeoState = "idle" | "loading" | "granted" | "denied";
type SkyState = "idle" | "loading" | "done" | "error";

type IssPos = { latitude: number; longitude: number; approxLocation?: string } | null;

function formatCoord(n: number, posLabel: string, negLabel: string) {
  return `${Math.abs(n).toFixed(1)}° ${n >= 0 ? posLabel : negLabel}`;
}

export function TonightsSkyPanel({ onClose }: { onClose: () => void }) {
  const moon = getMoonPhase();
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [cityName, setCityName] = useState<string | null>(null);
  const [issPos, setIssPos] = useState<IssPos>(null);
  const [skyState, setSkyState] = useState<SkyState>("idle");
  const [planetInfo, setPlanetInfo] = useState<string>("");

  useEffect(() => {
    fetch("https://api.open-notify.org/iss-now.json")
      .then((r) => r.json())
      .then((d: { iss_position?: { latitude: string; longitude: string } }) => {
        if (d.iss_position) {
          setIssPos({
            latitude: parseFloat(d.iss_position.latitude),
            longitude: parseFloat(d.iss_position.longitude),
          });
        }
      })
      .catch(() => {});
  }, []);

  function requestLocation() {
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState("granted");
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        fetchPlanetInfo(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGeoState("denied");
        fetchPlanetInfo(null, null);
      },
      { timeout: 10000 }
    );
  }

  async function reverseGeocode(lat: number, lon: number) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const d = (await r.json()) as { address?: { city?: string; town?: string; state?: string; country?: string } };
      const city = d.address?.city ?? d.address?.town ?? d.address?.state ?? "";
      const country = d.address?.country ?? "";
      setCityName([city, country].filter(Boolean).join(", ") || "your location");
    } catch {
      setCityName("your location");
    }
  }

  async function fetchPlanetInfo(lat: number | null, lon: number | null) {
    setSkyState("loading");
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const where = lat != null ? `latitude ${lat.toFixed(1)}, longitude ${lon!.toFixed(1)}` : "a typical location";
    const q = `What planets and bright stars are visible tonight (${today}) from ${where}? Give a short fun answer for a 7-year-old — which direction to look, best time, and one wow fact. Keep it to 4-5 sentences with emojis.`;
    try {
      const r = await fetch("/api/cosmo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, age: 7 }),
      });
      const d = (await r.json()) as { reply?: string };
      setPlanetInfo(d.reply ?? "I couldn't fetch tonight's sky info — try again!");
      setSkyState("done");
    } catch {
      setPlanetInfo("Oops! I couldn't load tonight's sky — check back soon!");
      setSkyState("error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-3 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Tonight's Sky"
    >
      <div className="w-full max-w-lg rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-slate-950 to-indigo-950 p-5 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="neon-text font-display text-xl font-bold">🌙 Tonight's Sky</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Moon */}
        <div className="mb-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
          <span className="text-5xl" aria-hidden="true">{moon.emoji}</span>
          <div>
            <p className="font-display text-base font-semibold text-cosmic-star">{moon.name}</p>
            <p className="text-xs text-slate-400">{moon.illumination}% illuminated</p>
            <p className="mt-1 text-sm text-slate-200">{moonTip(moon)}</p>
          </div>
        </div>

        {/* ISS */}
        {issPos && (
          <div className="mb-4 rounded-2xl border border-violet-400/20 bg-slate-900/60 px-4 py-3">
            <p className="mb-1 font-display text-sm font-semibold text-cosmic-glow">🛰️ ISS Right Now</p>
            <p className="text-xs text-slate-300">
              {formatCoord(issPos.latitude, "N", "S")}, {formatCoord(issPos.longitude, "E", "W")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              The ISS orbits Earth every ~90 minutes. On a clear night look for a fast-moving bright dot — no blinking!
            </p>
          </div>
        )}

        {/* Planet info */}
        {skyState === "idle" && geoState === "idle" && (
          <button
            type="button"
            onClick={requestLocation}
            className="btn-neon w-full rounded-2xl py-3 font-display text-sm font-bold"
          >
            📍 Let Cosmo see tonight's sky from my location
          </button>
        )}

        {geoState === "loading" && (
          <p className="text-center text-sm text-cyan-200">📡 Getting your location…</p>
        )}

        {geoState === "denied" && skyState === "idle" && (
          <button
            type="button"
            onClick={() => fetchPlanetInfo(null, null)}
            className="w-full rounded-2xl border border-white/20 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Show planets for a general location
          </button>
        )}

        {skyState === "loading" && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-cyan-200">
            <span className="animate-spin">🔭</span> Scanning the sky…
          </div>
        )}

        {skyState === "done" && planetInfo && (
          <div className="rounded-2xl border border-fuchsia-400/30 bg-violet-950/60 p-4">
            <p className="mb-1 font-display text-sm font-semibold text-fuchsia-200">
              {cityName ? `🌟 Visible from ${cityName}` : "🌟 Tonight's planets"}
            </p>
            <p className="text-sm leading-relaxed text-slate-100">{planetInfo}</p>
          </div>
        )}
      </div>
    </div>
  );
}
