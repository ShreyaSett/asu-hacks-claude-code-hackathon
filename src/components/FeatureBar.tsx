type ActiveFeature = "draw" | "sky" | "journal" | null;

type Props = {
  active: ActiveFeature;
  onToggle: (f: ActiveFeature) => void;
};

const FEATURES: { id: Exclude<ActiveFeature, null>; emoji: string; label: string }[] = [
  { id: "draw", emoji: "🎨", label: "Draw" },
  { id: "sky", emoji: "🌙", label: "Tonight's Sky" },
  { id: "journal", emoji: "📓", label: "Journal" },
];

export function FeatureBar({ active, onToggle }: Props) {
  return (
    <div
      className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2"
      role="toolbar"
      aria-label="Cosmo features"
    >
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/85 px-3 py-2 shadow-[0_0_28px_rgba(34,211,238,0.25)] backdrop-blur-md">
        {FEATURES.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onToggle(active === f.id ? null : f.id)}
            aria-pressed={active === f.id}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
              active === f.id
                ? "bg-cosmic-accent text-white shadow-[0_0_14px_rgba(124,58,237,0.7)]"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span aria-hidden="true">{f.emoji}</span>
            <span className="hidden sm:inline">{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type { ActiveFeature };
