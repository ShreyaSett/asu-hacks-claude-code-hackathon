import { useEffect, useState } from "react";
import { Chat } from "./components/Chat";

export default function App() {
  const [audioMode, setAudioMode] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:block focus:rounded-lg focus:bg-cosmic-accent focus:px-4 focus:py-2 focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to chat
      </a>

      <header className="border-b border-white/10 bg-cosmic-deep/80 backdrop-blur-md" role="banner">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-cosmic-star md:text-3xl">
              Cosmo
            </h1>
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
            <span className="max-w-xs text-right text-xs text-slate-500">
              Hides maps and photos; rely on voice and text descriptions. Use Tab to move around.
            </span>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <Chat audioMode={audioMode} />
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500" role="contentinfo">
        Live data: Open-Notify & NASA APIs. No accounts. Built for ASU Hacks.
      </footer>
    </div>
  );
}
