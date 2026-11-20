// Pilo, the BeigePilot mascot. Original vector character (forest body, cream face screen, purple antenna, a "lead dot + record bar" on the chest).
// Pure SVG + CSS (see .pilo-* in globals.css): no animation library, no images. Every animation is off under prefers-reduced-motion.
export type Mood = "idle" | "wave" | "curious" | "nod" | "think" | "search" | "found" | "confused" | "error" | "success" | "point" | "bye";
export type Intensity = "calm" | "balanced" | "lively";

const HAPPY: Mood[] = ["wave", "found", "success", "bye"];
const SMALL_OPEN: Mood[] = ["found", "success"];

function Eyes({ mood }: { mood: Mood }) {
  if (HAPPY.includes(mood)) {
    // closed, smiling arcs
    return <g className="pilo-eyes" fill="none" stroke="#0F2A1D" strokeWidth="3" strokeLinecap="round"><path d="M43 52 q6 -8 12 0" /><path d="M65 52 q6 -8 12 0" /></g>;
  }
  const sad = mood === "error";
  const ry = mood === "confused" ? 6 : sad ? 6.5 : 7.2;
  return (
    <g className="pilo-eyes">
      <g className="pilo-eye"><ellipse cx="49" cy="51" rx="5.6" ry={ry} fill="#0F2A1D" /><circle cx="50.8" cy="48.6" r="1.8" fill="#FBF8F1" /></g>
      <g className="pilo-eye"><ellipse cx="71" cy="51" rx="5.6" ry={mood === "confused" ? 4.6 : ry} fill="#0F2A1D" /><circle cx="72.8" cy="48.6" r="1.8" fill="#FBF8F1" /></g>
    </g>
  );
}

function Brows({ mood }: { mood: Mood }) {
  const p = { fill: "none", stroke: "#0F2A1D", strokeWidth: 2.2, strokeLinecap: "round" as const };
  if (mood === "error") return <g {...p}><path d="M43 41 l12 -3" /><path d="M77 41 l-12 -3" /></g>;
  if (mood === "confused") return <g {...p}><path d="M43 41 l11 1" /><path d="M66 38 l11 -3" /></g>;
  if (mood === "think" || mood === "curious") return <g {...p}><path d="M43 41 q6 -4 12 -1" /><path d="M65 39 q6 -3 12 1" /></g>;
  return null;
}

function Mouth({ mood }: { mood: Mood }) {
  const s = { fill: "none", stroke: "#0F2A1D", strokeWidth: 2.6, strokeLinecap: "round" as const };
  if (SMALL_OPEN.includes(mood) || mood === "wave" || mood === "bye") return <path d="M52 62 q8 11 16 0 z" fill="#0F2A1D" stroke="#0F2A1D" strokeWidth="2" strokeLinejoin="round" />;
  if (mood === "error") return <path d="M54 66 q6 -5 12 0" {...s} />;
  if (mood === "confused") return <path d="M53 65 q3 -3 6 0 t7 0" {...s} />;
  if (mood === "think" || mood === "search") return <ellipse cx="60" cy="65" rx="2.6" ry="2.2" fill="#0F2A1D" />;
  return <path d="M53 63 q7 6 14 0" {...s} />;
}

export function Pilo({ mood = "idle", size = 96, intensity = "balanced", animated = true, className = "", title }: { mood?: Mood; size?: number; intensity?: Intensity; animated?: boolean; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      data-motion={animated ? intensity : "still"} className={`pilo pilo--${mood} ${className}`}>
      <ellipse className="pilo-shadow" cx="60" cy="112" rx="22" ry="4" fill="#0F2A1D" opacity=".12" />
      <g className="pilo-float">
        <g className="pilo-tilt">
          <g className="pilo-breathe">
            {/* antenna */}
            <g className="pilo-antenna"><path d="M60 24 V13" stroke="#0F2A1D" strokeWidth="3" strokeLinecap="round" /><circle className="pilo-orb" cx="60" cy="10" r="5" fill="#7C3AED" /><circle cx="58.5" cy="8.6" r="1.4" fill="#EDE4FD" /></g>
            {/* arms (behind the body) */}
            <g transform="translate(25 72)"><g className="pilo-arm pilo-arm-l"><rect x="-15" y="-4.5" width="17" height="9" rx="4.5" fill="#1B4332" /><circle cx="-15" cy="0" r="5" fill="#2D6A4F" /></g></g>
            <g transform="translate(95 72)"><g className="pilo-arm pilo-arm-r"><rect x="-2" y="-4.5" width="17" height="9" rx="4.5" fill="#1B4332" /><circle cx="15" cy="0" r="5" fill="#2D6A4F" /></g></g>
            {/* body + ear nubs */}
            <rect x="19" y="47" width="7" height="17" rx="3.5" fill="#1B4332" /><rect x="94" y="47" width="7" height="17" rx="3.5" fill="#1B4332" />
            <rect x="24" y="22" width="72" height="68" rx="27" fill="#0F2A1D" />
            {/* face screen */}
            <rect x="31" y="31" width="58" height="42" rx="19" fill="#FBF8F1" />
            <circle cx="38.5" cy="61" r="4" fill="#EDE4FD" /><circle cx="81.5" cy="61" r="4" fill="#EDE4FD" />
            <Brows mood={mood} /><Eyes mood={mood} /><Mouth mood={mood} />
            {/* chest: a lead dot above a record bar */}
            <circle cx="60" cy="79" r="2.4" fill="#FBF8F1" /><rect x="52" y="83" width="16" height="3.4" rx="1.7" fill="#D8C9A3" />
          </g>
        </g>
        {/* props, shown only for their mood */}
        <g className="pilo-prop pilo-lens"><circle cx="105" cy="50" r="8" fill="#FBF8F1" fillOpacity=".6" stroke="#0F2A1D" strokeWidth="2.6" /><path d="M105.5 58 l1.6 5" stroke="#0F2A1D" strokeWidth="3" strokeLinecap="round" /></g>
        <g className="pilo-prop pilo-dots" fill="#7C3AED"><circle cx="86" cy="20" r="2.2" /><circle cx="94" cy="13" r="3" /><circle cx="104" cy="8" r="3.8" /></g>
        <g className="pilo-prop pilo-spark" fill="#7C3AED"><path d="M18 22 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><path d="M102 30 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6z" /><circle cx="26" cy="96" r="2.4" fill="#2D6A4F" /><circle cx="98" cy="96" r="2.4" fill="#2D6A4F" /></g>
        <text className="pilo-prop pilo-q" x="92" y="22" fontSize="20" fontWeight="800" fill="#7C3AED">?</text>
        <path className="pilo-prop pilo-drop" d="M84 36 q-3 5 0 8 q3 -3 0 -8z" fill="#7C3AED" fillOpacity=".55" />
      </g>
    </svg>
  );
}
