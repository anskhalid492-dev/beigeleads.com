import { BadgeCheck, Boxes, Compass, Database, FileDown, Layers, ListChecks, Search, type LucideIcon } from "lucide-react";

const steps: { icon: LucideIcon; t: string; d: string; purpose: string; v: "bars" | "scan" | "drop" | "rows" | "magnify" | "check" | "stack" | "slide" }[] = [
  { icon: Compass, t: "Market and category research", d: "We choose which category and country to build next. Requests sent through the request-a-category page help us decide.", purpose: "Build lists people actually need.", v: "bars" },
  { icon: Search, t: "Source identification", d: "For each category we decide which of our source types fit it best, from public listings and company websites to registries and directories.", purpose: "Start from sources that suit the category.", v: "scan" },
  { icon: Database, t: "Data collection", d: "Our team gathers raw records from those sources, using a mix of automated collection from public pages, licensed data, surveys and manual research.", purpose: "Get the raw material.", v: "drop" },
  { icon: Layers, t: "Data organization", d: "We fill in missing basics, standardise formats and remove duplicates so one business appears once. We also look for missing details such as owners, tech stack and email addresses.", purpose: "Turn raw records into one clean record.", v: "rows" },
  { icon: ListChecks, t: "Data quality checks", d: "Records are checked for consistency and gaps, then tagged by category, country, city and size so you can buy exactly the slice you need.", purpose: "Make the list usable and filterable.", v: "magnify" },
  { icon: BadgeCheck, t: "Email verification, where applicable", d: "Where a record has an email, our in-house team runs an SMTP check. Addresses that fail are corrected or dropped.", purpose: "Cut dead addresses before you send.", v: "check" },
  { icon: Boxes, t: "Database preparation", d: "Opted-out contacts are removed, the file is built, a masked sample is made, and the last-verified date is recorded on the list page.", purpose: "Package a file you can inspect first.", v: "stack" },
  { icon: FileDown, t: "Delivery to customers", d: "You pay once, and a download link arrives by email. The file is yours to use under the lawful use policy.", purpose: "Get the list into your hands.", v: "slide" },
];

function Visual({ v }: { v: (typeof steps)[number]["v"] }) {
  const c = "var(--color-forest-300)";
  return (
    <svg viewBox="0 0 56 32" className="h-8 w-14" aria-hidden fill="none">
      {v === "bars" && [6, 20, 34, 48].map((x, i) => <rect key={x} x={x - 3} y="6" width="6" height="22" rx="2" fill={c} className="v-bar" style={{ animationDelay: `${i * 0.25}s` }} />)}
      {v === "scan" && <><rect x="4" y="8" width="48" height="16" rx="3" stroke={c} strokeOpacity=".5" /><rect x="8" y="6" width="4" height="20" rx="2" fill={c} className="v-scan" /></>}
      {v === "drop" && <><rect x="12" y="22" width="32" height="6" rx="2" stroke={c} strokeOpacity=".6" />{[18, 28, 38].map((x, i) => <circle key={x} cx={x} cy="10" r="2.5" fill={c} className="v-drop" style={{ animationDelay: `${i * 0.5}s` }} />)}</>}
      {v === "rows" && [8, 15, 22].map((y, i) => <rect key={y} x="6" y={y} width="44" height="4" rx="2" fill={c} fillOpacity={0.9 - i * 0.2} className="v-scan" style={{ animationDelay: `${i * 0.3}s` }} />)}
      {v === "magnify" && <g className="v-scan"><circle cx="18" cy="14" r="7" stroke={c} strokeWidth="2" /><path d="M23 19l6 6" stroke={c} strokeWidth="2" strokeLinecap="round" /></g>}
      {v === "check" && <><rect x="8" y="6" width="40" height="20" rx="3" stroke={c} strokeOpacity=".6" /><path d="M20 16l6 6 10-11" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="v-check" /></>}
      {v === "stack" && [20, 14, 8].map((y, i) => <rect key={y} x={10 + i * 3} y={y} width="30" height="8" rx="2" fill={c} fillOpacity={0.5 + i * 0.25} className="v-slide" style={{ animationDelay: `${i * 0.25}s` }} />)}
      {v === "slide" && <g className="v-slide"><path d="M8 16h34M34 8l8 8-8 8" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></g>}
    </svg>
  );
}

/** 8-stage workflow: 4x2 horizontal timeline on desktop, vertical timeline on mobile. */
export function ProcessTimeline() {
  return (
    <ol className="relative grid gap-x-6 gap-y-12 pl-10 sm:pl-12 lg:grid-cols-4 lg:gap-y-16 lg:pl-0">
      <span aria-hidden className="absolute bottom-2 left-[1.15rem] top-2 w-px bg-forest-300/30 sm:left-[1.4rem] lg:hidden" />
      {steps.map((s, i) => (
        <li key={s.t} className="reveal relative lg:pt-1">
          {/* connector for the desktop rows */}
          {i % 4 !== 3 && <span aria-hidden className="absolute left-[3.2rem] right-[-1.5rem] top-[1.45rem] hidden h-px bg-forest-300/30 lg:block" />}
          <span className="absolute -left-10 top-0 grid size-9 place-items-center rounded-full bg-forest-300 text-sm font-bold text-forest-900 sm:-left-12 sm:size-11 sm:text-base lg:static lg:size-12">{i + 1}</span>
          <div className="mt-0 lg:mt-5">
            <div className="flex items-center gap-3">
              <s.icon className="size-5 text-forest-300" aria-hidden />
              <Visual v={s.v} />
            </div>
            <h3 className="display mt-3 text-2xl text-sand-50">{s.t}</h3>
            <p className="mt-2 text-sand-200">{s.d}</p>
            <p className="mt-3 text-sm font-semibold text-forest-300">Purpose: {s.purpose}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
