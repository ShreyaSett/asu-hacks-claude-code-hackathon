import { useEffect, useState } from "react";
import { Chat } from "./components/Chat";
import { FloatingAstronaut } from "./components/FloatingAstronaut";
import { SpaceChrome } from "./components/SpaceChrome";
import { DidYouKnow } from "./components/DidYouKnow";
import { SpaceWordBadge } from "./components/SpaceWordBadge";
import { ensureAudio, setAmbienceOn } from "./lib/spaceSounds";

export default function App() {
  const [audioMode, setAudioMode] = useState(false);
  const [ambience, setAmbience] = useState(false);
  const [apodUrl, setApodUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY")
      .then((r) => r.json())
      .then((d: { media_type?: string; url?: string }) => {
        if (cancelled) return;
        if (d?.media_type === "image" && d?.url) setApodUrl(d.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void ensureAudio().then(() => setAmbienceOn(ambience));
    return () => {
      void setAmbienceOn(false);
    };
  }, [ambience]);

  return (
    <div className="space-bg min-h-screen">
      <SpaceChrome apodImageUrl={apodUrl} />
      <div className="space-stars" aria-hidden="true" />
      <div className="space-nebula" aria-hidden="true" />

      <div className="relative z-10">
        <SpaceWordBadge />
        <FloatingAstronaut />
        <a
          href="#main"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:rounded-lg focus:bg-cosmic-accent focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to chat
        </a>

        <header className="border-b border-white/10 bg-cosmic-deep/75 backdrop-blur-md" role="banner">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
            <div>
              <h1 className="neon-text font-display text-2xl font-bold tracking-tight md:text-3xl">Cosmo</h1>
              <p className="mt-1 max-w-xl text-sm text-slate-400">
                Your live space companion. Cosmo uses real sky data when it can — then answers in words that fit your
                age.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={audioMode}
                  onChange={(e) => setAudioMode(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 bg-cosmic-void text-cosmic-accent focus:ring-cosmic-accent"
                />
                Audio-first mode
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={ambience}
                  onChange={(e) => {
                    void ensureAudio();
                    setAmbience(e.target.checked);
                  }}
                  className="h-4 w-4 rounded border-white/30 bg-cosmic-void text-cyan-400 focus:ring-cyan-400"
                />
                Soft space hum (toggle)
              </label>
              <span className="max-w-xs text-right text-xs text-slate-500">
                Audio-first hides maps and photos. Ambience is a gentle built-in hum (see NASA sound library for real
                clips).
              </span>
            </div>
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          <div className="mx-auto max-w-6xl px-4 pt-6">
            <DidYouKnow />
          </div>
          <Chat audioMode={audioMode} />
        </main>

        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500" role="contentinfo">
          Live data: Open-Notify & NASA APIs. No accounts. Built for ASU Hacks.
        </footer>
      </div>
    </div>
  );
}
