import { usState } from "@/lib/us-states";
import {
  Car, Coffee, Croissant, Dumbbell, Factory, Fan, GraduationCap, Globe, Hammer, Hotel, Building2, Landmark, Cpu, Scissors, ShoppingBag,
  Snowflake, Stethoscope, Utensils, Wrench, Zap, Briefcase, type LucideIcon,
} from "lucide-react";

/**
 * Reusable visual identity for databases.
 * - Country databases: a real flag (inline SVG, no external requests).
 * - Industry / business-type databases: an industry icon chosen by category slug.
 * Add a new category or country by adding one entry to the maps below.
 * Brand logos (Instagram, YouTube, ...) are intentionally not bundled: no creator/platform lists exist yet.
 */

const sw = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

// lucide has no tooth glyph, so this one is drawn here.
function Tooth({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden {...sw}>
      <path d="M12 6.2C10.6 4.8 8.7 4 7 4.4 4.6 5 3.8 7.4 4.3 9.8c.4 2 1 3.4 1.5 5.2.5 2 .8 5 2.2 5 1.7 0 1.5-3.6 2.6-5 .5-.6 1-.8 1.4-.8s.9.2 1.4.8c1.1 1.4.9 5 2.6 5 1.4 0 1.7-3 2.2-5 .5-1.8 1.1-3.2 1.5-5.2.5-2.4-.3-4.8-2.7-5.4-1.7-.4-3.6.4-5 1.8Z" />
    </svg>
  );
}

type IconCmp = LucideIcon | typeof Tooth;

const industry: Record<string, { Icon: IconCmp; label: string }> = {
  dentists: { Icon: Tooth, label: "Dentistry" },
  healthcare: { Icon: Stethoscope, label: "Healthcare" },
  restaurants: { Icon: Utensils, label: "Restaurants" },
  "ski-shops": { Icon: Snowflake, label: "Ski shops" },
  construction: { Icon: Hammer, label: "Construction" },
  "real-estate": { Icon: Building2, label: "Real estate" },
  finance: { Icon: Landmark, label: "Finance" },
  education: { Icon: GraduationCap, label: "Education" },
  technology: { Icon: Cpu, label: "Technology" },
  manufacturing: { Icon: Factory, label: "Manufacturing" },
  hospitality: { Icon: Hotel, label: "Hospitality" },
  hotels: { Icon: Hotel, label: "Hotels" },
  automotive: { Icon: Car, label: "Automotive" },
  beauty: { Icon: Scissors, label: "Beauty" },
  plumbers: { Icon: Wrench, label: "Plumbing" },
  electricians: { Icon: Zap, label: "Electrical" },
  hvac: { Icon: Fan, label: "HVAC" },
  bakeries: { Icon: Croissant, label: "Bakeries" },
  cafes: { Icon: Coffee, label: "Cafes" },
  gyms: { Icon: Dumbbell, label: "Fitness" },
  retail: { Icon: ShoppingBag, label: "Retail" },
};

export function IndustryIcon({ slug, className = "size-5" }: { slug: string; className?: string }) {
  const { Icon } = industry[slug] ?? { Icon: Briefcase };
  return <Icon className={className} aria-hidden />;
}

const F = ({ children, code }: { children: React.ReactNode; code: string }) => (
  <svg viewBox="0 0 30 20" className="h-full w-full" role="img" aria-label={`${code} flag`}>
    <defs>
      <clipPath id={`fc-${code}`}>
        <rect width="30" height="20" rx="2.5" />
      </clipPath>
    </defs>
    <g clipPath={`url(#fc-${code})`}>{children}</g>
    <rect width="30" height="20" rx="2.5" fill="none" stroke="rgba(15,42,29,0.25)" />
  </svg>
);

const jack = (
  <>
    <rect width="30" height="20" fill="#012169" />
    <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
    <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="1.6" />
    <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
    <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.4" />
  </>
);

