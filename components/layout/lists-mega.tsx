"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaxIconSvg } from "@/components/lists/tax-icon";
import { childHref, industryChildren, STATUS_LABEL, type TaxChild, type TaxGroup } from "@/lib/taxonomy";

type Named = { slug: string; name: string };
type MenuGeo = { slug: string; name: string; code: string; regions: { slug: string; name: string; cat: string }[]; cities: { slug: string; name: string; region: string | null; cat: string }[] };
type Props = { tax: TaxGroup[]; industries: Named[]; countries: Named[]; onNavigate: () => void };

const chip = (c: TaxChild) => (
  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${c.status === "available" ? "bg-forest-100 text-forest-900" : "bg-purple-100 text-forest-900"}`}>{STATUS_LABEL[c.status]}</span>
);
const kidsOf = (g: TaxGroup, industries: Named[], tax: TaxGroup[]) => (g.slug === "industry-databases" ? industryChildren(industries, tax) : g.children);

/** Compact country > state > city explorer. Data comes from /api/menu/geo (real places only). */
function GeoMenu({ countries, onNavigate }: { countries: Named[]; onNavigate: () => void }) {
  const [data, setData] = useState<MenuGeo[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [c, setC] = useState("");
  const [r, setR] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    let live = true;
    fetch("/api/menu/geo").then((x) => x.json() as Promise<{ countries: MenuGeo[] }>).then((j) => { if (live) setData(j.countries); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);
  const country = data?.find((x) => x.slug === c);
  const needle = q.trim().toLowerCase();
  const hit = (s: string) => !needle || s.toLowerCase().includes(needle);
  const col = "max-h-44 space-y-0.5 overflow-y-auto pr-1";
  const row = "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600";
  if (failed || (data && data.length === 0)) {
    return <div className="rounded-xl bg-sand-50 p-4 text-sm"><p>Pick a country, then a state or region and a city, on the Lists page.</p><ul className="mt-2 flex flex-wrap gap-2">{countries.slice(0, 6).map((k) => <li key={k.slug}><Link href={`/lists?country=${k.slug}#databases`} onClick={onNavigate} className="rounded-full border border-sand-300 px-3 py-1 text-sm font-semibold text-forest-900 hover:border-forest-900">{k.name}</Link></li>)}</ul></div>;
  }
  const regionList = country?.regions.filter((x) => hit(x.name)) ?? [];
  const cityList = country ? country.cities.filter((x) => hit(x.name) && (!r || x.region === r)) : [];
  return (
    <div className="rounded-xl bg-sand-50 p-3">
      <label className="relative block">
        <span className="sr-only">Search places</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place" disabled={!country} className="h-9 w-full rounded-lg border border-sand-300 bg-white pl-9 pr-3 text-sm text-forest-900 placeholder:text-forest-500 disabled:opacity-60" />
      </label>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div><p className="mb-1 px-2 text-xs font-bold text-forest-500">Country</p><ul className={col}>{(data ?? []).map((k) => <li key={k.slug}><button type="button" onClick={() => { setC(k.slug); setR(""); setQ(""); }} aria-pressed={c === k.slug} className={`${row} ${c === k.slug ? "bg-forest-900 !text-sand-50 hover:bg-forest-900" : ""}`}>{k.name}</button></li>)}{!data && <li className="px-2 py-1 text-xs">Loading…</li>}</ul></div>
        <div><p className="mb-1 px-2 text-xs font-bold text-forest-500">State / region</p><ul className={col}>{!country ? <li className="px-2 py-1 text-xs">Choose a country</li> : regionList.length === 0 ? <li className="px-2 py-1 text-xs">None recorded</li> : regionList.map((x) => <li key={x.slug}><button type="button" onClick={() => setR(x.slug)} aria-pressed={r === x.slug} className={`${row} ${r === x.slug ? "bg-forest-100" : ""}`}>{x.name}</button></li>)}</ul></div>
        <div><p className="mb-1 px-2 text-xs font-bold text-forest-500">City</p><ul className={col}>{!country ? <li className="px-2 py-1 text-xs">&nbsp;</li> : cityList.length === 0 ? <li className="px-2 py-1 text-xs">None recorded</li> : cityList.map((x) => {
          const cat = x.cat || country.regions.find((y) => y.slug === x.region)?.cat || "";
          return <li key={`${x.region}/${x.slug}`}>{cat ? <Link href={`/lists/${cat}/${country.slug}/${x.region ? `${x.region}/` : ""}${x.slug}`} onClick={onNavigate} className={row}>{x.name}</Link> : <span className={`${row} opacity-60`}>{x.name}</span>}</li>;
        })}</ul></div>
      </div>
      {country && r && country.regions.find((x) => x.slug === r)?.cat && <Link href={`/lists/${country.regions.find((x) => x.slug === r)!.cat}/${country.slug}/${r}`} onClick={onNavigate} className="mt-2 inline-block text-sm font-semibold text-forest-700 underline underline-offset-4">Open {country.regions.find((x) => x.slug === r)!.name} page</Link>}
    </div>
  );
}

