"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { childHref, industryChildren, type TaxGroup } from "@/lib/taxonomy";

type Named = { slug: string; name: string };
type Props = { tax: TaxGroup[]; industries: Named[]; onNavigate: () => void };

/** Row labels by category slug. Admin-created categories fall back to their menu name. */
const LABEL: Record<string, string> = {
  "email-lists": "Email Lists", "phone-number-lists": "Phone Number Lists", "whatsapp-number-lists": "WhatsApp Lists", "job-title-lists": "Job Title Lists",
  "job-function-lists": "Job Function Lists", "industry-databases": "Industry Lists", "geographic-databases": "Geographic Lists",
};
const label = (g: TaxGroup) => LABEL[g.slug] ?? g.menuName ?? g.name;
const kidsOf = (g: TaxGroup, industries: Named[], tax: TaxGroup[]) => (g.slug === "industry-databases" ? industryChildren(industries, tax) : g.children);
const MAX = 7;
const ring = "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-600";
const row = `group flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[0.9rem] font-medium text-forest-900 transition-colors duration-150 ${ring}`;

function Chevron({ on }: { on: boolean }) {
  return <ChevronRight className={`ml-auto size-3.5 shrink-0 text-forest-500 transition duration-150 ${on ? "translate-x-0.5 opacity-100" : "opacity-50 group-hover:translate-x-0.5 group-hover:opacity-100"}`} aria-hidden />;
}

function SubLinks({ g, kids, onNavigate, className = "" }: { g: TaxGroup; kids: ReturnType<typeof kidsOf>; onNavigate: () => void; className?: string }) {
  const link = `block truncate rounded-lg px-2.5 py-[0.4rem] text-sm text-forest-700 transition-colors duration-150 hover:bg-sand-100 hover:text-forest-900 ${ring}`;
  return (
    <ul className={className}>
      {kids.slice(0, MAX).map((c) => <li key={c.slug}><Link href={childHref(g, c)} onClick={onNavigate} className={link}>{c.name}</Link></li>)}
      <li className="mt-1 border-t border-sand-200 pt-1"><Link href={`/lists/${g.slug}`} onClick={onNavigate} className={`${link} font-semibold text-forest-900`}>View all</Link></li>
    </ul>
  );
}

/**
 * One slim column of category rows. Desktop (mouse): hover/focus/click opens a small flyout beside it.
 * Touch or mobile: tapping a row drills in place, with a back row.
 */
