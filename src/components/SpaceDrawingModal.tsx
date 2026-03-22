import { useEffect, useRef, useState } from "react";

const COLORS = [
  "#FFFFFF", "#22D3EE", "#A855F7", "#FDE047",
  "#F97316", "#EF4444", "#3B82F6", "#EC4899",
  "#10B981", "#000000",
];

type DrawState = "idle" | "loading" | "done";

type Props = {
  onClose: () => void;
};

export function SpaceDrawingModal({ onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const history = useRef<string[]>([]);

  const [color, setColor] = useState("#FFFFFF");
  const [size, setSize] = useState(6);
  const [eraser, setEraser] = useState(false);
  const [drawState, setDrawState] = useState<DrawState>("idle");
  const [story, setStory] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveHistory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    history.current = [canvas.toDataURL(), ...history.current].slice(0, 20);
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    isDrawing.current = true;
    lastPos.current = getPos(e);
    saveHistory();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = eraser ? size * 4 : size;
    ctx.strokeStyle = eraser ? "#0a0e1a" : color;
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }

  function onPointerUp() {
    isDrawing.current = false;
  }

  function handleUndo() {
    if (history.current.length < 2) return;
    history.current.shift();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = history.current[0];
  }

  function handleClear() {
    saveHistory();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0a0e1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  async function handleTellCosmo() {
    const canvas = canvasRef.current!;
    const imageData = canvas.toDataURL("image/png");
    setDrawState("loading");
    try {
      const r = await fetch("/api/describe-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });
      const data = (await r.json()) as { story?: string; error?: string };
      if (!r.ok || !data.story) throw new Error(data.error ?? "No story returned");
      setStory(data.story);
      setDrawState("done");
    } catch (err) {
      setStory("Uh oh — I couldn't read the drawing! Try again in a moment.");
      setDrawState("done");
      console.error(err);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Space Drawing Studio"
    >
      <div className="drawing-modal flex w-full max-w-2xl flex-col gap-3 rounded-3xl border border-violet-400/30 bg-cosmic-deep p-4 shadow-glow">
        <div className="flex items-center justify-between">
          <h2 className="neon-text font-display text-xl font-bold">🎨 Space Drawing Studio</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            aria-label="Close drawing studio"
          >
            ✕
          </button>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={320}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="w-full cursor-crosshair rounded-2xl border border-white/10 touch-none"
          style={{ background: "#0a0e1a" }}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setColor(c); setEraser(false); }}
                className="h-7 w-7 rounded-full border-2 transition hover:scale-110"
                style={{
                  background: c,
                  borderColor: color === c && !eraser ? "#22D3EE" : "rgba(255,255,255,0.2)",
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          <input
            type="range"
            min={2}
            max={24}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24 accent-cyan-400"
            aria-label="Brush size"
          />

          <button
            type="button"
            onClick={() => setEraser((e) => !e)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${eraser ? "bg-fuchsia-600 text-white" : "border border-white/20 text-slate-300 hover:bg-white/10"}`}
          >
            {eraser ? "🧹 Eraser" : "Eraser"}
          </button>
          <button type="button" onClick={handleUndo} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">
            ↩ Undo
          </button>
          <button type="button" onClick={handleClear} className="rounded-xl border border-white/20 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10">
            🗑 Clear
          </button>
        </div>

        {drawState === "idle" && (
          <button
            type="button"
            onClick={() => void handleTellCosmo()}
            className="btn-neon w-full rounded-2xl py-3 font-display text-base font-bold"
          >
            🚀 Tell me a space story about my drawing!
          </button>
        )}

        {drawState === "loading" && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-950/40 py-4">
            <span className="animate-spin text-2xl">🌀</span>
            <p className="text-cyan-100">Cosmo is reading your drawing…</p>
          </div>
        )}

        {drawState === "done" && (
          <div className="story-bubble rounded-2xl border border-fuchsia-400/40 bg-violet-950/80 p-4">
            <p className="mb-1 font-display text-sm font-semibold text-fuchsia-200">✨ Cosmo says:</p>
            <p className="text-sm leading-relaxed text-slate-100">{story}</p>
            <button
              type="button"
              onClick={() => { setDrawState("idle"); setStory(""); }}
              className="mt-3 rounded-xl border border-white/20 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10"
            >
              🎨 Draw again!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
