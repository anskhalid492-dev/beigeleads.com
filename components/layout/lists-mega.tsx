"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Briefcase, Building2, ChevronDown, ChevronLeft, Crown, Home, Mail, MapPin, Network, Phone, Stethoscope, Store, Users, type LucideIcon } from "lucide-react";
import { LinkedInMark, WhatsApp } from "@/components/lists/tax-icon";
import { childHref, industryChildren, type TaxChild, type TaxGroup } from "@/lib/taxonomy";

type Named = { slug: string; name: string };
type Props = { tax: TaxGroup[]; industries: Named[]; onNavigate: () => void };

/**
 * The nine entries of the Lists menu (three columns of three). Each one points at an EXISTING landing page.
 * `group` is the taxonomy group it belongs to: an entry is hidden when that group is unpublished or not in the menu,
 * so the menu can never link to a page that does not exist. `kids` narrows the subcategories shown on mobile.
 */
type Item = { key: string; title: string; desc: string; icon: LucideIcon; href: string; group: string; kids?: string[] };
const COLUMNS: Item[][] = [
  [
    { key: "business", title: "Business Email Lists", desc: "Verified business emails", icon: Mail, href: "/lists/business-email-lists", group: "business-email-lists" },
    { key: "consumer", title: "Consumer Email Lists", desc: "Consumer emails by country", icon: Users, href: "/lists/consumer-email-lists", group: "consumer-email-lists" },
    { key: "phone", title: "Phone Number Lists", desc: "Business phone numbers", icon: Phone, href: "/lists/phone-number-lists", group: "phone-number-lists" },
    { key: "local", title: "Local Businesses Database", desc: "Shops, clinics and local trades", icon: Store, href: "/lists/local-businesses-database", group: "" },
  ],
  [
    { key: "titles", title: "Job Title Lists", desc: "Decision-makers by role", icon: Briefcase, href: "/lists/job-title-lists", group: "job-title-lists" },
    { key: "whatsapp", title: "WhatsApp Numbers List", desc: "WhatsApp business contacts", icon: WhatsApp as unknown as LucideIcon, href: "/lists/whatsapp-number-lists", group: "whatsapp-number-lists" },
    { key: "levels", title: "Management Levels", desc: "Executives to managers", icon: Crown, href: "/lists/management-levels", group: "management-levels" },
    { key: "realestate", title: "Real Estate Lists", desc: "Agencies, agents and brokers", icon: Home, href: "/lists/industry-databases/real-estate", group: "" },
  ],
  [
    { key: "places", title: "State & Cities", desc: "Location-specific lists", icon: MapPin, href: "/lists/geographic-databases/browse-by-state-region", group: "geographic-databases", kids: ["browse-by-state-region", "browse-by-city"] },
    { key: "functions", title: "Job Functions", desc: "Teams by department", icon: Network, href: "/lists/job-function-lists", group: "job-function-lists" },
    { key: "health", title: "Healthcare Lists", desc: "Doctors, dentists and clinics", icon: Stethoscope, href: "/lists/healthcare-lists", group: "healthcare-lists" },
    { key: "linkedin", title: "LinkedIn Lists Databases", desc: "Professionals from LinkedIn", icon: LinkedInMark as unknown as LucideIcon, href: "/lists/linkedin-lists-databases", group: "" },
  ],
];

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const visible = (tax: TaxGroup[], i: Item) => i.group === "" || tax.some((g) => g.slug === i.group && g.menuVisible !== false && g.published !== false);

/** The four ways to browse, shown by the animated intro block. Words and icons move in step (CSS only). */
const WAYS: { word: string; icon: LucideIcon }[] = [
  { word: "channel", icon: Mail },
  { word: "job title", icon: Briefcase },
  { word: "industry", icon: Building2 },
  { word: "location", icon: MapPin },
];