const flags: Record<string, () => React.ReactNode> = {
  US: () => (
    <F code="US">
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} y={(i * 20) / 13} width="30" height={20 / 13} fill="#B22234" />
      ))}
      <rect width="13" height={(20 * 7) / 13} fill="#3C3B6E" />
      {[0, 1, 2, 3].flatMap((r) => [0, 1, 2, 3, 4].map((c) => <circle key={`${r}${c}`} cx={2 + c * 2.3} cy={1.8 + r * 2.5} r="0.5" fill="#fff" />))}
    </F>
  ),
  GB: () => <F code="GB">{jack}</F>,
  DE: () => (
    <F code="DE">
      <rect width="30" height="7" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
      <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
    </F>
  ),
  FR: () => (
    <F code="FR">
      <rect width="10" height="20" fill="#0055A4" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#EF4135" />
    </F>
  ),
  CA: () => (
    <F code="CA">
      <rect width="30" height="20" fill="#fff" />
      <rect width="7.5" height="20" fill="#D52B1E" />
      <rect x="22.5" width="7.5" height="20" fill="#D52B1E" />
      <path d="M15 4l1.6 3.2 2-.8-.7 4.4 1.9-1.1.4 1.5-3.6 3.1.3 1.6-1.9-.4V17h-1V14.5l-1.9.4.3-1.6-3.6-3.1.4-1.5 1.9 1.1-.7-4.4 2 .8z" fill="#D52B1E" />
    </F>
  ),
  AU: () => (
    <F code="AU">
      <rect width="30" height="20" fill="#012169" />
      <g transform="scale(0.5)">{jack}</g>
      {[[7.5, 15], [22, 4], [26, 9], [22, 15], [18, 9]].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.2" fill="#fff" />
      ))}
    </F>
  ),
  CH: () => (
    <F code="CH">
      <rect width="30" height="20" fill="#D52B1E" />
      <path d="M13 4h4v5h5v4h-5v5h-4v-5H8V9h5z" fill="#fff" transform="translate(0 -0.5)" />
    </F>
  ),
};

export function Flag({ code, className = "h-4 w-6" }: { code: string; className?: string }) {
  const f = flags[code.toUpperCase()];
  if (!f) {
    const c = code.trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(c)) return <Globe className={className} aria-hidden />;
    // Every other country: its own flag file (flag-icons, MIT), static in /public/flags/c.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`/flags/c/${c}.svg`} alt={`${code.toUpperCase()} flag`} loading="lazy" className={`${className} inline-block shrink-0 rounded-[2px] object-cover`} />;
  }
  return <span className={`inline-block shrink-0 ${className}`}>{f()}</span>;
}

/**
 * Industry tile with an optional small country flag on the corner.
 * tone="dark" is for use on forest-coloured backgrounds.
 */
export function DbBadge({
  category,
  country,
  size = "md",
  tone = "light",
}: {
  category: string;
  country?: string;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
}) {
  const box = { sm: "size-9 rounded-xl", md: "size-12 rounded-2xl", lg: "size-16 rounded-2xl" }[size];
  const icon = { sm: "size-4", md: "size-6", lg: "size-8" }[size];
  const flag = { sm: "h-3 w-[18px]", md: "h-3.5 w-[21px]", lg: "h-[18px] w-[27px]" }[size];
  const colors = tone === "dark" ? "bg-forest-100 text-forest-900" : "bg-forest-900 text-forest-300";
  return (
    <span className={`relative inline-grid shrink-0 place-items-center ${box} ${colors}`}>
      <IndustryIcon slug={category} className={icon} />
      {country && (
        <span className="absolute -bottom-1 -right-1.5 rounded-[3px] bg-white p-px shadow-sm ring-1 ring-sand-300">
          <Flag code={country} className={flag} />
        </span>
      )}
    </span>
  );
}

/** A US state's own flag (static SVG in /public/flags/us). Falls back to nothing when the name is not a US state. */
export function StateFlag({ name, className = "h-4 w-6" }: { name: string; className?: string }) {
  const s = usState(name);
  if (!s) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/us/${s.slug}.svg`} alt={`${s.name} flag`} loading="lazy" className={`${className} rounded-[3px] object-contain`} />;
}
