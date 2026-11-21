// Pilo, the BeigePilot mascot: a soft, squishy beige creature with a folded paper-corner ear (a wink at the BeigeLeads logo tag).
// Big glossy eyes, expressive brows, tiny mitten hands, a mouth with many faces. Pure SVG + CSS (see .pl-* in globals.css), brand palette only.
// Gradients give it a soft 3D look without filters, so it stays cheap to animate. Every animation is off under prefers-reduced-motion.
import { useId } from "react";

export type Mood =
  | "idle" | "wave" | "curious" | "nod" | "think" | "search" | "found" | "confused" | "error" | "success" | "point" | "bye" | "giggle"
  | "wink" | "dance" | "sleepy" | "surprised" | "silly" | "excited";
export type Intensity = "calm" | "balanced" | "lively";

const ARCH_EYES: Mood[] = ["giggle", "dance", "success"];
const WIDE_MOUTH: Mood[] = ["wave", "found", "success", "bye", "giggle", "dance", "excited"];

function Eye({ x, id, wink }: { x: number; id: string; wink?: boolean }) {
  if (wink) return <path d={`M${x - 10} 99 Q${x} 87 ${x + 10} 99`} fill="none" stroke="#0F2A1D" strokeWidth="4.2" strokeLinecap="round" />;
  const hl = x < 80 ? 1 : 1;
  return (
    <g className="pl-eye">
      <g className="pl-ball">
        <ellipse cx={x} cy="97" rx="10.6" ry="12.6" fill={`url(#${id}-eye)`} />
        <ellipse cx={x + 4 * hl} cy="91.6" rx="4.1" ry="4.5" fill="#FBF8F1" />
        <circle cx={x - 4.2} cy="103.4" r="1.9" fill="#FBF8F1" opacity=".85" />
        <ellipse cx={x} cy="97" rx="10.6" ry="12.6" fill="none" stroke="#0F2A1D" strokeWidth="1" />
      </g>
    </g>
  );
}

function ArchEye({ x }: { x: number }) {
  return <path className="pl-arch" d={`M${x - 10} 100 Q${x} 86 ${x + 10} 100`} fill="none" stroke="#0F2A1D" strokeWidth="4.6" strokeLinecap="round" />;
}

