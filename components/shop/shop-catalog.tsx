"use client";
import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { customListHref } from "@/lib/search";
import { PAGE_SIZE, SORTS, applyFilters, chips, facets, interpret, isFiltered, paginate, parseFilters, shopHref, type Filters, type ShopData, type Sort } from "@/lib/shop";
import { ProductCard } from "./product-card";

const sortLabel: Record<Sort, string> = { relevance: "Relevance", availability: "Availability", "price-low": "Price: low to high", "price-high": "Price: high to low", name: "Name A–Z" };
const field = "h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-purple-600";

function Group({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-sand-200 py-4 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-forest-900">{title}<span aria-hidden className="text-lg leading-none transition-transform group-open:rotate-45">+</span></summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" checked={checked} onChange={onChange} className="size-4 rounded accent-forest-700" />{label}</label>;
}
const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

/** The catalog: sticky filters, instant results, active chips, URL kept in sync (shareable and reload-safe). */
export function ShopCatalog({ data, initial, featured }: { data: ShopData & { niches: { category: string; categoryName: string; name: string }[] }; initial: Filters; featured: string[] }) {
  const [f, setF] = useState<Filters>(initial);
  const [drawer, setDrawer] = useState(false);
  const first = useRef(true);
  const set = useCallback((patch: Partial<Filters>) => setF((cur) => ({ ...cur, page: 1, ...patch })), []);

  // Keep the address bar in step with the filters, without a page load.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.history.replaceState(null, "", shopHref(f));
  }, [f]);
  useEffect(() => {
    const back = () => setF(parseFilters(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", back);
    return () => window.removeEventListener("popstate", back);
  }, []);
  useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [drawer]);
  useEffect(() => { if (!drawer) return; const k = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [drawer]);

  const fac = useMemo(() => facets(data, f), [data, f]);
  const matches = useMemo(() => applyFilters(data, f, featured), [data, f, featured]);
  const view = paginate(matches, f.page);
  const active = chips(f, data);
  const it = useMemo(() => (f.q ? interpret(f.q, data.industries, data.tree) : {}), [f.q, data]);
  const readsAs = [it.industry && `Industry: ${it.industry.name}`, it.country && `Country: ${it.country.name}`, it.state && `State: ${it.state.name}`, it.city && `City: ${it.city.name}`].filter(Boolean) as string[];
  const clear = () => setF({ ...f, q: "", industries: [], countries: [], state: "", city: "", fields: [], avail: "", minRecords: null, maxRecords: null, minPrice: null, maxPrice: null, page: 1 });
  const sorts = SORTS.filter((s) => (!s.startsWith("price") || !!fac.price));

  const filters = (
    <div>
      <Group title="Industry">
        {data.industries.map((i) => <Check key={i.slug} label={i.name} checked={f.industries.includes(i.slug)} onChange={() => set({ industries: toggle(f.industries, i.slug) })} />)}
      </Group>
      <Group title="Country">
        {data.countries.map((c) => <Check key={c.slug} label={c.name} checked={f.countries.includes(c.slug)} onChange={() => set({ countries: toggle(f.countries, c.slug), state: "", city: "" })} />)}
      </Group>
      {fac.states.length > 0 && (
        <Group title="State or province">
          <label className="sr-only" htmlFor="f-state">State or province</label>
          <select id="f-state" value={f.state} onChange={(e) => set({ state: e.target.value, city: "" })} className={field}><option value="">Any</option>{fac.states.map((s) => <option key={`${s.countrySlug}-${s.slug}`} value={s.slug}>{s.name}</option>)}</select>
        </Group>
      )}
      {fac.cities.length > 0 && (
        <Group title="City">
          <label className="sr-only" htmlFor="f-city">City</label>
          <select id="f-city" value={f.city} onChange={(e) => set({ city: e.target.value })} className={field}><option value="">Any</option>{fac.cities.map((c) => <option key={`${c.countrySlug}-${c.slug}`} value={c.slug}>{c.name}</option>)}</select>
        </Group>
      )}
      {fac.records && (
        <Group title="Contacts in the list">
          <div className="grid grid-cols-2 gap-2"><input aria-label="Minimum contacts" inputMode="numeric" placeholder={`Min ${fac.records.min}`} value={f.minRecords ?? ""} onChange={(e) => set({ minRecords: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })} className={field} /><input aria-label="Maximum contacts" inputMode="numeric" placeholder={`Max ${fac.records.max}`} value={f.maxRecords ?? ""} onChange={(e) => set({ maxRecords: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })} className={field} /></div>
        </Group>
      )}
      {fac.price && (
        <Group title="Starting price (USD)">
          <div className="grid grid-cols-2 gap-2"><input aria-label="Minimum price" inputMode="numeric" placeholder={`Min ${fac.price.min}`} value={f.minPrice ?? ""} onChange={(e) => set({ minPrice: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })} className={field} /><input aria-label="Maximum price" inputMode="numeric" placeholder={`Max ${fac.price.max}`} value={f.maxPrice ?? ""} onChange={(e) => set({ maxPrice: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })} className={field} /></div>
        </Group>
      )}
      {fac.fields.length > 0 && (
        <Group title="Data fields">
          {fac.fields.map((x) => <Check key={x} label={x} checked={f.fields.includes(x)} onChange={() => set({ fields: toggle(f.fields, x) })} />)}
        </Group>
      )}
      {fac.hasAvailability && (
        <Group title="Availability">
          <Check label="Ready to buy" checked={f.avail === "live"} onChange={() => set({ avail: f.avail === "live" ? "" : "live" })} />
          <Check label="Preview only" checked={f.avail === "preview"} onChange={() => set({ avail: f.avail === "preview" ? "" : "preview" })} />
        </Group>
      )}
    </div>
  );

  const noMatch = f.q ? customListHref(f.q) : "/custom-list";
  return (
    <section id="catalog" className="scroll-mt-24 border-t border-sand-200 py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-[1.4rem] border border-sand-300 bg-white p-5">
            <div className="flex items-center justify-between"><h2 className="display text-2xl text-forest-900">Filters</h2>{active.length > 0 && <button type="button" onClick={clear} className="text-sm font-semibold underline">Clear all</button>}</div>
            {filters}
          </div>
        </aside>

        <div>
          <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-3 border-b border-sand-200 bg-sand-50/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <button type="button" onClick={() => setDrawer(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-forest-900 px-4 text-sm font-semibold text-forest-900 lg:hidden"><SlidersHorizontal className="size-4" aria-hidden />Filters{active.length > 0 && <span className="rounded-full bg-forest-900 px-2 text-xs text-sand-50">{active.length}</span>}</button>
            <h2 className="display text-3xl text-forest-900 max-sm:hidden">{isFiltered(f) ? "Matching databases" : "All databases"}</h2>
            <div className="ml-auto flex items-center gap-2"><label htmlFor="shop-sort" className="whitespace-nowrap text-sm font-semibold text-forest-900">Sort by</label>
              <select id="shop-sort" value={f.sort} onChange={(e) => set({ sort: e.target.value as Sort })} className={`${field} w-auto`}>{sorts.map((s) => <option key={s} value={s}>{sortLabel[s]}</option>)}</select></div>
          </div>

          {active.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {active.map((c) => <button key={c.key} type="button" onClick={() => set(c.remove)} className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:bg-purple-100/70">{c.label}<X className="size-3.5" aria-label="Remove filter" /></button>)}
              <button type="button" onClick={clear} className="text-sm font-semibold underline">Clear all</button>
            </div>
          )}
          {readsAs.length > 1 && <p className="mt-3 text-sm" role="status">We read your search as <strong className="text-forest-900">{readsAs.join(" · ")}</strong>.</p>}

          {view.items.length ? (
            <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{view.items.map((p) => <ProductCard key={p.slug} p={p} />)}</ul>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-sand-300 bg-sand-100 p-7">
              <p className="display text-2xl text-forest-900">No ready-made database matches that yet.</p>
              <p className="mt-2 text-sm">{(f.state || f.city || it.state || it.city) ? "We have not recorded inventory for that place. " : ""}Describe the audience and we will tell you honestly what is possible. Nothing is promised until we reply.</p>
              <div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link href={noMatch}>Build My Custom List</Link></Button>{active.length > 0 && <Button variant="secondary" onClick={clear}>Clear filters</Button>}</div>
            </div>
          )}

          {view.pages > 1 && (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between text-sm">
              <span>Page {view.page} of {view.pages} · {PAGE_SIZE} per page</span>
              <span className="flex gap-2">
                {view.page > 1 && <Link rel="prev" href={shopHref({ ...f, page: view.page - 1 })} onClick={(e) => { e.preventDefault(); setF({ ...f, page: view.page - 1 }); }} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Previous</Link>}
                {view.page < view.pages && <Link rel="next" href={shopHref({ ...f, page: view.page + 1 })} onClick={(e) => { e.preventDefault(); setF({ ...f, page: view.page + 1 }); }} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Next</Link>}
              </span>
            </nav>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-forest-900/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,92vw)] flex-col bg-sand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4"><h2 className="display text-2xl text-forest-900">Filters</h2><button type="button" onClick={() => setDrawer(false)} aria-label="Close" className="grid size-9 place-items-center rounded-full border border-sand-300"><X className="size-4" /></button></div>
            <div className="flex-1 overflow-auto px-5">{filters}</div>
            <div className="flex gap-3 border-t border-sand-200 p-4"><Button className="flex-1" onClick={() => setDrawer(false)}>Show results</Button>{active.length > 0 && <Button variant="secondary" onClick={clear}>Clear all</Button>}</div>
          </div>
        </div>
      )}
    </section>
  );
}
