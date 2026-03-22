type Props = { active: boolean };

export function ConstellationLayer({ active }: Props) {
  if (!active) return null;
  return (
    <div className="constellation-layer" aria-hidden="true">
      <svg className="constellation-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
        <line x1="40" y1="120" x2="120" y2="60" className="constellation-line" />
        <line x1="120" y1="60" x2="200" y2="90" className="constellation-line" />
        <line x1="200" y1="90" x2="280" y2="40" className="constellation-line" />
        <line x1="200" y1="90" x2="180" y2="150" className="constellation-line" />
        <line x1="280" y1="40" x2="340" y2="100" className="constellation-line" />
        {[
          [40, 120],
          [120, 60],
          [200, 90],
          [280, 40],
          [180, 150],
          [340, 100],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="3" className="constellation-star" />
        ))}
      </svg>
    </div>
  );
}
