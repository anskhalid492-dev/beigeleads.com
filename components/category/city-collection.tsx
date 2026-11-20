"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";

export type CityItem = { slug: string; city: string; name: string; title: string; description: string; fields: string[]; recordCount: number | null; coverage: string; href: string; forSale: boolean };
const PER = 12;

/** Searchable, sortable, paginated city databases. Every card is a real catalog product with its own page. */
export function CityCollection({ items, countryName }: { items: CityItem[]; countryName: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"az" | "za" | "most">("az");
  const [page, setPage] = useState(1);
  const hasCounts = items.some((i) => i.recordCount !== null);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    const f = items.filter((i) => !n || i.city.toLowerCase().includes(n) || i.name.toLowerCase().includes(n));
    return [...f].sort((a, b) => sort === "za" ? b.city.localeCompare(a.city) : sort === "most" ? (b.recordCount ?? -1) - (a.recordCount ?? -1) || a.city.localeCompare(b.city) : a.city.localeCompare(b.city));
  }, [items, q, sort]);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PER, cur * PER);
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1"><span className="sr-only">Search {countryName} cities</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${countryName} cities`} className="h-12 w-full rounded-full border border-sand-300 bg-white pl-11 pr-4 text-forest-900 placeholder:text-forest-500/70 focus-visible:outline-2 focus-visible:outline-purple-600" />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-forest-900">Sort
          <select value={sort} onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }} className="h-12 rounded-full border border-sand-300 bg-white px-4 font-medium focus-visible:outline-2 focus-visible:outline-purple-600">
            <option value="az">City A to Z</option><option value="za">City Z to A</option>{hasCounts && <option value="most">Most contacts</option>}
          </select>
        </label>
      </div>
      <p className="mt-3 text-sm" aria-live="polite">{list.length === 0 ? "No city matches your search." : `Showing ${shown.length} of ${list.length}`}</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.slug} className="group flex flex-col rounded-[1.5rem] border border-sand-300 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-[0_18px_34px_-24px_rgba(15,42,29,.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-forest-500"><MapPin className="size-4" aria-hidden />{c.coverage}</p>
            <h3 className="display mt-1 text-[2rem] leading-none text-forest-900">{c.city}</h3>
            <p className="mt-2 font-semibold text-forest-900">{c.name}</p>
            <p className="mt-2 line-clamp-3 text-sm">{c.description}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Data fields">
              {c.fields.slice(0, 4).map((f) => <li key={f} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">{f}</li>)}
              {c.fields.length > 4 && <li className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">+{c.fields.length - 4} more</li>}
            </ul>
            <p className="mt-4 flex items-center justify-between gap-3 border-t border-sand-200 pt-3 text-sm">
              <span><span className="font-bold text-forest-900">{c.recordCount !== null ? c.recordCount.toLocaleString("en-US") : "Count to be confirmed"}</span>{c.recordCount !== null ? " contacts" : ""}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><span className={`size-2 rounded-full ${c.forSale ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{c.forSale ? "Available" : "Preview only"}</span>
            </p>
            <Link href={c.href} className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-purple-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">View Database</Link>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="City pages">
          <button type="button" disabled={cur === 1} onClick={() => setPage(cur - 1)} className="h-10 rounded-full border border-sand-300 px-4 text-sm font-semibold text-forest-900 disabled:opacity-40">Previous</button>
          <span className="text-sm font-semibold text-forest-900">Page {cur} of {pages}</span>
          <button type="button" disabled={cur === pages} onClick={() => setPage(cur + 1)} className="h-10 rounded-full border border-sand-300 px-4 text-sm font-semibold text-forest-900 disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
