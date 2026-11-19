"use client";
import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Flag } from "@/components/shared/db-icon";
import { shopHref, type GeoTree } from "@/lib/shop";

const RECENT_KEY = "bl-shop-recent-v1";
const read = (): string[] => { try { const v = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 4) : []; } catch { return []; } };
const write = (v: string[]) => { try { window.localStorage.setItem(RECENT_KEY, JSON.stringify(v)); } catch { /* storage blocked */ } };

function Mark({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark className="bg-purple-100 text-forest-900">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

type Props = { audience?: "b2b" | "b2c";  industries: { slug: string; name: string }[]; countries: { slug: string; name: string; code: string }[]; tree: GeoTree; niches: { name: string; categoryName: string }[] };

export function ShopHero({ audience = "b2b", industries, countries, tree, niches }: Props) {
  const router = useRouter();
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => (typeof window === "undefined" ? [] : read()));
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const h = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  // Suggestions come only from real industries, countries, places and niches.
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
    router.push(`${shopHref({ q: v })}#catalog`);
  };
  const popular = industries.slice(0, 3).map((i) => i.name);
  const first = industries[0]; const firstC = countries[0];

  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-50">
      <div className="grid-drift pointer-events-none absolute inset-0 opacity-[.12]" aria-hidden style={{ backgroundImage: "linear-gradient(var(--color-forest-300) 1px, transparent 1px), linear-gradient(90deg, var(--color-forest-300) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
      <div className="glow-breathe pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-purple-600/30 blur-3xl" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:pb-20 lg:pt-16">
        <div>
          <h1 className="display !text-sand-50 text-5xl leading-[0.95] sm:text-7xl">Find Your Next Customers. Start With Better Data.</h1>
          <p className="mt-5 max-w-2xl text-lg text-sand-200">Explore targeted business contact databases by industry, country, state, and city. Find your audience, preview available data, and own your list with one purchase.</p>

          <div role="tablist" aria-label="Audience" className="mt-7 inline-flex rounded-full bg-forest-700/60 p-1">
            {(["b2b", "b2c"] as const).map((a) => (
              <Link key={a} role="tab" aria-selected={audience === a} href={a === "b2b" ? "/shop" : "/shop?type=b2c"} className={`rounded-full px-5 py-2 text-sm font-semibold ${audience === a ? "bg-sand-50 text-forest-900" : "text-sand-100 hover:text-white"}`}>{a.toUpperCase()}</Link>
            ))}
          </div>

          <div ref={box} className="relative mt-4 max-w-2xl">
            <form role="search" onSubmit={(e) => { e.preventDefault(); go(active >= 0 && list[active] ? list[active] : q); }} className="flex gap-2 rounded-full bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,.6)]">
              <label htmlFor={`${id}-q`} className="sr-only">Search databases</label>
              <Search className="ml-3 size-5 shrink-0 self-center text-forest-700" aria-hidden />
              <input id={`${id}-q`} value={q} autoComplete="off" role="combobox" aria-expanded={open && list.length > 0} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={active >= 0 ? `${id}-o${active}` : undefined}
                onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }} onFocus={() => setOpen(true)}
                onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(list.length - 1, a + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(-1, a - 1)); } else if (e.key === "Escape") setOpen(false); }}
                placeholder="Try “dentists in Alabama”" className="min-w-0 flex-1 bg-transparent px-1 text-base text-forest-900 outline-none placeholder:text-forest-700/70" />
              <button type="submit" className="rounded-full bg-purple-600 px-6 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Find My Audience</button>
            </form>
            {open && list.length > 0 && (
              <ul id={`${id}-list`} role="listbox" aria-label={t ? "Suggestions" : "Recent searches"} className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white py-1 text-forest-900 shadow-2xl">
                {!t && <li role="presentation" className="px-4 pb-1 pt-2 text-xs font-bold text-forest-700">Recent searches</li>}
                {list.map((s, i) => (
                  <li key={s} id={`${id}-o${i}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(s); }} className={`cursor-pointer px-4 py-2.5 text-sm ${i === active ? "bg-sand-100" : ""}`}><Mark text={s} q={t} /></li>
                ))}
                {!t && <li role="presentation" className="border-t border-sand-200 px-4 py-2 text-xs"><button type="button" onMouseDown={(e) => { e.preventDefault(); write([]); setRecent([]); }} className="font-semibold underline">Clear recent searches</button></li>}
              </ul>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-sand-200">Try:</span>
            {popular.map((p) => <button key={p} type="button" onClick={() => go(p)} className="rounded-full border border-forest-500 px-3.5 py-1.5 font-semibold hover:bg-forest-700">{p}</button>)}
            <Link href="/custom-list" className="rounded-full border border-forest-500 px-3.5 py-1.5 font-semibold hover:bg-forest-700">Build My Custom List</Link>
          </div>
        </div>

        {/* a small database being narrowed: industry, country, place */}
        <div className="floaty relative mx-auto hidden w-full max-w-md lg:block" aria-hidden>
          <div className="rounded-[1.6rem] border border-forest-500/60 bg-forest-700/50 p-5 backdrop-blur">
            <div className="space-y-2.5">
              {[["Industry", first?.name ?? "Any"], ["Country", firstC?.name ?? "Any"], ["State or city", "Any place"]].map(([k, v], i) => (
                <div key={k} className="flex items-center justify-between rounded-xl bg-forest-900/70 px-4 py-3 text-sm">
                  <span className="text-sand-200">{k}</span>
                  <span className="inline-flex items-center gap-2 font-semibold">{i === 1 && firstC && <Flag code={firstC.code} className="h-3 w-[18px]" />}{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-sand-50 p-3 text-forest-900">
              {[72, 58, 66, 48].map((w, i) => (<div key={i} className="flex items-center gap-2 py-1.5"><span className="size-2 rounded-full bg-forest-500" /><span className="h-2 rounded-full bg-sand-200" style={{ width: `${w}%` }} /><span className="ml-auto h-2 w-10 rounded-full bg-purple-100" /></div>))}
            </div>
            <p className="mt-3 text-center text-xs text-sand-200">Masked sample on every list page</p>
          </div>
        </div>
      </div>
    </section>
  );
}
