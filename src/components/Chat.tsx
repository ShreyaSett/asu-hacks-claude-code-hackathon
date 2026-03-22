import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { sendCosmoMessage, requestParentSummary } from "@/lib/api";
import type { ChatMessage, CosmoVisuals } from "@/lib/types";
import { playReplyWhoosh, playTypingBlip } from "@/lib/spaceSounds";
import { playNasaSound, speakText, startListening, stopSpeaking } from "@/lib/speech";
import { ConfettiBurst } from "./ConfettiBurst";
import { ConstellationLayer } from "./ConstellationLayer";
import { CosmoBuddy } from "./CosmoBuddy";
import { VisualPanel } from "./VisualPanel";
import { WarpWait } from "./WarpWait";

/** Default when name/age UI is hidden — API still personalizes tone for ~this age. */
const DEFAULT_AGE = 7;

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const emptyVisuals: CosmoVisuals = { apod: null, iss: null, mars: null };

type Props = {
  audioMode: boolean;
};

export function Chat({ audioMode }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<CosmoVisuals>(emptyVisuals);
  const [speaking, setSpeaking] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const [parentText, setParentText] = useState("");
  const [parentLoading, setParentLoading] = useState(false);
  const [llmProvider, setLlmProvider] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const typingBlipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const inputId = useId();

  useEffect(() => {
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (typingBlipTimer.current) clearTimeout(typingBlipTimer.current);
    };
  }, []);

  const showConstellation = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user")?.text ?? "";
    const t = `${lastUser} ${input}`.toLowerCase();
    return /\b(star|stars|constellation|constellations|galaxy|galaxies|nebula|nebulae|night sky|twinkle|orion|milky way)\b/.test(
      t
    );
  }, [messages, input]);

  const pushMessage = useCallback((role: "user" | "cosmo", text: string) => {
    setMessages((m) => [...m, { id: uid(), role, text }]);
  }, []);

  const runSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      const words = trimmed.split(/\s+/).filter(Boolean);
      const goodQuestion =
        trimmed.length > 18 || /\?/.test(trimmed) || words.length >= 6 || /\b(why|how|what if)\b/i.test(trimmed);
      if (goodQuestion) setConfettiTick((n) => n + 1);

      pushMessage("user", trimmed);
      setInput("");
      setLoading(true);
      try {
        const res = await sendCosmoMessage({
          message: trimmed,
          age: DEFAULT_AGE,
        });
        pushMessage("cosmo", res.reply);
        void playReplyWhoosh();
        setVisuals(res.visuals);
        if (res.meta.llmProvider) setLlmProvider(res.meta.llmProvider);
        const ns = res.meta.nasaSound;
        if (ns?.url) {
          playNasaSound(ns.url, audioMode ? 0.22 : 0.38);
        }
        if (audioMode) {
          setSpeaking(true);
          speakText(res.reply, () => setSpeaking(false));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [audioMode, loading, pushMessage]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSend(input);
  };

  const onMic = () => {
    setError(null);
    startListening({
      onResult: (t) => void runSend(t),
      onError: (msg) => setError(msg),
    });
  };

  const onReadLast = () => {
    const last = [...messages].reverse().find((m) => m.role === "cosmo");
    if (!last) return;
    setSpeaking(true);
    speakText(last.text, () => setSpeaking(false));
  };

  const onParentSummary = async () => {
    if (messages.length < 2) {
      setParentText("Chat a little first — Cosmo needs a few messages to summarize.");
      setParentOpen(true);
      return;
    }
    setParentLoading(true);
    setParentOpen(true);
    setParentText("");
    const lines = messages.map((m) => `${m.role === "user" ? "Child" : "Cosmo"}: ${m.text}`);
    try {
      const t = await requestParentSummary(lines.join("\n"));
      setParentText(t);
    } catch (e) {
      setParentText(e instanceof Error ? e.message : "Could not load summary");
    } finally {
      setParentLoading(false);
    }
  };

  const buddyMood = error ? "error" : loading ? "thinking" : messages.length > 0 ? "celebrate" : "welcome";

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 md:flex-row md:items-start">
      <ConstellationLayer active={showConstellation} />
      <ConfettiBurst key={confettiTick} tick={confettiTick} />

      <div className="min-w-0 max-w-lg flex-1">
        <CosmoBuddy mood={buddyMood} onTryPrompt={(prompt) => setInput(prompt)} />

        {llmProvider === "mock" && (
          <p
            className="mb-3 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-sm text-amber-100"
            role="status"
          >
            Demo mode: no AI API key is set. Live ISS and NASA data still work when your question matches; add{" "}
            <span className="font-mono text-amber-50/90">OPENAI_API_KEY</span>,{" "}
            <span className="font-mono text-amber-50/90">GEMINI_API_KEY</span>, or{" "}
            <span className="font-mono text-amber-50/90">ANTHROPIC_API_KEY</span> for full Cosmo (see{" "}
            <span className="font-mono text-amber-50/90">.env.example</span>).
          </p>
        )}

        <div
          className="mb-3 min-h-[140px] max-h-[min(32vh,240px)] overflow-y-auto rounded-2xl border border-white/10 bg-cosmic-deep/40 p-3 md:min-h-[160px] md:max-h-[min(36vh,280px)]"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation with Cosmo"
        >
          {messages.length === 0 && (
            <p className="text-slate-400">
              Say hi! Try: &quot;Is anyone in space right now?&quot; or &quot;What is a black hole?&quot;
            </p>
          )}
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id}>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    m.role === "user"
                      ? "ml-6 border border-violet-500/30 bg-violet-950/40"
                      : "mr-3 border border-amber-200/20 bg-amber-950/20"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {m.role === "user" ? "You" : "Cosmo"}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-100">{m.text}</p>
                </div>
              </li>
            ))}
          </ul>
          {loading && <WarpWait />}
          <div ref={liveRef} />
        </div>

        {error && (
          <p className="mb-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor={inputId} className="sr-only">
              Message to Cosmo
            </label>
            <textarea
              id={inputId}
              rows={1}
              value={input}
              onChange={(e) => {
                const v = e.target.value;
                setInput(v);
                if (typingBlipTimer.current) clearTimeout(typingBlipTimer.current);
                typingBlipTimer.current = setTimeout(() => {
                  void playTypingBlip();
                }, 110);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runSend(input);
                }
              }}
              placeholder="Ask Cosmo anything about space…"
              className="w-full resize-y rounded-xl border border-white/15 bg-cosmic-void px-3 py-2 text-sm text-white outline-none ring-cosmic-accent placeholder:text-slate-500 focus:ring-2"
              disabled={loading}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-neon rounded-xl px-5 py-3 font-display font-semibold disabled:opacity-40"
            >
              Send
            </button>
            <button
              type="button"
              onClick={onMic}
              disabled={loading}
              className="rounded-xl border border-white/20 px-4 py-3 font-medium text-slate-200 hover:bg-white/5 disabled:opacity-40"
              aria-label="Speak your question"
            >
              🎤 Voice
            </button>
            <button
              type="button"
              onClick={onReadLast}
              disabled={loading || speaking}
              className="rounded-xl border border-white/20 px-4 py-3 font-medium text-slate-200 hover:bg-white/5 disabled:opacity-40"
              aria-label="Read Cosmo's last reply aloud"
            >
              🔊 Read last
            </button>
            <button
              type="button"
              onClick={() => stopSpeaking()}
              className="rounded-xl border border-white/20 px-4 py-3 font-medium text-slate-200 hover:bg-white/5"
              aria-label="Stop speaking"
            >
              Stop voice
            </button>
          </div>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => void onParentSummary()}
            className="text-sm text-cosmic-glow underline decoration-dotted underline-offset-4 hover:text-white"
          >
            Parent summary (optional)
          </button>
        </div>

        {parentOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="parent-summary-title"
          >
            <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-cosmic-deep p-6 shadow-glow">
              <h2 id="parent-summary-title" className="font-display text-lg font-semibold text-cosmic-star">
                Session summary
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Stays on this device unless you copy it. Not stored on a server as a profile — only sent to generate
                this summary.
              </p>
              {parentLoading ? (
                <p className="mt-4 text-cosmic-glow">Writing summary…</p>
              ) : (
                <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-slate-200">{parentText}</pre>
              )}
              <button
                type="button"
                onClick={() => setParentOpen(false)}
                className="mt-6 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full shrink-0 md:w-[340px] lg:w-[380px]">
        <VisualPanel visuals={visuals} audioMode={audioMode} />
      </div>
    </div>
  );
}
