"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronLeft } from "lucide-react";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { childHref, industryChildren, type TaxGroup } from "@/lib/taxonomy";

type Named = { slug: string; name: string };
type Props = { tax: TaxGroup[]; industries: Named[]; onNavigate: () => void };

/** Short tile titles by category slug. Admin-created categories fall back to their menu name. */
const SHORT: Record<string, string> = {
  "email-lists": "Email Lists", "phone-number-lists": "Phone Lists", "whatsapp-number-lists": "WhatsApp Lists", "job-title-lists": "Job Titles",
  "job-function-lists": "Job Functions", "industry-databases": "Industries", "geographic-databases": "Locations",
};
const label = (g: TaxGroup) => SHORT[g.slug] ?? g.menuName ?? g.name;
const kidsOf = (g: TaxGroup, industries: Named[], tax: TaxGroup[]) => (g.slug === "industry-databases" ? industryChildren(industries, tax) : g.children);
const MAX = 6;
const ring = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/**
 * In-place drill-down: category grid <-> subcategory list. The width never changes; the outgoing pane leaves
 * while the incoming one slides in (about 200 ms, off under reduced motion). Used by desktop island and mobile menu.
 */
function Drill({ tax, industries, onNavigate }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const [leaving, setLeaving] = useState<{ pane: number | null; dir: "f" | "b" } | null>(null);
  const [dir, setDir] = useState<"f" | "b">("f");
  const root = useRef<HTMLDivElement>(null);
  const done = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(done.current), []);

  const go = (to: number | null, d: "f" | "b") => {
    setLeaving({ pane: sel, dir: d });
    setDir(d);
    setSel(to);
    clearTimeout(done.current);
    done.current = setTimeout(() => setLeaving(null), 200);
    refocus.current = to === null ? `[data-tile="${sel}"]` : "[data-back]";
  };
  const refocus = useRef<string | null>(null);
  useEffect(() => {
    if (refocus.current) root.current?.querySelector<HTMLElement>(refocus.current)?.focus();
    refocus.current = null;
  }, [sel]);

  const tiles = (
    <ul className="grid grid-cols-2 gap-1.5" role="list">
      {tax.map((x, i) => (
        <li key={x.slug}>
          <button type="button" data-tile={i} onClick={() => go(i, "f")} onKeyDown={(e) => gridKey(e, i)}
            className={`group relative flex h-12 w-full items-center gap-2.5 overflow-hidden rounded-2xl border border-sand-200/80 bg-sand-100/70 px-2 text-left transition-[background-color,border-color,box-shadow] duration-200 hover:border-sand-300 hover:bg-white hover:shadow-[0_1px_0_rgba(15,42,29,0.04),0_6px_14px_-8px_rgba(15,42,29,0.25)] active:bg-sand-100 ${ring}`}>
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 text-sand-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-transform duration-200 group-hover:scale-105">
              <TaxIconSvg name={x.icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-forest-900">{label(x)}</span>
            <ArrowRight className="absolute right-2.5 size-3.5 -translate-x-1 text-purple-600 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );

  function gridKey(e: React.KeyboardEvent, i: number) {
    const to = e.key === "ArrowDown" ? i + 2 : e.key === "ArrowUp" ? i - 2 : e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tax.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    if (to < tax.length) root.current?.querySelector<HTMLElement>(`[data-tile="${to}"]`)?.focus();
  }

  const subPane = (n: number) => {
    const g = tax[n];
    if (!g) return null;
    const kids = kidsOf(g, industries, tax);
    const link = `flex min-h-10 items-center justify-between rounded-xl px-3 text-sm text-forest-900 transition-colors duration-150 hover:bg-white ${ring}`;
    return (
      <div onKeyDown={(e) => { if (e.key === "Escape" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); go(null, "b"); } }}>
        <div className="flex items-center gap-2">
          <button type="button" data-back aria-label="Back to all list types" onClick={() => go(null, "b")} className={`grid size-9 shrink-0 place-items-center rounded-full border border-sand-200 bg-white text-forest-900 transition hover:-translate-x-0.5 hover:border-purple-600 hover:text-purple-700 ${ring}`}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-forest-700 to-forest-900 text-sand-50"><TaxIconSvg name={g.icon} className="size-4" /></span>
          <p className="display truncate text-xl text-forest-900">{label(g)}</p>
        </div>
        <ul className="mt-2 space-y-0.5">
          {kids.slice(0, MAX).map((c, k) => (
            <li key={c.slug} className="mega-item" style={{ ["--i" as string]: k }}>
              <Link href={childHref(g, c)} onClick={onNavigate} className={`group/l ${link}`}>
                <span className="truncate">{c.name}</span>
                <ArrowRight className="size-3.5 shrink-0 -translate-x-1 text-purple-600 opacity-0 transition duration-200 group-hover/l:translate-x-0 group-hover/l:opacity-100 group-focus-visible/l:translate-x-0 group-focus-visible/l:opacity-100" aria-hidden />
              </Link>
            </li>
          ))}
          <li className="mega-item mt-1 border-t border-sand-200/80 pt-1" style={{ ["--i" as string]: Math.min(kids.length, MAX) }}>
            <Link href={`/lists/${g.slug}`} onClick={onNavigate} className={`${link} font-semibold`}>View all <ArrowRight className="size-3.5 text-purple-600" aria-hidden /></Link>
          </li>
        </ul>
      </div>
    );
  };

  const pane = (n: number | null) => (n === null ? tiles : subPane(n));
  return (
    <div ref={root} className="relative overflow-hidden">
      {leaving && <div aria-hidden inert className={`absolute inset-x-0 top-0 ${leaving.dir === "f" ? "isl-out-f" : "isl-out-b"}`}>{pane(leaving.pane)}</div>}
      <div key={sel ?? "grid"} className={leaving ? (dir === "f" ? "isl-in-f" : "isl-in-b") : ""}>{pane(sel)}</div>
    </div>
  );
}

const footer = `group/all flex min-h-11 items-center justify-between rounded-2xl px-3 text-sm font-semibold text-forest-900 transition-colors duration-200 hover:bg-sand-100 ${ring}`;

/** Desktop floating island: one compact card (max 420 px), drill-down in place, one footer row. */
export function ListsMegaPanel(p: Props) {
  return (
    <div id="menu-lists" className="mega-in w-[min(24.5rem,calc(100vw-2rem))] max-w-[26.25rem] rounded-[1.75rem] border border-sand-200 bg-gradient-to-b from-sand-50 to-sand-100 p-2.5 shadow-[0_2px_4px_rgba(15,42,29,0.04),0_14px_32px_-10px_rgba(15,42,29,0.22),0_36px_64px_-28px_rgba(15,42,29,0.3)]">
      <Drill {...p} />
      <div className="mt-2 border-t border-sand-200/80 pt-1.5">
        <Link href="/lists" onClick={p.onNavigate} className={footer}>
          Explore All Lists <ArrowRight className="size-4 text-purple-600 transition-transform duration-200 group-hover/all:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

/** Mobile: the same drill-down inside an expandable "Lists" row. */
export function ListsMobile(p: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="m-lists" onClick={() => setOpen((v) => !v)} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 hover:bg-sand-100 ${ring}`}>
        Lists <ChevronDown className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="m-lists" className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="rounded-3xl bg-gradient-to-b from-sand-50 to-sand-100 p-2" inert={!open}>
            {open && <Drill {...p} />}
            <div className="mt-2 border-t border-sand-200/80 pt-1.5"><Link href="/lists" onClick={p.onNavigate} className={footer}>Explore All Lists <ArrowRight className="size-4 text-purple-600" aria-hidden /></Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
