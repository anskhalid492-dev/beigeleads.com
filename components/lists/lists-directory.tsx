"use client";
import { Building2, Globe2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DbBadge } from "@/components/shared/db-icon";
import type { GeoTree, ShopProduct } from "@/lib/shop";
import { GeoExplorer } from "./geo-explorer";


type Industry = { slug: string; name: string; blurb: string };
type Props = { industries: Industry[]; tree: GeoTree; products: ShopProduct[]; niches: { category: string; name: string }[]; productCats: Record<string, string[]> };
const TABS = [["industries", "By industry", Building2], ["locations", "By location", Globe2]] as const;
type Tab = (typeof TABS)[number][0];

/** The directory: every industry, a country -> state -> city explorer, and prospect types. Real data only. */
export function ListsDirectory({ industries, tree, products, niches, productCats }: Props) {
  const [tab, setTab] = useState<Tab>("industries");
  useEffect(() => {
    const on = () => { const h = window.location.hash.slice(1); if (h === "industries" || h === "locations") setTab(h); };
    const t = setTimeout(on, 0);
    window.addEventListener("hashchange", on);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", on); };
  }, []);
  const go = (t: Tab) => { setTab(t); window.history.replaceState(null, "", `#${t}`); };

  return (
    <section id="directory" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display text-[2rem] leading-none text-forest-900 sm:text-[2.6rem]">Explore by industry or location</h2>
        <div role="tablist" aria-label="Directory" className="inline-flex rounded-full border border-sand-300 bg-sand-100 p-1">
          {TABS.map(([k, label, Icon]) => (
            <button key={k} id={`tab-${k}`} role="tab" type="button" aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => go(k)} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${tab === k ? "bg-forest-900 text-sand-50" : "text-forest-900 hover:bg-white"}`}><Icon className="size-4" aria-hidden />{label}</button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div id="panel-industries" role="tabpanel" aria-labelledby="tab-industries" hidden={tab !== "industries"}>
          <ul className="grid gap-x-10 md:grid-cols-2">
            {industries.map((i) => {
              const where = products.filter((p) => p.categorySlug === i.slug).map((p) => p.countryName);
              const sub = niches.filter((n) => n.category === i.slug);
              const places = tree.flatMap((c) => [...c.regions, ...c.cities].filter((x) => x.cats.includes(i.slug)).map((x) => x.name));
              return (
                <li key={i.slug} className="group relative border-b border-sand-300 py-5 transition-colors hover:bg-sand-100/60">
                  <div className="flex items-center gap-4"><DbBadge category={i.slug} size="lg" /><div className="min-w-0"><h3 className="display text-2xl leading-tight text-forest-900"><Link href={`/lists/${i.slug}`} className="after:absolute after:inset-0">{i.name}</Link></h3><p className="text-sm">{i.blurb}</p></div></div>
                  <p className="mt-4 text-sm"><span className="font-semibold text-forest-900">{where.length ? `Available for ${[...new Set(where)].join(", ")}` : "Request this industry"}</span>{places.length > 0 && <> · includes {places.slice(0, 3).join(", ")}{places.length > 3 ? " and more" : ""}</>}</p>
                  {sub.length > 0 && <p className="relative z-10 mt-3 flex flex-wrap gap-1.5">{sub.slice(0, 5).map((n) => <Link key={n.name} href={`/custom-list?category=${i.slug}&categoryText=${encodeURIComponent(n.name)}`} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-forest-900 ring-1 ring-sand-300 hover:bg-purple-100">{n.name}</Link>)}</p>}
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-sm">More industries are added over time. <Link href="/request-category" className="font-semibold underline">Ask for yours</Link>.</p>
        </div>

        <div id="panel-locations" role="tabpanel" aria-labelledby="tab-locations" hidden={tab !== "locations"}>
          <p className="mb-5 max-w-2xl text-sm">Start with a country and narrow down to a state or city. Only places where we have recorded real inventory are listed. Each page is a view of the national list for that industry.</p>
          <GeoExplorer tree={tree} industries={industries} productCats={productCats} />
        </div>

      </div>
    </section>
  );
}
