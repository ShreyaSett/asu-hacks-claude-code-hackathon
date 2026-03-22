import { useEffect, useId, useRef, useState } from "react";

const STORAGE_KEY = "cosmo-welcome-seen";

const INTRO_COPY =
  "Hi I'm Cosmo, your Space Buddy. Nice to meet you today. Let's learn some cool space stuff";

function welcomeAlreadySeen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markCosmoWelcomeSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Props = {
  onComplete: () => void;
};

export function CosmoWelcomeOverlay({ onComplete }: Props) {
  const titleId = useId();
  const skipRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<"in" | "out">("in");
  const [reducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    skipRef.current?.focus();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const flyMs = reducedMotion ? 400 : 1400;
    const readMs = reducedMotion ? 2200 : 5200;
    const t = window.setTimeout(() => setPhase("out"), flyMs + readMs);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => {
      markCosmoWelcomeSeen();
      onComplete();
    }, 550);
    return () => window.clearTimeout(t);
  }, [phase, onComplete]);

  const skip = () => {
    setPhase("out");
  };

  return (
    <div
      className={`cosmo-welcome-root ${phase === "out" ? "cosmo-welcome-root--out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="cosmo-welcome-scrim" aria-hidden="true" />
      <div className="cosmo-welcome-stage">
        <div className={`cosmo-welcome-fly ${reducedMotion ? "cosmo-welcome-fly--reduced" : ""}`}>
          <div className="cosmo-welcome-astro-bob">
            <div className="cosmo-welcome-astro-frame">
              <img className="cosmo-welcome-astro-img" src="/astrocutie.svg" alt="" />
            </div>
          </div>
        </div>

        <div className={`cosmo-welcome-bubble ${reducedMotion ? "cosmo-welcome-bubble--reduced" : ""}`}>
          <p id={titleId} className="cosmo-welcome-bubble-title font-display text-base font-semibold text-cyan-100">
            Cosmo
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-100 md:text-base">{INTRO_COPY}</p>
        </div>

        <button
          ref={skipRef}
          type="button"
          onClick={skip}
          className="cosmo-welcome-skip mt-8 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-slate-100 backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-300/80"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}

export function shouldSkipWelcomeOverlay(): boolean {
  return welcomeAlreadySeen();
}