/** Desktop: animated intro block on the left, three columns of categories on the right. */
export function ListsMegaPanel({ tax, onNavigate }: Props) {
  return (
    <div id="menu-lists" className="mega-in grid overflow-hidden rounded-[1.6rem] border border-sand-200 bg-sand-50 shadow-[0_14px_36px_-22px_rgba(15,42,29,0.3)] lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="relative flex flex-col overflow-hidden border-r border-sand-200 bg-sand-100 px-7 py-7">
        <span aria-hidden className="intro-glow pointer-events-none absolute -bottom-12 -right-12 size-44 rounded-full bg-purple-100 opacity-80 blur-2xl" />
        <h3 className="display intro-rise relative text-[1.7rem] leading-[1.05] text-forest-900" style={{ "--d": 0 } as React.CSSProperties}>
          Find the prospects that <span className="relative inline-block">fit.<span aria-hidden className="intro-draw absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full bg-purple-600" /></span>
        </h3>
        <p className="intro-rise relative mt-3 flex items-baseline gap-1.5 text-[0.95rem] text-forest-700" style={{ "--d": 1 } as React.CSSProperties}>
          Browse by
          <span className="relative block h-6 overflow-hidden font-bold text-forest-900" aria-hidden>
            <span className="intro-roll block">
              {[...WAYS, WAYS[0]].map((w, i) => <span key={i} className="block h-6 leading-6">{w.word}</span>)}
            </span>
          </span>
          <span className="sr-only">channel, job title, industry or location</span>
        </p>
        <div className="intro-rise relative mt-3 flex gap-2" aria-hidden style={{ "--d": 2 } as React.CSSProperties}>
          {WAYS.map((w, i) => (
            <span key={w.word} className="intro-lit grid size-8 place-items-center rounded-full border" style={{ "--i": i } as React.CSSProperties}>
              <w.icon strokeWidth={1.7} className="size-4" />
            </span>
          ))}
        </div>
        <p className="intro-rise relative mt-3 text-[0.8rem] leading-5 text-forest-700/80" style={{ "--d": 3 } as React.CSSProperties}>Masked sample on every list page.</p>
        <div className="intro-rise relative mt-auto flex flex-col items-start gap-2 pt-5" style={{ "--d": 4 } as React.CSSProperties}>
          <Link href="/lists" onClick={onNavigate} className={`group/all inline-flex items-center gap-2 rounded-full bg-purple-600 px-[1.1rem] py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgba(124,58,237,0.7)] transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-purple-700 ${ring}`}>
            Browse all lists <ArrowRight className="size-4 transition-transform duration-200 group-hover/all:translate-x-0.5" aria-hidden />
          </Link>
          <Link href="/custom-list" onClick={onNavigate} className={`group/cl inline-flex items-center gap-2 rounded-full border border-forest-900/25 bg-white px-[1.1rem] py-2.5 text-sm font-semibold text-forest-900 transition-[border-color,color,transform] duration-200 hover:-translate-y-0.5 hover:border-purple-600 hover:text-purple-700 ${ring}`}>
            Or build a custom list <ArrowRight className="size-4 transition-transform duration-200 group-hover/cl:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3">
        {COLUMNS.map((col, c) => (
          <ul key={c} className="flex flex-col justify-center gap-5 py-7 pl-6 pr-3">
            {col.filter((i) => visible(tax, i)).map((i) => (
              <li key={i.key}>
                <Link href={i.href} onClick={onNavigate} className={`group flex gap-3.5 rounded-xl ${ring}`}>
                  <span className="grid size-[2.4rem] shrink-0 place-items-center rounded-full border border-sand-300 text-forest-700 transition-[transform,color,border-color] duration-200 group-hover:-translate-y-0.5 group-hover:border-purple-600 group-hover:text-purple-600">
                    <i.icon strokeWidth={1.6} className="size-[1.15rem]" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center text-[0.97rem] font-bold leading-6 text-forest-900 transition-colors duration-200 group-hover:text-purple-700">
                      <span className="whitespace-nowrap">{i.title}</span>
                      <ArrowRight className="ml-1.5 size-4 w-0 -translate-x-1 overflow-visible opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" aria-hidden />
                    </span>
                    <span className="mt-0.5 block truncate text-[0.84rem] leading-5 text-forest-700/80">{i.desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Mobile: accordion. Lists > the nine entries > that entry's subcategories, with a back row. */
export function ListsMobile({ tax, industries, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Item | null>(null);
  const items = COLUMNS.flat().filter((i) => visible(tax, i));
  const group = sel ? tax.find((g) => g.slug === sel.group) : undefined;
  const kids: TaxChild[] = !group || !sel ? [] : (group.slug === "industry-databases" ? industryChildren(industries, tax) : group.children).filter((c) => !sel.kids || sel.kids.includes(c.slug));
  const row = `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] font-medium text-forest-900 hover:bg-sand-100 ${ring}`;
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="m-lists" onClick={() => { setOpen((v) => !v); setSel(null); }} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 hover:bg-sand-100 ${ring}`}>
        Lists <ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="m-lists" className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-1 pb-1" inert={!open}>
            {!sel ? (
              <ul className="sub-in">
                {items.map((i) => (
                  <li key={i.key}>
                    <button type="button" onClick={() => setSel(i)} className={row}>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-sand-300 text-forest-700"><i.icon strokeWidth={1.6} className="size-[1.1rem]" aria-hidden /></span>
                      <span className="flex-1">{i.title}</span>
                      <ArrowRight className="size-4 text-forest-500" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="sub-in">
                <button type="button" onClick={() => setSel(null)} className={`${row} text-forest-700`}><ChevronLeft className="size-4" aria-hidden /> Lists</button>
                <ul className="border-t border-sand-200 pt-1">
                  <li><Link href={sel.href} onClick={onNavigate} className={`${row} font-bold`}>{sel.title}</Link></li>
                  {kids.slice(0, 8).map((c) => group && <li key={c.slug}><Link href={childHref(group, c)} onClick={onNavigate} className={`${row} pl-6 text-forest-700`}>{c.name}</Link></li>)}
                </ul>
              </div>
            )}
            <div className="mt-1 border-t border-sand-200 pt-1">
              <Link href="/lists" onClick={onNavigate} className={`${row} font-semibold`}>Browse all lists <ArrowRight className="ml-auto size-4 text-forest-500" aria-hidden /></Link>
              <Link href="/custom-list" onClick={onNavigate} className={`${row} font-semibold`}>Build a custom list <ArrowRight className="ml-auto size-4 text-purple-600" aria-hidden /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
