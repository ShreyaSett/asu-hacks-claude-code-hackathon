import { useMemo, type CSSProperties } from "react";

type Props = { tick: number };

export function ConfettiBurst({ tick }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        hue: 200 + Math.random() * 160,
      })),
    [tick]
  );

  if (tick === 0) return null;

  return (
    <div className="confetti-root" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={`${tick}-${p.id}`}
          className="confetti-bit"
          style={
            {
              left: `${p.x}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: `hsla(${p.hue}, 85%, 65%, 0.95)`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
