import { useCallback, useEffect, useId, useRef, useState } from "react";
import { sendCosmoMessage, requestParentSummary } from "@/lib/api";
import type { ChatMessage, CosmoVisuals } from "@/lib/types";
import { speakText, startListening, stopSpeaking } from "@/lib/speech";
import { VisualPanel } from "./VisualPanel";

const NAME_KEY = "cosmo_child_name";
const AGE_KEY = "cosmo_age";

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
  const [childName, setChildName] = useState(() => localStorage.getItem(NAME_KEY) || "");
  const [age, setAge] = useState(() => Number(localStorage.getItem(AGE_KEY)) || 7);
  const [speaking, setSpeaking] = useState(false);
  const [parentOpen, setParentOpen] = useState(false);
  const [parentText, setParentText] = useState("");
  const [parentLoading, setParentLoading] = useState(false);
  const [llmProvider, setLlmProvider] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  const nameId = useId();
  const ageId = useId();

  useEffect(() => {
    if (childName) localStorage.setItem(NAME_KEY, childName);
    else localStorage.removeItem(NAME_KEY);
  }, [childName]);

  useEffect(() => {
    localStorage.setItem(AGE_KEY, String(age));
  }, [age]);

  useEffect(() => {
    liveRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const pushMessage = useCallback((role: "user" | "cosmo", text: string) => {
    setMessages((m) => [...m, { id: uid(), role, text }]);
  }, []);

  const runSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(null);
      pushMessage("user", trimmed);
      setInput("");
      setLoading(true);
      try {
        const res = await sendCosmoMessage({
          message: trimmed,
          childName: childName.trim() || undefined,
          age,
        });
        pushMessage("cosmo", res.reply);
        setVisuals(res.visuals);
        if (res.meta.llmProvider) setLlmProvider(res.meta.llmProvider);
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
    [age, audioMode, childName, loading, pushMessage]
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

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 pt-6 md:flex-row md:items-start">
      <div className="min-w-0 flex-1">
        <div
          className="mb-4 flex flex-wrap items-end gap-4 rounded-2xl border border-white/10 bg-cosmic-deep/60 p-4"
          role="region"
          aria-label="Your settings"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor={nameId} className="text-xs font-medium text-slate-400">
              Your name (optional, stays on this device)
            </label>
            <input
              id={nameId}
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              maxLength={40}
              className="w-48 rounded-lg border border-white/15 bg-cosmic-void px-3 py-2 text-sm text-white outline-none ring-cosmic-accent focus:ring-2"
              autoComplete="nickname"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={ageId} className="text-xs font-medium text-slate-400">
              Age (for how Cosmo explains)
            </label>
            <input
              id={ageId}
              type="number"
              min={4}
              max={12}
              value={age}
              onChange={(e) => setAge(Number(e.target.value) || 7)}
              className="w-24 rounded-lg border border-white/15 bg-cosmic-void px-3 py-2 text-sm text-white outline-none ring-cosmic-accent focus:ring-2"
            />
          </div>
        </div>

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
          className="mb-3 min-h-[280px] max-h-[min(55vh,520px)] overflow-y-auto rounded-2xl border border-white/10 bg-cosmic-deep/40 p-4 md:min-h-[360px]"
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
                  className={`rounded-xl px-4 py-3 ${
                    m.role === "user"
                      ? "ml-8 border border-violet-500/30 bg-violet-950/40"
                      : "mr-4 border border-amber-200/20 bg-amber-950/20"
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {m.role === "user" ? "You" : "Cosmo"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-100">{m.text}</p>
                </div>
              </li>
            ))}
          </ul>
          {loading && (
            <p className="mt-4 animate-pulse text-cosmic-glow" aria-busy="true">
              Cosmo is thinking…
            </p>
          )}
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
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void runSend(input);
                }
              }}
              placeholder="Ask Cosmo anything about space…"
              className="w-full resize-y rounded-xl border border-white/15 bg-cosmic-void px-4 py-3 text-base text-white outline-none ring-cosmic-accent placeholder:text-slate-500 focus:ring-2"
              disabled={loading}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-cosmic-accent px-5 py-3 font-display font-semibold text-white shadow-glow transition hover:bg-violet-600 disabled:opacity-40"
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
