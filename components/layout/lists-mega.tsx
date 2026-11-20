"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Briefcase, Building2, ChevronDown, Globe2, Landmark, Mail, Map as MapIcon, Network, Phone, Users, type LucideIcon } from "lucide-react";
import { WhatsApp } from "@/components/lists/tax-icon";
import { childHref, industryChildren, type TaxChild, type TaxGroup } from "@/lib/taxonomy";

/**
 * BeigeLeads Data Atlas: the Lists menu.
 * Three INDEPENDENT ways to find contact data (channel, audience, geography), all visible at once and joined by one
 * thread. Hover or focus a category and a one-line preview of its real subcategories appears in a reserved slot
 * under it (the panel never changes size). Every link points at an existing route; a category is hidden when its
 * taxonomy group is unpublished, so the menu can never link to a missing page.
 */
type Named = { slug: string; name: string };
type Props = { tax: TaxGroup[]; industries: Named[]; onNavigate: () => void };
type PLink = { label: string; href: string };
type Preview = { links: PLink[]; note?: string };
type Node = { key: string; title: string; icon: LucideIcon; href: string; group: string; preview: (tax: TaxGroup[], ind: Named[]) => Preview };
type Dim = { key: string; label: string; hint: string; nodes: Node[] };

const short = (n: string) => n.replace(/ (Email Lists|Contacts)$/, "");
function kids(tax: TaxGroup[], ind: Named[], slug: string): Preview {
  const g = tax.find((x) => x.slug === slug);
  if (!g) return { links: [] };
  const list: TaxChild[] = slug === "industry-databases" ? industryChildren(ind, tax) : g.children;
  const links = list.filter((c) => c.published !== false && c.compliance !== "consumer").slice(0, 5).map((c) => ({ label: short(c.name), href: childHref(g, c) }));
  return { links };
}
const GEO = "geographic-databases";
const DIMS: Dim[] = [
  {
    key: "channel", label: "Contact channel", hint: "How you reach them",
    nodes: [
      { key: "email", title: "Email Lists", icon: Mail, href: "/lists/email-lists", group: "email-lists", preview: (t, i) => kids(t, i, "email-lists") },
      { key: "phone", title: "Phone Number Lists", icon: Phone, href: "/lists/phone-number-lists", group: "phone-number-lists", preview: (t, i) => kids(t, i, "phone-number-lists") },
      { key: "whatsapp", title: "WhatsApp Lists", icon: WhatsApp as unknown as LucideIcon, href: "/lists/whatsapp-number-lists", group: "whatsapp-number-lists", preview: (t, i) => kids(t, i, "whatsapp-number-lists") },
    ],
  },
  {
    key: "audience", label: "Target audience", hint: "Who they are",
    nodes: [
      { key: "titles", title: "Job Titles", icon: Briefcase, href: "/lists/job-title-lists", group: "job-title-lists", preview: (t, i) => kids(t, i, "job-title-lists") },
      { key: "functions", title: "Job Functions", icon: Network, href: "/lists/job-function-lists", group: "job-function-lists", preview: (t, i) => kids(t, i, "job-function-lists") },
      { key: "levels", title: "Management Levels", icon: Users, href: "/lists/management-levels", group: "management-levels", preview: (t, i) => kids(t, i, "management-levels") },
      { key: "industries", title: "Industry Databases", icon: Building2, href: "/lists/industry-databases", group: "industry-databases", preview: (t, i) => kids(t, i, "industry-databases") },
    ],
  },
  {
    key: "geography", label: "Geography", hint: "Where they are",
    nodes: [
      {
        key: "countries", title: "Countries", icon: Globe2, href: `/lists/${GEO}/browse-by-country`, group: GEO,
        preview: () => ({ links: [{ label: "United States", href: `/lists/${GEO}/browse-by-country` }, { label: "International databases", href: `/lists/${GEO}/international-business-databases` }, { label: "Request a country", href: "/custom-list" }] }),
      },
      { key: "regions", title: "States & Regions", icon: MapIcon, href: `/lists/${GEO}/browse-by-state-region`, group: GEO, preview: () => ({ links: [{ label: "All states and regions", href: `/lists/${GEO}/browse-by-state-region` }], note: "Places with recorded inventory" }) },
      { key: "cities", title: "Cities", icon: Landmark, href: `/lists/${GEO}/browse-by-city`, group: GEO, preview: () => ({ links: [{ label: "All cities", href: `/lists/${GEO}/browse-by-city` }], note: "Places with recorded inventory" }) },
    ],
  },
];