/** Desktop two-level panel: category rail, subcategory panel (or place explorer), featured card. */
export function ListsMegaPanel({ tax: TAXONOMY, industries, countries, onNavigate }: Props) {
  const [active, setActive] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = TAXONOMY[Math.min(active, TAXONOMY.length - 1)];
  const kids = kidsOf(g, industries, TAXONOMY);
  const hoverSelect = (i: number) => { clearTimeout(timer.current); timer.current = setTimeout(() => setActive(i), 90); }; // small delay: a diagonal move across the rail does not flip the panel
  useEffect(() => () => clearTimeout(timer.current), []);
  const key = (e: React.KeyboardEvent, i: number) => {
    const to = e.key === "ArrowDown" ? (i + 1) % TAXONOMY.length : e.key === "ArrowUp" ? (i + TAXONOMY.length - 1) % TAXONOMY.length : e.key === "Home" ? 0 : e.key === "End" ? TAXONOMY.length - 1 : -1;
    if (to >= 0) { e.preventDefault(); setActive(to); refs.current[to]?.focus(); }
    if (e.key === "ArrowRight") { e.preventDefault(); document.querySelector<HTMLElement>("#lists-sub a, #lists-sub button, #lists-sub input")?.focus(); }
  };
  return (
    <div id="menu-lists" className="mega-in grid overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-2xl lg:grid-cols-[17rem_minmax(0,1fr)_14.5rem]">
      <div role="tablist" aria-orientation="vertical" aria-label="List types" className="border-r border-sand-200 bg-sand-50 p-2.5">
        {TAXONOMY.map((x, i) => (
          <button
            key={x.slug} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`lt-${x.slug}`} aria-selected={active === i} aria-controls="lists-sub" tabIndex={active === i ? 0 : -1}
            onMouseEnter={() => hoverSelect(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} onKeyDown={(e) => key(e, i)}
            className={`group relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-purple-600 ${active === i ? "bg-white shadow-sm ring-1 ring-sand-200" : "hover:bg-sand-100"}`}
          >
            {active === i && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-full bg-forest-900" />}
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg transition-colors ${active === i ? "bg-forest-900 text-forest-300" : "bg-forest-100 text-forest-700 group-hover:bg-forest-900 group-hover:text-forest-300"}`}><TaxIconSvg name={x.icon} className="size-[1.1rem]" /></span>
            <span className="min-w-0"><span className="block text-sm font-bold text-forest-900">{x.menuName}</span><span className="block truncate text-xs">{x.short}</span></span>
          </button>
        ))}
      </div>

      <div id="lists-sub" role="tabpanel" aria-labelledby={`lt-${g.slug}`} className="min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="display text-2xl text-forest-900">{g.name}</p><p className="mt-0.5 line-clamp-2 max-w-xl text-xs">{g.status === "available" ? g.short : "Not on sale yet. Browse the category or request a custom list."}</p></div>
          <Link href={`/lists/${g.slug}`} onClick={onNavigate} className="text-sm font-semibold text-forest-700 underline underline-offset-4 hover:text-forest-900">View all {g.name}</Link>
        </div>
        {g.slug === "geographic-databases" ? (
          <div className="mt-3 space-y-2.5">
            <ul className="flex flex-wrap gap-1.5">{g.children.map((c) => <li key={c.slug}><Link href={childHref(g, c)} onClick={onNavigate} className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3 py-1 text-xs font-semibold text-forest-900 hover:border-forest-900">{c.name}{c.status === "upcoming" && <span className="text-[0.6rem] text-forest-500">Upcoming</span>}</Link></li>)}</ul>
            <GeoMenu countries={countries} onNavigate={onNavigate} />
          </div>
        ) : (
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
            {kids.slice(0, 8).map((c) => (
              <li key={c.slug}><Link href={childHref(g, c)} onClick={onNavigate} className="flex h-full items-start justify-between gap-2 rounded-xl border border-transparent px-3 py-2 transition hover:border-sand-300 hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-purple-600">
                <span className="min-w-0"><span className="block text-sm font-semibold text-forest-900">{c.name}</span><span className="block truncate text-xs">{c.short}</span></span>
                {chip(c)}
              </Link></li>
            ))}
            {kids.length > 8 && <li><Link href={`/lists/${g.slug}`} onClick={onNavigate} className="block rounded-xl px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-sand-50">+{kids.length - 8} more</Link></li>}
          </ul>
        )}
        {(g.compliance === "whatsapp" || g.compliance === "consumer") && <p className="mt-3 rounded-lg bg-sand-100 px-3 py-2 text-xs">A phone number is not consent to message it. Consumer and WhatsApp data are not sold today.</p>}
      </div>

      <div className="hidden border-l border-sand-200 p-3 lg:block">
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-forest-900 p-4 text-sand-50">
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-6 w-40 -rotate-6 space-y-1.5 opacity-25">{[0, 1, 2, 3].map((i) => <div key={i} className="flex gap-1.5"><span className="h-3 w-10 rounded bg-sand-200" /><span className="h-3 flex-1 rounded bg-forest-500" /><span className="h-3 w-6 rounded bg-sand-300" /></div>)}</div>
          <div className="relative"><Sparkles className="size-4 text-sand-300" aria-hidden /><p className="display mt-2 text-[1.65rem] leading-[1.05] !text-sand-50">Find the Exact Audience You Need.</p><p className="mt-2 text-xs text-sand-200">Explore targeted contact databases or request a custom list built around your audience.</p></div>
          <div className="relative mt-4 grid gap-2">
            <Button asChild size="sm" className="rounded-full"><Link href="/lists" onClick={onNavigate}>Browse All Lists</Link></Button>
            <Button asChild size="sm" variant="secondary" className="rounded-full"><Link href="/custom-list" onClick={onNavigate}>Build My List</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mobile: searchable accordion of the same tree. Native <details> for smooth, accessible expand/collapse. */
export function ListsMobile({ tax: TAXONOMY, industries, onNavigate }: Omit<Props, "countries">) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const results = useMemo(() => {
    if (!needle) return [];
    return TAXONOMY.flatMap((g) => [
      ...(g.name.toLowerCase().includes(needle) ? [{ key: g.slug, name: g.name, href: `/lists/${g.slug}`, status: g.status, sub: "Category" }] : []),
      ...kidsOf(g, industries, TAXONOMY).filter((c) => c.name.toLowerCase().includes(needle)).map((c) => ({ key: `${g.slug}/${c.slug}`, name: c.name, href: childHref(g, c), status: c.status, sub: g.name })),
    ]).slice(0, 12);
  }, [needle, industries, TAXONOMY]);
  return (
    <details className="group/lists">
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 hover:bg-sand-100">Lists <ChevronDown className="size-4 transition-transform group-open/lists:rotate-180" aria-hidden /></summary>
      <div className="space-y-2 pb-2 pl-1 pt-1">
        <label className="relative block">
          <span className="sr-only">Search list categories</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories" className="h-11 w-full rounded-xl border border-sand-300 bg-sand-50 pl-9 pr-3 text-base text-forest-900" />
        </label>
        {needle ? (
          results.length === 0 ? <p className="px-3 py-2 text-sm">No category matches. <Link href="/custom-list" onClick={onNavigate} className="font-semibold underline">Build a custom list</Link></p> : (
            <ul>{results.map((r) => <li key={r.key}><Link href={r.href} onClick={onNavigate} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sand-100"><span><span className="block font-semibold text-forest-900">{r.name}</span><span className="block text-xs">{r.sub}</span></span><span className="text-[0.65rem] font-bold text-forest-500">{STATUS_LABEL[r.status]}</span></Link></li>)}</ul>
          )
        ) : (
          <ul className="space-y-1">
            {TAXONOMY.map((g) => (
              <li key={g.slug}>
                <details className="group/g rounded-xl">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 hover:bg-sand-100">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-100 text-forest-700"><TaxIconSvg name={g.icon} className="size-[1.1rem]" /></span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-forest-900">{g.menuName}</span><span className="block truncate text-xs">{g.short}</span></span>
                    <ChevronDown className="size-4 shrink-0 transition-transform group-open/g:rotate-180" aria-hidden />
                  </summary>
                  <ul className="ml-6 border-l border-sand-200 pb-1 pl-2">
                    {kidsOf(g, industries, TAXONOMY).slice(0, 10).map((c) => <li key={c.slug}><Link href={childHref(g, c)} onClick={onNavigate} className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sand-100"><span>{c.name}</span>{chip(c)}</Link></li>)}
                    <li><Link href={`/lists/${g.slug}`} onClick={onNavigate} className="block min-h-11 rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-700">View all {g.name}</Link></li>
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        )}
        <Link href="/lists" onClick={onNavigate} className="block rounded-xl bg-forest-900 px-4 py-3 text-center text-sm font-bold text-sand-50">Browse All Lists</Link>
      </div>
    </details>
  );
}