function Rows({ tax, industries, onNavigate, drill }: Props & { drill: boolean }) {
  const [active, setActive] = useState(-1);
  const [flip, setFlip] = useState(false);
  const hover = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const flyout = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(hover.current), []);
  const g = active >= 0 ? tax[active] : null;
  const kids = g ? kidsOf(g, industries, tax) : [];

  // Keep the flyout inside the viewport: open it to the left when there is no room on the right.
  useLayoutEffect(() => {
    if (drill || !g || !root.current) return;
    const r = root.current.getBoundingClientRect();
    setFlip(r.right + 6 + 232 > window.innerWidth - 8);
  }, [drill, g]);

  const focusRow = (i: number) => root.current?.querySelector<HTMLElement>(`[data-row="${i}"]`)?.focus();
  const onRowKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown") { e.preventDefault(); focusRow(Math.min(tax.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); focusRow(Math.max(0, i - 1)); }
    else if (e.key === "Home") { e.preventDefault(); focusRow(0); }
    else if (e.key === "End") { e.preventDefault(); focusRow(tax.length - 1); }
    else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
      e.preventDefault(); setActive(i);
      requestAnimationFrame(() => (drill ? root.current : flyout.current)?.querySelector<HTMLElement>("[data-sub] a")?.focus());
    }
  };
  const onSubKey = (e: React.KeyboardEvent) => {
    const links = Array.from((drill ? root.current : flyout.current)?.querySelectorAll<HTMLElement>("[data-sub] a") ?? []);
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); links[Math.min(links.length - 1, at + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); links[Math.max(0, at - 1)]?.focus(); }
    else if (e.key === "ArrowLeft" || e.key === "Escape") {
      e.preventDefault(); e.stopPropagation(); // first Escape steps back; the header ignores handled events
      const i = active;
      if (drill) setActive(-1);
      requestAnimationFrame(() => focusRow(i));
    }
  };

  if (drill && g) {
    return (
      <div ref={root} onKeyDown={onSubKey} className="sub-in">
        <button type="button" data-back onClick={() => { const i = active; setActive(-1); requestAnimationFrame(() => focusRow(i)); }} className={`${row} text-forest-700 hover:bg-sand-100`}>
          <ChevronLeft className="size-4 text-forest-500" aria-hidden /> <span>{label(g)}</span>
        </button>
        <div data-sub className="mt-1 border-t border-sand-200 pt-1"><SubLinks g={g} kids={kids} onNavigate={onNavigate} /></div>
      </div>
    );
  }

  return (
    <div ref={root} className="relative">
      <ul role="list" className="space-y-px" onMouseLeave={() => clearTimeout(hover.current)}>
        {tax.map((x, i) => (
          <li key={x.slug}>
            <button
              type="button" data-row={i} aria-expanded={active === i} aria-haspopup="true"
              onMouseEnter={() => { if (!drill) { clearTimeout(hover.current); hover.current = setTimeout(() => setActive(i), 60); } }}
              onFocus={() => { if (!drill) setActive(i); }} onClick={() => setActive(i)} onKeyDown={(e) => onRowKey(e, i)}
              className={`${row} ${active === i ? "bg-sand-100" : "hover:bg-sand-100/70"}`}
            >
              <TaxIconSvg name={x.icon} strokeWidth={1.75} className="size-4 shrink-0 text-forest-500" />
              <span className="truncate">{label(x)}</span>
              <Chevron on={active === i} />
            </button>
          </li>
        ))}
      </ul>
      {!drill && g && (
        <div
          ref={flyout} key={g.slug} onKeyDown={onSubKey} data-flyout
          className={`sub-in absolute -top-1.5 w-[14.5rem] rounded-2xl border border-sand-200 bg-sand-50 p-1.5 shadow-[0_10px_30px_-12px_rgba(15,42,29,0.28)] ${flip ? "right-full mr-3.5" : "left-full ml-3.5"} before:absolute before:inset-y-0 before:w-4 ${flip ? "before:-right-4" : "before:-left-4"}`}
        >
          <div data-sub><SubLinks g={g} kids={kids} onNavigate={onNavigate} /></div>
        </div>
      )}
    </div>
  );
}

const footer = `group/all flex h-9 items-center justify-between rounded-lg px-2.5 text-[0.85rem] font-medium text-forest-700 transition-colors duration-150 hover:bg-sand-100 hover:text-forest-900 ${ring}`;
const Explore = ({ onNavigate }: { onNavigate: () => void }) => (
  <div className="mt-1 border-t border-sand-200 pt-1">
    <Link href="/lists" onClick={onNavigate} className={footer}>Explore All Lists <span aria-hidden className="transition-transform duration-150 group-hover/all:translate-x-0.5">&rarr;</span></Link>
  </div>
);

/** Desktop dropdown: about 320 px, one column, flyout beside it. Touch screens get the in-place drill instead. */
export function ListsMegaPanel(p: Props) {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(hover: none)");
    const set = () => setTouch(q.matches);
    set();
    q.addEventListener("change", set);
    return () => q.removeEventListener("change", set);
  }, []);
  return (
    <div id="menu-lists" className="mega-in w-[20rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-sand-200 bg-sand-50 p-1.5 shadow-[0_10px_30px_-12px_rgba(15,42,29,0.28)]">
      <Rows {...p} drill={touch} />
      <Explore onNavigate={p.onNavigate} />
    </div>
  );
}

/** Mobile: expandable "Lists" row; categories drill in place. */
export function ListsMobile(p: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls="m-lists" onClick={() => setOpen((v) => !v)} className={`flex min-h-12 w-full items-center justify-between rounded-xl px-3 hover:bg-sand-100 ${ring}`}>
        Lists <ChevronDown className={`size-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="m-lists" className={`grid transition-[grid-template-rows] duration-150 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="px-1 pb-1 [&_button]:min-h-11 [&_a]:min-h-11 [&_a]:flex [&_a]:items-center" inert={!open}>
            {open && <Rows {...p} drill />}
            <Explore onNavigate={p.onNavigate} />
          </div>
        </div>
      </div>
    </div>
  );
}