const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";
const shown = (tax: TaxGroup[], n: Node) => tax.some((g) => g.slug === n.group && g.menuVisible !== false && g.published !== false);
const dimsFor = (tax: TaxGroup[]) => DIMS.map((d) => ({ ...d, nodes: d.nodes.filter((n) => shown(tax, n)) })).filter((d) => d.nodes.length > 0);

/** Desktop panel, same width as the header container. */
export function ListsMegaPanel({ tax, industries, onNavigate }: Props) {
  const dims = dimsFor(tax);
  const [active, setActive] = useState(0);
  const [pv, setPv] = useState<{ d: number; key: string } | null>(null);
  const n = Math.max(dims.length, 1);
  return (
    <div id="menu-lists" className="mega-in overflow-hidden rounded-[1.75rem] border border-sand-200 bg-sand-50 shadow-[0_18px_44px_-20px_rgba(15,42,29,0.3)]" onMouseLeave={() => setPv(null)}>
      <div className="relative px-9 pb-2 pt-3">
        {/* The thread: a hairline through every dimension; the purple segment follows the active one. */}
        <span aria-hidden className="absolute bottom-3 left-[2.6rem] top-3 w-px bg-sand-300" />
        <span aria-hidden className="absolute left-[2.6rem] top-3 w-0.5 -translate-x-px rounded-full bg-purple-600 transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ height: `calc((100% - 1.5rem) / ${n})`, transform: `translateY(${active * 100}%)` }} />
        {dims.map((d, di) => {
          const on = di === active;
          return (
            <section key={d.key} aria-label={d.label} onMouseEnter={() => setActive(di)} onFocus={() => setActive(di)} onMouseLeave={() => setPv((p) => (p && p.d === di ? null : p))}
              onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPv((p) => (p && p.d === di ? null : p)); }}
              className="relative grid grid-cols-[10.5rem_minmax(0,1fr)] gap-x-6 py-3.5 pl-9">
              <span aria-hidden className={`absolute left-0 top-[1.55rem] size-[0.7rem] -translate-x-[0.35rem] rounded-full border-2 transition-colors duration-200 ${on ? "border-purple-600 bg-purple-600" : "border-sand-300 bg-sand-50"}`} />
              <span aria-hidden className={`absolute left-1 top-[1.9rem] h-px w-6 transition-colors duration-200 ${on ? "bg-purple-600/60" : "bg-sand-300"}`} />
              <div className="pt-0.5">
                <h3 className={`display text-[1.05rem] leading-tight transition-colors duration-200 ${on ? "text-forest-900" : "text-forest-500"}`}>{d.label}</h3>
                <p className="mt-0.5 text-[0.8rem] text-forest-700/70">{d.hint}</p>
              </div>
              <div className="min-w-0">
                <ul className="flex flex-wrap items-center gap-x-7 gap-y-1">
                  {d.nodes.map((nd) => (
                    <li key={nd.key}>
                      <Link href={nd.href} onClick={onNavigate} onMouseEnter={() => setPv({ d: di, key: nd.key })} onFocus={() => setPv({ d: di, key: nd.key })}
                        className={`group relative inline-flex items-center gap-2 py-1 text-[1.2rem] font-semibold leading-7 text-forest-900 transition-colors duration-200 hover:text-purple-700 focus-visible:text-purple-700 ${ring} after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-purple-600 after:transition-transform after:duration-200 hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none`}>
                        <nd.icon strokeWidth={1.6} className="size-[1.05rem] text-forest-500 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-purple-600" aria-hidden />
                        <span className="display whitespace-nowrap">{nd.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-1 min-h-6 text-[0.85rem] leading-6">
                  {pv && pv.d === di ? (() => {
                    const nd = d.nodes.find((x) => x.key === pv.key);
                    const p = nd?.preview(tax, industries);
                    if (!p) return null;
                    return (
                      <p key={pv.key} className="sub-in flex flex-wrap items-center gap-x-1 text-forest-700">
                        {p.note && <span className="mr-1 text-forest-700/70">{p.note}:</span>}
                        {p.links.map((l, i) => (
                          <span key={l.href + l.label} className="inline-flex items-center gap-1">
                            {i > 0 && <span aria-hidden className="text-sand-300">&middot;</span>}
                            <Link href={l.href} onClick={onNavigate} className={`rounded font-medium underline decoration-sand-300 underline-offset-4 transition-colors duration-150 hover:text-purple-700 hover:decoration-purple-600 ${ring}`}>{l.label}</Link>
                          </span>
                        ))}
                      </p>
                    );
                  })() : <span className="text-forest-700/45">Hover a category to preview</span>}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-sand-200 bg-sand-100/60 px-9 py-2.5">
        <Link href="/lists" onClick={onNavigate} className={`group/all inline-flex items-center gap-1.5 text-sm font-semibold text-forest-900 hover:text-purple-700 ${ring}`}>
          Explore All Lists <ArrowRight className="size-4 transition-transform duration-200 group-hover/all:translate-x-0.5" aria-hidden />
        </Link>
        <Link href="/custom-list" onClick={onNavigate} className={`group/cl inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-600 ${ring}`}>
          Custom List <ArrowRight className="size-4 transition-transform duration-200 group-hover/cl:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/** Mobile: stacked groups on one thread; each category can expand to show its subcategory links. */
export function ListsMobile({ tax, industries, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const dims = dimsFor(tax);
  const row = `flex min-h-11 items-center gap-3 rounded-xl px-2 text-[0.95rem] font-semibold text-forest-900 hover:bg-sand-100 ${ring}`;
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="m-lists" onClick={() => setOpen((v) => !v)} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 hover:bg-sand-100 ${ring}`}>
        Lists <ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="m-lists" className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-4 px-3 pb-2 pt-2" inert={!open}>
            {dims.map((d) => (
              <section key={d.key} aria-label={d.label} className="relative border-l border-sand-300 pl-4">
                <span aria-hidden className="absolute -left-[5px] top-1.5 size-2.5 rounded-full border-2 border-purple-600 bg-sand-50" />
                <h3 className="display text-base text-forest-900">{d.label}</h3>
                <p className="text-xs text-forest-700/70">{d.hint}</p>
                <ul className="mt-1">
                  {d.nodes.map((nd) => {
                    const p = nd.preview(tax, industries);
                    const isOpen = exp === nd.key;
                    return (
                      <li key={nd.key}>
                        <div className="flex items-center">
                          <Link href={nd.href} onClick={onNavigate} className={`${row} flex-1`}>
                            <nd.icon strokeWidth={1.6} className="size-[1.05rem] text-forest-500" aria-hidden /> {nd.title}
                          </Link>
                          <button type="button" aria-expanded={isOpen} aria-label={`${nd.title}: show subcategories`} onClick={() => setExp(isOpen ? null : nd.key)} className={`grid size-11 place-items-center rounded-xl text-forest-500 hover:bg-sand-100 ${ring}`}>
                            <ChevronDown className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                          </button>
                        </div>
                        {isOpen && (
                          <ul className="sub-in mb-1 ml-8 border-l border-sand-200 pl-3">
                            {p.links.map((l) => (
                              <li key={l.href + l.label}><Link href={l.href} onClick={onNavigate} className={`flex min-h-10 items-center rounded-lg px-2 text-sm text-forest-700 hover:bg-sand-100 ${ring}`}>{l.label}</Link></li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <div className="flex items-center justify-between border-t border-sand-200 pt-2">
              <Link href="/lists" onClick={onNavigate} className={`${row} text-sm`}>Explore All Lists <ArrowRight className="size-4" aria-hidden /></Link>
              <Link href="/custom-list" onClick={onNavigate} className={`${row} text-sm text-purple-700`}>Custom List <ArrowRight className="size-4" aria-hidden /></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