function Mouth({ mood }: { mood: Mood }) {
  const line = { fill: "none", stroke: "#0F2A1D", strokeWidth: 3.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const tongue = <path d="M74.5 126 Q80 144 85.5 126 Z" fill="#EDE4FD" stroke="#0F2A1D" strokeWidth="1.6" strokeLinejoin="round" />;
  if (WIDE_MOUTH.includes(mood)) return <g><path d="M67 116 Q80 146 93 116 Z" fill="#0F2A1D" stroke="#0F2A1D" strokeWidth="2.4" strokeLinejoin="round" /><path d="M72.6 130.4 Q80 122 87.4 130.4 Q80 140 72.6 130.4Z" fill="#EDE4FD" /></g>;
  if (mood === "silly") return <g><path d="M68 117 Q80 128 92 117" {...line} /><path d="M75 123 Q80 143 85 123 Z" fill="#EDE4FD" stroke="#0F2A1D" strokeWidth="2" strokeLinejoin="round" /><path d="M80 125 V133" stroke="#0F2A1D" strokeWidth="1.2" strokeLinecap="round" opacity=".6" /></g>;
  if (mood === "wink") return <g><path d="M68 119 Q82 131 94 114" {...line} /><path d="M94 114 q2 -1 3 1" {...line} strokeWidth="2.6" /></g>;
  if (mood === "surprised" || mood === "search") return <ellipse cx="80" cy="124" rx="4.6" ry="6.2" fill="#0F2A1D" />;
  if (mood === "sleepy") return <path d="M74 123 Q80 127 86 123" {...line} strokeWidth="3" />;
  if (mood === "error") return <path d="M70 127 Q80 116 90 127" {...line} />;
  if (mood === "confused") return <path d="M68 123 q4.5 -5 9 0 t9 0 t9 0" {...line} strokeWidth="3" />;
  if (mood === "think") return <path d="M72 124 Q82 119 90 121" {...line} />;
  if (mood === "curious") return <g><path d="M70 119 Q80 129 90 117" {...line} /></g>;
  void tongue;
  return <path d="M69 117 Q80 130 91 117" {...line} />;
}

/**
 * `crop="avatar"` shows the whole creature without the feet (header and message avatars).
 * `peek` hides the arms and the lower body clip is done by the caller (the launcher).
 */
export function Pilo({ mood = "idle", size = 96, intensity = "balanced", animated = true, className = "", title, crop, peek = false, blinkDelay = 0 }: {
  mood?: Mood; size?: number; intensity?: Intensity; animated?: boolean; className?: string; title?: string; crop?: "avatar"; peek?: boolean; blinkDelay?: number;
}) {
  const id = useId().replace(/:/g, "");
  const arch = ARCH_EYES.includes(mood);
  const view = crop === "avatar" ? "6 26 148 128" : "0 0 160 170";
  const w = crop === "avatar" ? size : size;
  const h = crop === "avatar" ? size * (128 / 148) : size * (170 / 160);
  return (
    <svg viewBox={view} width={w} height={h} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false"
      data-motion={animated ? intensity : "still"} style={blinkDelay ? ({ "--bd": `${blinkDelay}s` } as React.CSSProperties) : undefined}
      className={`pl pl--${mood} ${peek ? "pl--peek" : ""} ${className}`}>
      <defs>
        <radialGradient id={`${id}-body`} cx=".34" cy=".26" r=".95"><stop offset="0" stopColor="#FFFDF6" /><stop offset=".34" stopColor="#F2E9D3" /><stop offset=".74" stopColor="#DDCEA8" /><stop offset="1" stopColor="#BFAC7E" /></radialGradient>
        <linearGradient id={`${id}-shade`} x1="0" y1=".5" x2="0" y2="1"><stop offset="0" stopColor="#0F2A1D" stopOpacity="0" /><stop offset="1" stopColor="#0F2A1D" stopOpacity=".2" /></linearGradient>
        <radialGradient id={`${id}-eye`} cx=".4" cy=".3" r=".9"><stop offset="0" stopColor="#2D6A4F" /><stop offset=".45" stopColor="#12301F" /><stop offset="1" stopColor="#0A1E14" /></radialGradient>
        <linearGradient id={`${id}-flap`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9DDBB" /><stop offset="1" stopColor="#C2AF80" /></linearGradient>
        <radialGradient id={`${id}-hand`} cx=".35" cy=".3" r=".9"><stop offset="0" stopColor="#FFFDF6" /><stop offset=".6" stopColor="#E6D9B6" /><stop offset="1" stopColor="#C9B78A" /></radialGradient>
      </defs>

      <ellipse className="pl-shadow" cx="80" cy="152" rx="36" ry="5" fill="#0F2A1D" opacity=".14" />
      <g className="pl-lean">
        <g className="pl-hop">
          <g className="pl-squash">
            {/* feet */}
            <ellipse cx="58" cy="148" rx="13" ry="6.5" fill="#1B4332" /><ellipse cx="102" cy="148" rx="13" ry="6.5" fill="#1B4332" />
            <ellipse cx="55" cy="146" rx="6" ry="2.2" fill="#FBF8F1" opacity=".18" /><ellipse cx="99" cy="146" rx="6" ry="2.2" fill="#FBF8F1" opacity=".18" />

            {/* arms: tiny mitten hands, behind the body */}
            <g transform="translate(30 116)"><g className="pl-arm pl-arm-l"><g transform="scale(-1 1)"><rect x="-4" y="-5.6" width="19" height="11.2" rx="5.6" fill={`url(#${id}-body)`} /><circle cx="18" cy="0" r="8.6" fill={`url(#${id}-hand)`} stroke="#B8A574" strokeOpacity=".6" strokeWidth="1" /><circle cx="22.4" cy="-4" r="3.4" fill={`url(#${id}-hand)`} /></g></g></g>
            <g transform="translate(130 116)"><g className="pl-arm pl-arm-r"><rect x="-4" y="-5.6" width="19" height="11.2" rx="5.6" fill={`url(#${id}-body)`} /><circle cx="18" cy="0" r="8.6" fill={`url(#${id}-hand)`} stroke="#B8A574" strokeOpacity=".6" strokeWidth="1" /><circle cx="22.4" cy="-4" r="3.4" fill={`url(#${id}-hand)`} /><g className="pl-lens"><circle cx="30" cy="-12" r="9" fill="#FBF8F1" fillOpacity=".55" stroke="#0F2A1D" strokeWidth="2.8" /><path d="M23.6 -5.6 L19 -1" stroke="#0F2A1D" strokeWidth="3.2" strokeLinecap="round" /></g></g></g>

            {/* body: a soft squircle dumpling with a folded top-left corner */}
            <path d="M56 40 C72 36 96 35 112 40 C131 47 139 70 139 96 C139 131 120 149 80 149 C40 149 21 131 21 98 C21 90 21 80 23 72 Z" fill={`url(#${id}-body)`} stroke="#B8A574" strokeOpacity=".55" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M56 40 C72 36 96 35 112 40 C131 47 139 70 139 96 C139 131 120 149 80 149 C40 149 21 131 21 98 C21 90 21 80 23 72 Z" fill={`url(#${id}-shade)`} />
            <path d="M104 46 Q125 51 132 72" fill="none" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="80" cy="139" rx="30" ry="6" fill="#FFFDF6" opacity=".35" />

            {/* the folded corner: Pilo's ear */}
            <g className="pl-flap"><path d="M23 72 L56 40 L56 72 Z" fill={`url(#${id}-flap)`} stroke="#B8A574" strokeOpacity=".6" strokeWidth="1.2" strokeLinejoin="round" /><path d="M23 72 L56 40" stroke="#0F2A1D" strokeOpacity=".16" strokeWidth="2" strokeLinecap="round" /></g>

            {/* face (slides a little toward the gaze: a cheap head turn) */}
            <g className="pl-face">
              <g className="pl-cheeks"><ellipse cx="40" cy="116" rx="8" ry="5" fill="#7C3AED" opacity=".2" /><ellipse cx="120" cy="116" rx="8" ry="5" fill="#7C3AED" opacity=".2" /></g>
              <g className="pl-eyes" style={blinkDelay ? { animationDelay: `${blinkDelay}s` } : undefined}>
                {arch ? <><ArchEye x={58} /><ArchEye x={102} /></> : <><Eye x={58} id={id} /><Eye x={102} id={id} wink={mood === "wink"} /></>}
              </g>
              <g className="pl-brows" fill="none" stroke="#0F2A1D" strokeWidth="4.6" strokeLinecap="round">
                <g className="pl-brow pl-brow-l"><path d="M48 77 Q58 71 68 76" /></g>
                <g className="pl-brow pl-brow-r"><path d="M92 76 Q102 71 112 77" /></g>
              </g>
              <g className="pl-mouth"><Mouth mood={mood} /></g>
            </g>
          </g>
        </g>
      </g>

      {/* props, each shown only for its mood */}
      <g className="pl-prop pl-dots" fill="#7C3AED"><circle cx="116" cy="38" r="2.6" /><circle cx="127" cy="28" r="3.4" /><circle cx="140" cy="18" r="4.4" /></g>
      <g className="pl-prop pl-spark" fill="#7C3AED"><path d="M24 46 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4z" /><path d="M134 50 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><circle cx="30" cy="120" r="2.6" fill="#2D6A4F" /><circle cx="132" cy="124" r="2.6" fill="#2D6A4F" /></g>
      <text className="pl-prop pl-q" x="124" y="40" fontSize="26" fontWeight="800" fill="#7C3AED">?</text>
      <g className="pl-prop pl-zzz" fill="#2D6A4F" fontWeight="800"><text x="118" y="52" fontSize="15">z</text><text x="128" y="38" fontSize="19">z</text><text x="140" y="22" fontSize="23">z</text></g>
      <path className="pl-prop pl-drop" d="M118 60 q-4 7 0 11 q4 -4 0 -11z" fill="#7C3AED" fillOpacity=".5" />
    </svg>
  );
}
