// Pilo, the BeigePilot companion: a soft, squishy little creature (not a robot). Forest-green bean body, cream belly, big shiny eyes,
// stubby hands, a tiny sprout on top. Pure SVG + CSS (see .pilo-* in globals.css); brand palette only. Every animation is off under prefers-reduced-motion.
export type Mood = "idle" | "wave" | "curious" | "nod" | "think" | "search" | "found" | "confused" | "error" | "success" | "point" | "bye" | "giggle";
export type Intensity = "calm" | "balanced" | "lively";

const HAPPY: Mood[] = ["wave", "found", "success", "bye", "giggle"];
const OPEN_MOUTH: Mood[] = ["found", "success", "wave", "bye", "giggle"];

function Eyes({ mood }: { mood: Mood }) {
  if (HAPPY.includes(mood)) {
    return <g className="pilo-eyes" fill="none" stroke="#FBF8F1" strokeWidth="3.4" strokeLinecap="round"><path d="M39 62 q7 -9 14 0" /><path d="M67 62 q7 -9 14 0" /></g>;
  }
  const ry = mood === "error" ? 8 : mood === "confused" ? 8.5 : 9.5;
  const eye = (cx: number, rry: number) => (
    <g className="pilo-eye"><ellipse cx={cx} cy="62" rx="8.4" ry={rry} fill="#FBF8F1" />
      <g className="pilo-pupil"><ellipse cx={cx} cy="63" rx="5" ry={Math.min(6.4, rry - 2.2)} fill="#0F2A1D" /><circle cx={cx + 1.9} cy="60.2" r="2" fill="#FBF8F1" /><circle cx={cx - 1.6} cy="65.2" r=".9" fill="#FBF8F1" /></g></g>
  );
  return <g className="pilo-eyes">{eye(46, ry)}{eye(74, mood === "confused" ? 6.4 : ry)}</g>;
}

function Brows({ mood }: { mood: Mood }) {
  const p = { fill: "none", stroke: "#D8EADF", strokeWidth: 2.4, strokeLinecap: "round" as const };
  if (mood === "error") return <g {...p}><path d="M38 48 l15 -4" /><path d="M82 48 l-15 -4" /></g>;
  if (mood === "confused") return <g {...p}><path d="M38 50 l14 1" /><path d="M68 44 l14 -4" /></g>;
  if (mood === "think" || mood === "curious") return <g {...p}><path d="M38 48 q8 -5 15 -1" /><path d="M67 46 q8 -4 15 1" /></g>;
  return null;
}

function Mouth({ mood }: { mood: Mood }) {
  const s = { fill: "none", stroke: "#0F2A1D", strokeWidth: 2.8, strokeLinecap: "round" as const };
  if (OPEN_MOUTH.includes(mood)) return <g><path d="M51 75 q9 14 18 0 z" fill="#0F2A1D" stroke="#0F2A1D" strokeWidth="2" strokeLinejoin="round" /><path d="M55.5 81.6 q4.5 -3.6 9 0 q-4.5 3.4 -9 0z" fill="#EDE4FD" /></g>;
  if (mood === "error") return <path d="M53 83 q7 -6 14 0" {...s} />;
  if (mood === "confused") return <path d="M52 80 q3 -3.4 6.5 0 t7 0" {...s} />;
  if (mood === "think" || mood === "search") return <ellipse cx="60" cy="80" rx="3" ry="3.4" fill="#0F2A1D" />;
  return <path d="M52 76 q8 8 16 0" {...s} />;
}

export function Pilo({ mood = "idle", size = 96, intensity = "balanced", animated = true, className = "", title }: { mood?: Mood; size?: number; intensity?: Intensity; animated?: boolean; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      data-motion={animated ? intensity : "still"} className={`pilo pilo--${mood} ${className}`}>
      <ellipse className="pilo-shadow" cx="60" cy="113" rx="24" ry="4" fill="#0F2A1D" opacity=".12" />
      <g className="pilo-float">
        <g className="pilo-tilt">
          <g className="pilo-breathe">
            {/* sprout */}
            <g className="pilo-sprout"><path d="M60 30 q1 -8 -1 -13" stroke="#1B4332" strokeWidth="3" strokeLinecap="round" fill="none" /><path d="M59 18 q-12 -2 -15 -11 q11 -2 15 11z" fill="#8FCFA6" /><path d="M59.5 17 q11 -1 15 -10 q-11 -2 -15 10z" fill="#D8EADF" /></g>
            {/* feet */}
            <ellipse cx="46" cy="106" rx="9" ry="5" fill="#1B4332" /><ellipse cx="74" cy="106" rx="9" ry="5" fill="#1B4332" />
            {/* hands (behind the body) */}
            <g transform="translate(25 76)"><g className="pilo-arm pilo-arm-l"><rect x="-10" y="-4.4" width="13" height="8.8" rx="4.4" fill="#2D6A4F" /><circle cx="-10" cy="0" r="6" fill="#D8EADF" /></g></g>
            <g transform="translate(95 76)"><g className="pilo-arm pilo-arm-r"><rect x="-3" y="-4.4" width="13" height="8.8" rx="4.4" fill="#2D6A4F" /><circle cx="10" cy="0" r="6" fill="#D8EADF" /></g></g>
            {/* body: a soft bean */}
            <path d="M60 28 C88 28 101 48 101 72 C101 94 85 107 60 107 C35 107 19 94 19 72 C19 48 32 28 60 28Z" fill="#2D6A4F" />
            <ellipse cx="60" cy="94" rx="23" ry="12" fill="#D8EADF" opacity=".92" />
            <ellipse cx="46" cy="40" rx="13" ry="6" fill="#FBF8F1" opacity=".16" transform="rotate(-18 46 40)" />
            <circle cx="36" cy="76" r="5.2" fill="#EDE4FD" opacity=".85" /><circle cx="84" cy="76" r="5.2" fill="#EDE4FD" opacity=".85" />
            <Brows mood={mood} /><Eyes mood={mood} /><Mouth mood={mood} />
          </g>
        </g>
        {/* props, shown only for their mood */}
        <g className="pilo-prop pilo-lens"><circle cx="106" cy="58" r="8" fill="#FBF8F1" fillOpacity=".6" stroke="#0F2A1D" strokeWidth="2.6" /><path d="M106.5 66 l1.6 5" stroke="#0F2A1D" strokeWidth="3" strokeLinecap="round" /></g>
        <g className="pilo-prop pilo-dots" fill="#7C3AED"><circle cx="88" cy="24" r="2.2" /><circle cx="96" cy="16" r="3" /><circle cx="106" cy="9" r="3.8" /></g>
        <g className="pilo-prop pilo-spark" fill="#7C3AED"><path d="M16 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><path d="M104 36 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" /><circle cx="24" cy="100" r="2.4" fill="#2D6A4F" /><circle cx="98" cy="100" r="2.4" fill="#2D6A4F" /></g>
        <text className="pilo-prop pilo-q" x="92" y="30" fontSize="20" fontWeight="800" fill="#7C3AED">?</text>
        <path className="pilo-prop pilo-drop" d="M90 44 q-3 5 0 8 q3 -3 0 -8z" fill="#7C3AED" fillOpacity=".5" />
      </g>
    </svg>
  );
}
