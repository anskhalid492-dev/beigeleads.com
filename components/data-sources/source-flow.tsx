import { Building2, FileText, Globe, Landmark, MapPinned, ShoppingBag, Share2, ClipboardList } from "lucide-react";

/** Source types as described by the owner. The "200+" figure must be backed by a source register before launch (TODO-BEFORE-LAUNCH.md). */
const sources = [
  { icon: MapPinned, name: "Business listings and maps", text: "Public listings such as Google Maps profiles: name, address, phone, opening details." },
  { icon: Globe, name: "Company websites", text: "Contact pages, team pages and footers published by the business itself." },
  { icon: Landmark, name: "Public government registries", text: "Business and licence registers that are open to the public." },
  { icon: FileText, name: "Business directories", text: "Trade and local directories that publish business contact details." },
  { icon: ShoppingBag, name: "Licensed provider data", text: "Data we buy or license from providers, then check like everything else." },
  { icon: Share2, name: "Professional profiles and social handles", text: "Public professional profile pages and social handles that a business shows publicly." },
  { icon: ClipboardList, name: "Surveys", text: "Information businesses give us directly when we ask." },
  { icon: Building2, name: "Our own research", text: "Manual research by our team to fill gaps no automated source can." },
] as const;

const startX = [50, 165, 280, 395, 510, 625, 740, 855];

export function SourceFlow() {
  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sources.map((s) => (
          <li key={s.name} className="rounded-2xl border border-sand-200 bg-sand-50 p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-forest-100">
              <s.icon className="size-5 text-forest-700" aria-hidden />
            </span>
            <h3 className="mt-3 text-base font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm">{s.text}</p>
          </li>
        ))}
      </ul>

      <svg viewBox="0 0 905 150" className="mt-2 w-full" role="img" aria-label="Eight source types flowing into one cleaning pipeline">
        {startX.map((x, i) => (
          <path
            key={x}
            d={`M ${x} 0 C ${x} 70, 452 60, 452 118`}
            fill="none"
            stroke="var(--color-forest-500)"
            strokeWidth="2"
            strokeLinecap="round"
            className="flow-line"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
        <rect x="302" y="112" width="300" height="34" rx="17" fill="var(--color-forest-900)" />
        <text x="452" y="134" textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--color-sand-50)">
          One pipeline. One standard.
        </text>
      </svg>
    </div>
  );
}
