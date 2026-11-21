import { BadgeCheck, FileText, Globe, Landmark, MapPinned, Share2, ShoppingBag } from "lucide-react";

// Six of the eight source types the owner described (surveys and our own research are named in the caption).
const nodes = [
  { icon: MapPinned, label: "Business listings", x: 50, y: 11 },
  { icon: Globe, label: "Company websites", x: 84, y: 30 },
  { icon: Landmark, label: "Public registries", x: 84, y: 70 },
  { icon: FileText, label: "Directories", x: 50, y: 89 },
  { icon: ShoppingBag, label: "Licensed data", x: 16, y: 70 },
  { icon: Share2, label: "Public profiles", x: 16, y: 30 },
] as const;

/** Layered, animated picture of sources flowing into one checked list. Fictional record, masked. */
export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[34rem]" role="img" aria-label="Illustration: business listings, websites, registries, directories, licensed data and public profiles flow into one checked list">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(143,208,169,0.14)" strokeWidth="0.3" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(143,208,169,0.1)" strokeWidth="0.3" />
        {nodes.map((n, i) => (
          <g key={n.label}>
            <path d={`M ${n.x} ${n.y} L 50 50`} stroke="var(--color-forest-300)" strokeOpacity="0.55" strokeWidth="0.45" fill="none" strokeDasharray="1.6 1.6" className="flow-line" style={{ animationDelay: `${i * 120}ms` }} />
            <circle r="1.1" fill="var(--color-forest-300)" className="dot-move" style={{ offsetPath: `path("M ${n.x} ${n.y} L 50 50")`, animationDelay: `${i * 0.5}s` }} />
          </g>
        ))}
      </svg>

      {/* Centre: the finished list */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span aria-hidden className="ring-out absolute inset-0 rounded-full border border-forest-300" />
        <span aria-hidden className="ring-out absolute inset-0 rounded-full border border-forest-300" style={{ animationDelay: "1.4s" }} />
        <div className="relative grid size-28 place-items-center rounded-full bg-forest-100 text-center text-forest-900 shadow-[0_0_60px_rgba(143,208,169,0.35)] sm:size-32">
          <div>
            <BadgeCheck className="mx-auto size-7" aria-hidden />
            <p className="display mt-1 text-lg leading-none">One list</p>
          </div>
        </div>
      </div>

      {nodes.map((n, i) => (
        <div key={n.label} className="floaty absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${i * 0.6}s` }}>
          <span className="mx-auto grid size-11 place-items-center rounded-full border border-white/15 bg-forest-700 text-forest-100 sm:size-12">
            <n.icon className="size-5" aria-hidden />
          </span>
          <span className="mt-1.5 block whitespace-nowrap text-[0.7rem] text-sand-200 sm:text-xs">{n.label}</span>
        </div>
      ))}

      {/* Floating cards, moving at different speeds on scroll */}
      <div className="parallax-up absolute -right-2 top-[2%] hidden w-44 rounded-2xl border border-white/15 bg-forest-900/90 p-3 text-xs shadow-xl backdrop-blur sm:block">
        <p className="font-semibold text-sand-50">Record check</p>
        <p className="mt-1 text-sand-300">Illustration, masked</p>
        <dl className="mt-2 space-y-1 text-sand-100">
          <div className="flex justify-between gap-2"><dt className="text-sand-300">Email</dt><dd>j***@•••••.com</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-sand-300">SMTP</dt><dd className="text-forest-300">accepted</dd></div>
        </dl>
      </div>
      <div className="parallax-down absolute bottom-[3%] left-0 hidden rounded-2xl border border-white/15 bg-forest-900/90 px-4 py-3 text-xs shadow-xl backdrop-blur sm:block">
        <p className="font-semibold text-sand-50">Re-checked every 90 days</p>
        <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full w-2/3 rounded-full bg-forest-300" />
        </div>
      </div>
    </div>
  );
}
