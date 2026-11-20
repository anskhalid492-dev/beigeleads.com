"use client";
import { LayoutGrid, List as ListIcon, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { customListHref } from "@/lib/search";
import { PAGE_SIZE, SORTS, applyFilters, chips, facets, interpret, listsHref, paginate, parseFilters, type Filters, type ShopData, type Sort } from "@/lib/shop";
import { ListCard } from "./list-card";

const sortLabel: Record<Sort, string> = { relevance: "Relevance", availability: "Availability", "price-low": "Price: low to high", "price-high": "Price: high to low", name: "Name A–Z" };
const sel = "h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const VIEW_KEY = "bl-lists-view-v1";

/** Product discovery: one filter bar (not a sidebar), extra filters in a drawer, grid or list view, instant results, URL kept in sync. */
export function ListsCatalog({ data, initial, featured }: { data: ShopData & { niches: { category: string; categoryName: string; name: string }[] }; initial: Filters; featured: string[] }) {
  const [f, setF] = useState<Filters>(initial);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [drawer, setDrawer] = useState(false);
  const first = useRef(true);
  const set = useCallback((patch: Partial<Filters>) => setF((cur) => ({ ...cur, page: 1, ...patch })), []);

  useEffect(() => { const t = setTimeout(() => { try { if (window.localStorage.getItem(VIEW_KEY) === "list") setView("list"); } catch { /* storage blocked */ } }, 0); return () => clearTimeout(t); }, []);
  const pickView = (v: "grid" | "list") => { setView(v); try { window.localStorage.setItem(VIEW_KEY, v); } catch { /* storage blocked */ } };
  useEffect(() => { if (first.current) { first.current = false; return; } window.history.replaceState(null, "", listsHref(f) + window.location.hash); }, [f]);
  useEffect(() => { const back = () => setF(parseFilters(new URLSearchParams(window.location.search))); window.addEventListener("popstate", back); return () => window.removeEventListener("popstate", back); }, []);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawer]);
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [drawer]);

  const fac = useMemo(() => facets(data, f), [data, f]);
  const matches = useMemo(() => applyFilters(data, f, featured), [data, f, featured]);
  const v = paginate(matches, f.page);
  const active = chips(f, data);
  const it = useMemo(() => (f.q ? interpret(f.q, data.industries, data.tree) : {}), [f.q, data]);
  const readsAs = [it.industry && `Industry: ${it.industry.name}`, it.country && `Country: ${it.country.name}`, it.state && `State: ${it.state.name}`, it.city && `City: ${it.city.name}`].filter(Boolean) as string[];
  const clear = () => setF({ ...f, q: "", industries: [], countries: [], state: "", city: "", fields: [], avail: "", minRecords: null, maxRecords: null, minPrice: null, maxPrice: null, page: 1 });
  const sorts = SORTS.filter((s) => !s.startsWith("price") || !!fac.price);
  const extra = !!(fac.records || fac.price || fac.fields.length || fac.hasAvailability);
  const num = (x: string) => (x === "" ? null : Math.max(0, Number(x) || 0));
  const noMatch = f.q ? customListHref(f.q) : "/custom-list";

  return (
    <section id="databases" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="display text-4xl text-forest-900">Browse ready-made lists</h2><p className="mt-1 max-w-xl text-sm">Every list has a masked sample, a one-time price and delivery by email.</p></div>
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-sand-300 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
          <div><label htmlFor="l-q" className="mb-1 block text-xs font-bold text-forest-900">Search</label><input id="l-q" value={f.q} onChange={(e) => set({ q: e.target.value.slice(0, 80) })} placeholder="Industry, country or place" className={sel} /></div>
          <div><label htmlFor="l-i" className="mb-1 block text-xs font-bold text-forest-900">Industry</label><select id="l-i" value={f.industries[0] ?? ""} onChange={(e) => set({ industries: e.target.value ? [e.target.value] : [] })} className={sel}><option value="">All industries</option>{data.industries.map((i) => <option key={i.slug} value={i.slug}>{i.name}</option>)}</select></div>
          <div><label htmlFor="l-c" className="mb-1 block text-xs font-bold text-forest-900">Country</label><select id="l-c" value={f.countries[0] ?? ""} onChange={(e) => set({ countries: e.target.value ? [e.target.value] : [], state: "", city: "" })} className={sel}><option value="">All countries</option>{data.countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          {fac.states.length > 0 ? <div><label htmlFor="l-s" className="mb-1 block text-xs font-bold text-forest-900">State or region</label><select id="l-s" value={f.state} onChange={(e) => set({ state: e.target.value, city: "" })} className={sel}><option value="">Any</option>{fac.states.map((s) => <option key={`${s.countrySlug}-${s.slug}`} value={s.slug}>{s.name}</option>)}</select></div> : <div className="hidden lg:block" />}
          <div className="flex items-end gap-2">
            {extra && <button type="button" onClick={() => setDrawer(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-forest-900 px-4 text-sm font-semibold text-forest-900"><SlidersHorizontal className="size-4" aria-hidden />More</button>}
          </div>
        </div>
        {fac.cities.length > 0 && (f.state || f.countries.length > 0) && (
          <div className="mt-3 max-w-xs"><label htmlFor="l-city" className="mb-1 block text-xs font-bold text-forest-900">City</label><select id="l-city" value={f.city} onChange={(e) => set({ city: e.target.value })} className={sel}><option value="">Any</option>{fac.cities.map((c) => <option key={`${c.countrySlug}-${c.slug}`} value={c.slug}>{c.name}</option>)}</select></div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {active.map((c) => <button key={c.key} type="button" onClick={() => set(c.remove)} className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-semibold text-forest-900">{c.label}<X className="size-3.5" aria-label="Remove filter" /></button>)}
        {active.length > 0 && <button type="button" onClick={clear} className="text-sm font-semibold underline">Clear all</button>}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="l-sort" className="whitespace-nowrap text-sm font-semibold text-forest-900">Sort by</label>
          <select id="l-sort" value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })} className={`${sel} w-auto`}>{sorts.map((s) => <option key={s} value={s}>{sortLabel[s]}</option>)}</select>
          <div role="group" aria-label="View" className="inline-flex rounded-xl border border-sand-300 bg-white p-0.5">
            {([["grid", LayoutGrid, "Grid view"], ["list", ListIcon, "List view"]] as const).map(([k, Icon, label]) => <button key={k} type="button" aria-pressed={view === k} aria-label={label} onClick={() => pickView(k)} className={`grid size-9 place-items-center rounded-lg ${view === k ? "bg-forest-900 text-sand-50" : "text-forest-900"}`}><Icon className="size-4" /></button>)}
          </div>
        </div>
      </div>
      {readsAs.length > 1 && <p className="mt-3 text-sm" role="status">We read your search as <strong className="text-forest-900">{readsAs.join(" · ")}</strong>.</p>}

      {v.items.length ? (
        <ul className={`mt-5 grid gap-5 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : ""}`}>{v.items.map((p) => <ListCard key={p.slug} p={p} view={view} />)}</ul>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-sand-300 bg-sand-100 p-7">
          <p className="display text-2xl text-forest-900">No ready-made list matches that yet.</p>
          <p className="mt-2 text-sm">{(f.state || f.city || it.state || it.city) ? "We have not recorded inventory for that place. " : ""}Describe the prospects and we will tell you honestly what is possible. Nothing is promised until we reply.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link href={noMatch}>Build My Custom List</Link></Button>{active.length > 0 && <Button variant="secondary" onClick={clear}>Clear filters</Button>}</div>
        </div>
      )}

      {v.pages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
          <span>Page {v.page} of {v.pages} · {PAGE_SIZE} per page</span>
          <span className="flex gap-2">
            {v.page > 1 && <Link rel="prev" href={listsHref({ ...f, page: v.page - 1 })} onClick={(e) => { e.preventDefault(); setF({ ...f, page: v.page - 1 }); }} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Previous</Link>}
            {v.page < v.pages && <Link rel="next" href={listsHref({ ...f, page: v.page + 1 })} onClick={(e) => { e.preventDefault(); setF({ ...f, page: v.page + 1 }); }} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Next</Link>}
          </span>
        </nav>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="More filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-forest-900/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(24rem,94vw)] flex-col bg-sand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4"><h2 className="display text-2xl text-forest-900">More filters</h2><button type="button" onClick={() => setDrawer(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-sand-300"><X className="size-4" /></button></div>
            <div className="flex-1 space-y-6 overflow-auto px-5 py-5">
              {fac.records && <fieldset><legend className="mb-2 text-sm font-bold text-forest-900">Contacts in the list</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Minimum contacts" inputMode="numeric" placeholder={`Min ${fac.records.min}`} value={f.minRecords ?? ""} onChange={(e) => set({ minRecords: num(e.target.value) })} className={sel} /><input aria-label="Maximum contacts" inputMode="numeric" placeholder={`Max ${fac.records.max}`} value={f.maxRecords ?? ""} onChange={(e) => set({ maxRecords: num(e.target.value) })} className={sel} /></div></fieldset>}
              {fac.price && <fieldset><legend className="mb-2 text-sm font-bold text-forest-900">Starting price (USD)</legend><div className="grid grid-cols-2 gap-2"><input aria-label="Minimum price" inputMode="numeric" placeholder={`Min ${fac.price.min}`} value={f.minPrice ?? ""} onChange={(e) => set({ minPrice: num(e.target.value) })} className={sel} /><input aria-label="Maximum price" inputMode="numeric" placeholder={`Max ${fac.price.max}`} value={f.maxPrice ?? ""} onChange={(e) => set({ maxPrice: num(e.target.value) })} className={sel} /></div></fieldset>}
              {fac.fields.length > 0 && <fieldset><legend className="mb-2 text-sm font-bold text-forest-900">Data fields</legend><div className="space-y-2">{fac.fields.map((x) => <label key={x} className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="size-4 accent-forest-700" checked={f.fields.includes(x)} onChange={() => set({ fields: toggle(f.fields, x) })} />{x}</label>)}</div></fieldset>}
              {fac.hasAvailability && <fieldset><legend className="mb-2 text-sm font-bold text-forest-900">Availability</legend><div className="space-y-2">{([["live", "Ready to buy"], ["preview", "Preview only"]] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2.5 text-sm"><input type="checkbox" className="size-4 accent-forest-700" checked={f.avail === k} onChange={() => set({ avail: f.avail === k ? "" : k })} />{l}</label>)}</div></fieldset>}
            </div>
            <div className="flex gap-3 border-t border-sand-200 p-4"><Button className="flex-1" onClick={() => setDrawer(false)}>Show results</Button>{active.length > 0 && <Button variant="secondary" onClick={clear}>Clear all</Button>}</div>
          </div>
        </div>
      )}
    </section>
  );
}
