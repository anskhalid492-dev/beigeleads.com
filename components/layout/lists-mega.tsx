"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronLeft } from "lucide-react";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { childHref, industryChildren, type TaxGroup } from "@/lib/taxonomy";

type Named = { slug: string; name: string };
type Props = { tax: TaxGroup[]; industries: Named[]; onNavigate: () => void };

const kidsOf = (g: TaxGroup, industries: Named[], tax: TaxGroup[]) => (g.slug === "industry-databases" ? industryChildren(industries, tax) : g.children);
const MAX = 7;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Desktop: seven categories in a 2-column grid (icon, short name, arrow). Hover/focus/click reveals a compact subcategory panel. */
export function ListsMegaPanel({ tax, industries, onNavigate }: Props) {
  const [active, setActive] = useState(-1);
  const hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const sub = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(hover.current), []);
  const g = active >= 0 ? tax[Math.min(active, tax.length - 1)] : null;
  const kids = g ? kidsOf(g, industries, tax) : [];
  const shown = kids.slice(0, MAX);
  const intent = (i: number) => { clearTimeout(hover.current); hover.current = setTimeout(() => setActive(i), 70); }; // tiny delay: diagonal moves do not flip the panel
  const move = (to: number) => { const i = Math.max(0, Math.min(tax.length - 1, to)); setActive(i); refs.current[i]?.focus(); };
  const key = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(i + 2 < tax.length ? i + 2 : i); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(i - 2 >= 0 ? i - 2 : i); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(i - 1); }
    else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (i % 2 === 0 && i + 1 < tax.length) move(i + 1);
      else { setActive(i); requestAnimationFrame(() => sub.current?.querySelector<HTMLElement>("a")?.focus()); }
    } else if (e.key === "Home") { e.preventDefault(); move(0); }
    else if (e.key === "End") { e.preventDefault(); move(tax.length - 1); }
  };
  const subKey = (e: React.KeyboardEvent) => {
    const links = Array.from(sub.current?.querySelectorAll<HTMLElement>("a") ?? []);
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); links[Math.min(links.length - 1, at + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); links[Math.max(0, at - 1)]?.focus(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); refs.current[active]?.focus(); }
  };

  return (
    <div id="menu-lists" className="mega-in w-fit max-w-full overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-xl">
      <div className="flex">
        <div className="w-[29rem] shrink-0 p-2.5" role="group" aria-label="List types">
          <ul className="grid grid-cols-2 gap-1">
            {tax.map((x, i) => (
              <li key={x.slug}>
                <button
                  ref={(el) => { refs.current[i] = el; }} type="button" aria-expanded={active === i} aria-controls="lists-sub"
                  onMouseEnter={() => intent(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} onKeyDown={(e) => key(e, i)}
                  className={`group flex h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left transition-colors duration-200 ${focusRing} ${active === i ? "bg-sand-100" : "hover:bg-sand-50"}`}
                >
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors duration-200 ${active === i ? "bg-forest-900 text-sand-50" : "bg-gradient-to-br from-forest-100 to-sand-100 text-forest-700"}`}>
                    <TaxIconSvg name={x.icon} className="size-[1.05rem] transition-transform duration-200 group-hover:scale-110" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-forest-900">{x.menuName}</span>
                  <ArrowRight className={`size-3.5 shrink-0 text-forest-500 transition duration-200 ${active === i ? "translate-x-0.5 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"}`} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={`overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none ${g ? "w-[17rem] border-l border-sand-200" : "w-0"}`}>
          <div id="lists-sub" ref={sub} onKeyDown={subKey} className="w-[17rem] p-2.5" aria-live="polite">
            {g && (
              <div key={g.slug} className="mega-sub">
                <Link href={`/lists/${g.slug}`} onClick={onNavigate} className={`mb-1 block rounded-lg px-2.5 py-1.5 text-sm font-bold text-forest-900 hover:bg-sand-50 ${focusRing}`}>{g.menuName}</Link>
                <ul>
                  {shown.map((c, n) => (
                    <li key={c.slug} className="mega-item" style={{ ["--i" as string]: n }}>
                      <Link href={childHref(g, c)} onClick={onNavigate} className={`block truncate rounded-lg px-2.5 py-1.5 text-sm text-forest-700 transition-colors duration-150 hover:bg-sand-100 hover:text-forest-900 ${focusRing}`}>{c.name}</Link>
                    </li>
                  ))}
                  {kids.length > MAX && (
                    <li className="mega-item" style={{ ["--i" as string]: MAX }}>
                      <Link href={`/lists/${g.slug}`} onClick={onNavigate} className={`block rounded-lg px-2.5 py-1.5 text-sm font-semibold text-forest-900 hover:bg-sand-100 ${focusRing}`}>View all</Link>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Link href="/lists" onClick={onNavigate} className={`group/all flex items-center justify-between border-t border-sand-200 bg-sand-50 px-5 py-2.5 text-sm font-semibold text-forest-900 transition-colors hover:bg-sand-100 ${focusRing}`}>
        Explore All Lists <ArrowRight className="size-4 transition-transform duration-200 group-hover/all:translate-x-1" aria-hidden />
      </Link>
    </div>
  );
}

/** Mobile: one compact accordion. Lists > categories > subcategories, with a back button. */
export function ListsMobile({ tax, industries, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const g = sel === null ? null : tax[sel];
  const row = `flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-forest-900 hover:bg-sand-100 ${focusRing}`;
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="m-lists" onClick={() => { setOpen((v) => !v); setSel(null); }} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 hover:bg-sand-100 ${focusRing}`}>
        Lists <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="m-lists" className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1 pt-1" inert={!open}>
            {!g ? (
              <>
                {tax.map((x, i) => (
                  <button key={x.slug} type="button" onClick={() => setSel(i)} className={row}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-forest-100 to-sand-100 text-forest-700"><TaxIconSvg name={x.icon} className="size-[1.05rem]" /></span>
                    <span className="flex-1">{x.menuName}</span>
                    <ArrowRight className="size-4 text-forest-500" aria-hidden />
                  </button>
                ))}
              </>
            ) : (
              <div key={g.slug} className="mega-sub">
                <button type="button" onClick={() => setSel(null)} className={`${row} text-forest-700`}><ChevronLeft className="size-4" aria-hidden /> Lists</button>
                <Link href={`/lists/${g.slug}`} onClick={onNavigate} className={`${row} font-bold`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-forest-900 text-sand-50"><TaxIconSvg name={g.icon} className="size-[1.05rem]" /></span>{g.menuName}
                </Link>
                <ul className="ml-[2.9rem] border-l border-sand-200 pl-1">
                  {kidsOf(g, industries, tax).slice(0, 10).map((c, n) => (
                    <li key={c.slug} className="mega-item" style={{ ["--i" as string]: n }}><Link href={childHref(g, c)} onClick={onNavigate} className={`${row} font-medium`}>{c.name}</Link></li>
                  ))}
                </ul>
              </div>
            )}
            <Link href="/lists" onClick={onNavigate} className={`${row} mt-1 border-t border-sand-200 rounded-t-none`}>Explore All Lists <ArrowRight className="ml-auto size-4" aria-hidden /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
