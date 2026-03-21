export function speakText(text: string, onEnd?: () => void): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return null;
  }
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.92;
  u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Google UK English Female|Microsoft Aria|Samantha|Karen/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en") && v.localService === false) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) u.voice = preferred;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return u;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export type SpeechRecCallbacks = {
  onResult: (text: string) => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
};

export function startListening(cb: SpeechRecCallbacks): SpeechRecognition | null {
  if (typeof window === "undefined") {
    cb.onError?.("Voice input is not available in this environment.");
    return null;
  }
  if (!window.isSecureContext) {
    cb.onError?.("Voice input needs HTTPS (or localhost).");
    return null;
  }

  const SR =
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
  if (!SR) {
    cb.onError?.("Voice input is not supported in this browser.");
    return null;
  }
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (ev) => {
    const t = ev.results[0]?.[0]?.transcript?.trim();
    if (t) cb.onResult(t);
  };
  rec.onerror = (ev) => {
    const code = ev.error || "speech error";
    const msg =
      code === "not-allowed" || code === "service-not-allowed"
        ? "Microphone permission was blocked. Allow mic access in your browser settings."
        : code === "audio-capture"
          ? "No microphone was found."
          : code === "no-speech"
            ? "I did not hear anything. Try speaking a bit louder and closer to the mic."
            : code === "network"
              ? "Speech service network error. Check internet and try again."
              : `Voice input error: ${code}`;
    cb.onError?.(msg);
  };
  rec.onend = () => cb.onEnd?.();
  try {
    rec.start();
  } catch (e) {
    cb.onError?.(e instanceof Error ? e.message : "Could not start voice input.");
    return null;
  }
  return rec;
}
