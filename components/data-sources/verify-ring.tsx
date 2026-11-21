/** 90-day re-verification cycle, drawn as a slowly rotating sweep. */
export function VerifyRing() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 200" className="mx-auto w-full max-w-xs" role="img" aria-label="A 90-day cycle: every record is re-checked every 90 days">
      <circle cx="100" cy="100" r="86" fill="none" stroke="var(--color-forest-700)" strokeWidth="1" />
      {ticks.map((i) => {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const major = i % 15 === 0;
        const r1 = major ? 76 : 80;
        return (
          <line
            key={i}
            x1={100 + Math.cos(a) * r1}
            y1={100 + Math.sin(a) * r1}
            x2={100 + Math.cos(a) * 86}
            y2={100 + Math.sin(a) * 86}
            stroke={major ? "var(--color-forest-300)" : "var(--color-forest-500)"}
            strokeWidth={major ? 2 : 1}
          />
        );
      })}
      <g className="sweep">
        <path d="M100 100 L100 14 A86 86 0 0 1 150 30 Z" fill="var(--color-forest-300)" opacity="0.22" />
        <line x1="100" y1="100" x2="100" y2="14" stroke="var(--color-forest-300)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="4" fill="var(--color-forest-300)" />
      <text x="100" y="92" textAnchor="middle" fontSize="40" fontWeight="800" fill="var(--color-sand-50)" style={{ fontStretch: "75%" }}>
        60
      </text>
      <text x="100" y="116" textAnchor="middle" fontSize="12" fill="var(--color-sand-200)">
        day re-check
      </text>
    </svg>
  );
}
