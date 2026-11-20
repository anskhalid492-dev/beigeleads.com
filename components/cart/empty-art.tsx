import type { CSSProperties } from "react";

/**
 * "Your next customers are waiting": contact cards drift toward a basket and drop in, one after another; the basket gives a little
 * under each landing. Pure CSS (see .cart-card / .cart-basket in globals.css), decorative only, motionless under reduced motion.
 * The card labels are illustrations of kinds of businesses, not a statement of what is for sale.
 */
const CARDS = [
  { tag: "Dentist", x: "-7.6rem", y: "-5.2rem", r: "-9deg", hue: "#D8EADF" },
  { tag: "Restaurant", x: "7.4rem", y: "-6.2rem", r: "8deg", hue: "#EDE4FD" },
  { tag: "Real estate", x: "-4.6rem", y: "-8.4rem", r: "5deg", hue: "#F4EEDF" },
  { tag: "Ski shop", x: "5.2rem", y: "-3.8rem", r: "-6deg", hue: "#D8EADF" },
] as const;

function Basket({ part }: { part: "back" | "front" }) {
  return (
    <svg viewBox="0 0 220 150" className={`cart-basket pointer-events-none absolute bottom-3 left-1/2 w-[13.5rem] -translate-x-1/2 ${part === "back" ? "z-[1]" : "z-[3]"}`} aria-hidden>
      {part === "back" ? (
        <>
          <path d="M58 54 C58 8 162 8 162 54" fill="none" stroke="#1B4332" strokeWidth="7" strokeLinecap="round" />
          <ellipse cx="110" cy="52" rx="82" ry="12" fill="#0F2A1D" />
        </>
      ) : (
        <>
          <path d="M28 52 H192 L172 134 Q170 142 160 142 H60 Q50 142 48 134 Z" fill="#1B4332" />
          <path d="M28 52 H192 L188 68 H32 Z" fill="#2D6A4F" opacity=".55" />
          {[72, 92, 112, 132].map((y) => <line key={y} x1={30 + (y - 52) * 0.2} x2={190 - (y - 52) * 0.2} y1={y} y2={y} stroke="#0F2A1D" strokeOpacity=".35" strokeWidth="2" />)}
          {[70, 95, 125, 150].map((x) => <line key={x} x1={x} x2={x + (x - 110) * 0.18} y1="68" y2="140" stroke="#0F2A1D" strokeOpacity=".25" strokeWidth="2" />)}
          <rect x="20" y="44" width="180" height="14" rx="7" fill="#2D6A4F" />
          <rect x="20" y="44" width="180" height="5" rx="2.5" fill="#D8EADF" opacity=".35" />
        </>
      )}
    </svg>
  );
}

export function EmptyArt() {
  return (
    <div className="relative mx-auto h-[19rem] w-full max-w-[26rem] select-none overflow-hidden" aria-hidden>
      <div className="absolute inset-x-8 bottom-0 top-6 rounded-[50%] bg-forest-100/60 blur-3xl" />
      {[["12%", "30%"], ["84%", "22%"], ["22%", "62%"], ["76%", "56%"], ["50%", "10%"]].map(([l, t], k) => (
        <span key={k} className="cart-spark absolute size-1.5 rounded-full bg-purple-600/50" style={{ left: l, top: t, "--k": k } as CSSProperties} />
      ))}
      <div className="absolute bottom-1 left-1/2 h-4 w-44 -translate-x-1/2 rounded-[50%] bg-forest-900/15 blur-md" />
      <Basket part="back" />
      {CARDS.map((c, k) => (
        <div key={c.tag} className="cart-card z-[2] rounded-xl border border-sand-200 bg-white p-2.5 shadow-[0_10px_24px_-14px_rgba(15,42,29,0.5)]" style={{ "--x": c.x, "--y": c.y, "--r": c.r, "--k": k } as CSSProperties}>
          <div className="flex items-center gap-2">
            <span className="size-6 shrink-0 rounded-full" style={{ background: c.hue }} />
            <span className="min-w-0 flex-1 space-y-1"><span className="block h-1.5 w-full rounded-full bg-sand-200" /><span className="block h-1.5 w-2/3 rounded-full bg-sand-200" /></span>
          </div>
          <span className="mt-2 inline-block rounded-full bg-forest-100 px-2 py-0.5 text-[0.65rem] font-semibold leading-4 text-forest-900">{c.tag}</span>
        </div>
      ))}
      <Basket part="front" />
    </div>
  );
}
