"use client";
import { ArrowUpRight, Building2, Globe2, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DbBadge } from "@/components/shared/db-icon";
import type { GeoTree } from "@/lib/shop";
import { GeoExplorer } from "./geo-explorer";


type Industry = { slug: string; name: string; blurb: string };
type Props = { industries: Industry[]; tree: GeoTree; industryCountries: Record<string, [string, string][]>; niches: { category: string; name: string }[]; productCats: Record<string, string[]>; countryProducts: Record<string, { slug: string; name: string }[]> };
const TABS = [["industries", "By industry", Building2], ["locations", "By location", Globe2]] as const;
type Tab = (typeof TABS)[number][0];

/** The directory: every industry, a country -> state -> city explorer, and prospect types. Real data only. */
export function ListsDirectory({ industries, tree, industryCountries, niches, productCats, countryProducts }: Props) {
  const [tab, setTab] = useState<Tab>("industries");
  useEffect(() => {
    const on = () => { const h = window.location.hash.slice(1); if (h === "industries" || h === "locations") setTab(h); };
    const t = setTimeout(on, 0);
    window.addEventListener("hashchange", on);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", on); };
  }, []);
  const go = (t: Tab) => { setTab(t); window.history.replaceState(null, "", `#${t}`); };

  const [q, setQ] = useState("");
  const shown = industries.filter((i) => !q.trim() || `${i.name} ${i.blurb}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <section id="directory" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14">
      <div className="overflow-hidden rounded-[2rem] border border-sand-200 bg-sand-100 p-5 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="display text-[2rem] leading-none text-forest-900 sm:text-[2.6rem]">Explore by industry or location</h2>
            <p className="mt-3 text-sm sm:text-base">Pick an industry to see its lists, or start from a place and narrow down to a state or city.</p>
          </div>
          <div role="tablist" aria-label="Directory" className="inline-flex rounded-full border border-sand-300 bg-white p-1 shadow-sm">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} id={`tab-${k}`} role="tab" type="button" aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => go(k)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${tab === k ? "bg-forest-900 text-sand-50" : "text-forest-900 hover:bg-sand-100"}`}><Icon className="size-4" aria-hidden />{label}</button>
            ))}
          </div>
        </div>

        <div className="mt-7">
          <div id="panel-industries" role="tabpanel" aria-labelledby="tab-industries" hidden={tab !== "industries"}>
            {industries.length > 6 && (
              <label className="relative mb-5 block max-w-md">
                <span className="sr-only">Filter industries</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-forest-500" aria-hidden />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter industries" className="h-11 w-full rounded-full border border-sand-300 bg-white pl-10 pr-4 text-sm text-forest-900 placeholder:text-forest-500 focus-visible:outline-2 focus-visible:outline-purple-600" />
              </label>
            )}
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((i) => {
                const where = industryCountries[i.slug] ?? [];
                const sub = niches.filter((n) => n.category === i.slug);
                const places = tree.flatMap((c) => [...c.regions, ...c.cities].filter((x) => x.cats.includes(i.slug)).map((x) => x.name));
                return (
                  <li key={i.slug} className="group relative flex min-w-0 flex-col rounded-2xl border border-sand-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <div className="flex items-start gap-4">
                      <DbBadge category={i.slug} country={where[0]?.[0]} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="display text-[1.55rem] leading-tight text-forest-900"><Link href={`/lists/${i.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-purple-600">{i.name}</Link></h3>
                        {i.blurb && <p className="mt-1 line-clamp-2 text-sm">{i.blurb}</p>}
                      </div>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand-100 text-forest-900 transition-colors duration-200 group-hover:bg-purple-600 group-hover:text-white" aria-hidden><ArrowUpRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none" /></span>
                    </div>
                    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      {where.length > 0 ? <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-900"><span className="size-1.5 rounded-full bg-forest-500" aria-hidden />Available for {where.map(([, n]) => n).join(", ")}</span> : <span className="text-xs font-semibold text-forest-900">Request this industry</span>}
                      {places.length > 0 && <span className="text-xs">Includes {places.slice(0, 3).join(", ")}{places.length > 3 ? " and more" : ""}</span>}
                    </p>
                    {sub.length > 0 && <p className="relative z-10 mt-3 flex flex-wrap gap-1.5">{sub.slice(0, 4).map((n) => <Link key={n.name} href={`/custom-list?category=${i.slug}&categoryText=${encodeURIComponent(n.name)}`} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900 hover:bg-purple-100">{n.name}</Link>)}</p>}
                  </li>
                );
              })}
              <li className="flex min-w-0 flex-col justify-center rounded-2xl border border-dashed border-forest-500/50 p-5">
                <p className="display text-[1.4rem] leading-tight text-forest-900">Don&apos;t see your industry?</p>
                <p className="mt-1 text-sm">New industries are added over time.</p>
                <Link href="/request-category" className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">Ask for yours <ArrowUpRight className="size-4" aria-hidden /></Link>
              </li>
            </ul>
            {shown.length === 0 && <p className="mt-4 text-sm">No industry matches &ldquo;{q}&rdquo;. <Link href="/request-category" className="font-semibold underline">Ask for it</Link>.</p>}
          </div>

          <div id="panel-locations" role="tabpanel" aria-labelledby="tab-locations" hidden={tab !== "locations"}>
            <p className="mb-5 max-w-2xl text-sm">Only places where we have recorded real inventory are listed. Each page is a view of the national list for that industry.</p>
            <GeoExplorer tree={tree} industries={industries} productCats={productCats} countryProducts={countryProducts} />
          </div>
        </div>
      </div>
    </section>
  );
}
