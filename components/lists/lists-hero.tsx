"use client";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useRef, useState, useEffect } from "react";
import { DbBadge } from "@/components/shared/db-icon";
import { listsHref, type GeoTree } from "@/lib/shop";

const RECENT_KEY = "bl-lists-recent-v1";
const read = (): string[] => { try { const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 4) : []; } catch { return []; } };
const write = (v: string[]) => { try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(v)); } catch { /* storage blocked */ } };

function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="bg-purple-100 text-forest-900">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

type Props = { audience: "b2b" | "b2c"; industries: { slug: string; name: string }[]; countries: { slug: string; name: string; code: string }[]; tree: GeoTree; niches: { name: string }[] };

/** Compact, light hero: headline, search with autocomplete from REAL industries and places, audience tabs, popular searches. */
export function ListsHero({ audience, industries, countries, tree, niches }: Props) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => (typeof window === "undefined" ? [] : read()));
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  const pool = useMemo(() => {
    const out: string[] = [];
    for (const i of industries) {
      out.push(i.name);
      for (const c of tree) { out.push(`${i.name} in ${c.name}`); for (const r of c.regions.filter((x) => x.cats.includes(i.slug))) out.push(`${i.name} in ${r.name}`); for (const city of c.cities.filter((x) => x.cats.includes(i.slug))) out.push(`${i.name} in ${city.name}`); }
    }
    for (const c of countries) out.push(c.name);
    for (const n of niches) out.push(n.name);
    return [...new Set(out)];
  }, [industries, countries, tree, niches]);
  const t = q.trim().toLowerCase();
  const list = t.length >= 1 ? pool.filter((s) => s.toLowerCase().includes(t) && s.toLowerCase() !== t).slice(0, 6) : recent;
  const go = (value: string) => {
    const v = value.trim().slice(0, 80);
    if (!v) return;
    write([v, ...recent.filter((x) => x !== v)].slice(0, 4));
    setOpen(false);
    router.push(`${listsHref({ q: v, type: audience })}#databases`);
  };
  const popular = industries.slice(0, 3).map((i) => i.name);
  const tab = (a: "b2b" | "b2c", label: string) => <Link role="tab" aria-selected={audience === a} href={a === "b2b" ? "/lists" : "/lists?type=b2c"} className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${audience === a ? "bg-forest-900 text-sand-50" : "text-forest-900 hover:bg-white"}`}>{label}</Link>;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-2">
      <div className="relative overflow-hidden rounded-[2rem] border border-sand-200 bg-sand-100 px-6 py-9 sm:px-12 sm:py-12">
        {/* restrained composition: a fan of real industry index tabs */}
        <div className="pointer-events-none absolute -right-6 top-6 hidden w-[19rem] lg:block" aria-hidden>
          {industries.slice(0, 3).map((i, n) => (
            <div key={i.slug} className="absolute right-0 flex w-60 items-center gap-3 rounded-2xl border border-sand-300 bg-white p-3 shadow-[0_10px_30px_-18px_rgba(15,42,29,.5)]" style={{ top: `${n * 62}px`, transform: `translateX(${(n % 2 ? 26 : 0)}px) rotate(${n === 1 ? 1.5 : -1.5}deg)` }}>
              <DbBadge category={i.slug} size="sm" /><span className="text-sm font-bold text-forest-900">{i.name}</span><span className="ml-auto h-2 w-10 rounded-full bg-purple-100" />
            </div>
          ))}
        </div>
        <h1 className="display max-w-3xl text-5xl leading-[0.95] text-forest-900 sm:text-6xl">Find the Right Contacts. Own the List.</h1>
        <p className="mt-4 max-w-2xl text-lg">Explore targeted business contact databases by industry and location. Preview available data, choose your prospects, and purchase once.</p>

        <div role="tablist" aria-label="Prospect type" className="mt-6 inline-flex rounded-full border border-sand-300 bg-sand-50 p-1">{tab("b2b", "B2B databases")}{tab("b2c", "B2C databases")}</div>

        <div ref={box} className="relative mt-4 max-w-2xl">
          <form role="search" onSubmit={(e) => { e.preventDefault(); go(active >= 0 && list[active] ? list[active] : q); }} className="flex gap-2 rounded-2xl border-2 border-forest-900 bg-white p-1.5 shadow-[4px_4px_0_0_var(--color-forest-900)]">
            <label htmlFor={`${id}-q`} className="sr-only">Search lists by industry or location</label>
            <Search className="ml-3 size-5 shrink-0 self-center text-forest-700" aria-hidden />
            <input id={`${id}-q`} value={q} autoComplete="off" role="combobox" aria-expanded={open && list.length > 0} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-o${active}` : undefined}
              onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(list.length - 1, a + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); } else if (e.key === "Escape") setOpen(false); }}
              placeholder="Try “dentists in Alabama”" className="min-w-0 flex-1 bg-transparent px-1 text-base text-forest-900 outline-none placeholder:text-forest-700/70" />
            <button type="submit" className="rounded-xl bg-purple-600 px-6 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">Find Lists</button>
          </form>
          {open && list.length > 0 && (
            <ul id={`${id}-list`} role="listbox" aria-label={t ? "Suggestions" : "Recent searches"} className="absolute inset-x-0 top-full z-30 mt-3 overflow-hidden rounded-2xl border border-sand-300 bg-white py-1 shadow-2xl">
              {!t && <li role="presentation" className="px-4 pb-1 pt-2 text-xs font-bold text-forest-700">Recent searches</li>}
              {list.map((s, i) => (
                <li key={s} id={`${id}-o${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(s); }} className={`cursor-pointer px-4 py-2.5 text-sm text-forest-900 ${i === active ? "bg-sand-100" : ""}`}><Mark text={s} q={t} /></li>
              ))}
              {!t && <li role="presentation" className="border-t border-sand-200 px-4 py-2 text-xs"><button type="button" onMouseDown={(e) => { e.preventDefault(); write([]); setRecent([]); }} className="font-semibold underline">Clear recent searches</button></li>}
            </ul>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span>Popular:</span>
          {popular.map((p) => <button key={p} type="button" onClick={() => go(p)} className="rounded-full border border-forest-900/30 bg-white px-3.5 py-1.5 font-semibold text-forest-900 hover:border-forest-900">{p}</button>)}
          <Link href="/custom-list" className="rounded-full border border-forest-900/30 bg-white px-3.5 py-1.5 font-semibold text-forest-900 hover:border-forest-900">Custom list</Link>
        </div>
      </div>
    </section>
  );
}
