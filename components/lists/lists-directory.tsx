"use client";
import { ArrowRight, Building2, Globe2, Layers, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import type { GeoTree, ShopProduct } from "@/lib/shop";
import { GeoExplorer } from "./geo-explorer";
import { TaxIconSvg } from "./tax-icon";
import { STATUS_LABEL, type TaxGroup } from "@/lib/taxonomy";

type Industry = { slug: string; name: string; blurb: string };
type Props = { tax: TaxGroup[]; industries: Industry[]; tree: GeoTree; products: ShopProduct[]; niches: { category: string; name: string }[]; productCats: Record<string, string[]> };
const TABS = [["industries", "Industries", Building2], ["types", "List types", Layers], ["locations", "Locations", Globe2], ["audience", "Prospects", Layers]] as const;
type Tab = (typeof TABS)[number][0];

/** The directory: every industry, a country -> state -> city explorer, and prospect types. Real data only. */
export function ListsDirectory({ tax, industries, tree, products, niches, productCats }: Props) {
  const [tab, setTab] = useState<Tab>("industries");
  useEffect(() => {
    const on = () => { const h = window.location.hash.slice(1); if (h === "industries" || h === "types" || h === "locations" || h === "audience") setTab(h); };
    const t = setTimeout(on, 0);
    window.addEventListener("hashchange", on);
    return () => { clearTimeout(t); window.removeEventListener("hashchange", on); };
  }, []);
  const go = (t: Tab) => { setTab(t); window.history.replaceState(null, "", `#${t}`); };

  return (
    <section id="directory" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14">
      <h2 className="display text-4xl text-forest-900">Browse the directory</h2>
      <div role="tablist" aria-label="Directory" className="mt-5 flex flex-wrap gap-2 border-b border-sand-300">
        {TABS.map(([k, label, Icon]) => (
          <button key={k} id={`tab-${k}`} role="tab" type="button" aria-selected={tab === k} aria-controls={`panel-${k}`} onClick={() => go(k)} className={`-mb-px inline-flex items-center gap-2 rounded-t-xl border border-b-0 px-5 py-3 text-sm font-semibold ${tab === k ? "border-sand-300 bg-white text-forest-900" : "border-transparent text-forest-700 hover:text-forest-900"}`}><Icon className="size-4" aria-hidden />{label}</button>
        ))}
      </div>

      <div className="rounded-b-[1.6rem] rounded-tr-[1.6rem] border border-t-0 border-sand-300 bg-white p-5 sm:p-8">
        <div id="panel-industries" role="tabpanel" aria-labelledby="tab-industries" hidden={tab !== "industries"}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((i) => {
              const where = products.filter((p) => p.categorySlug === i.slug).map((p) => p.countryName);
              const sub = niches.filter((n) => n.category === i.slug);
              const places = tree.flatMap((c) => [...c.regions, ...c.cities].filter((x) => x.cats.includes(i.slug)).map((x) => x.name));
              return (
                <li key={i.slug} className="relative rounded-[1.3rem] border border-sand-300 bg-sand-50 p-5 transition hover:border-forest-500 hover:bg-white">
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

        <div id="panel-types" role="tabpanel" aria-labelledby="tab-types" hidden={tab !== "types"}>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tax.filter((g) => g.menuVisible !== false).map((g) => (
              <li key={g.slug} className="rounded-[1.3rem] border border-sand-300 bg-sand-50 p-5">
                <div className="flex items-center justify-between gap-2"><span className="grid size-10 place-items-center rounded-xl bg-forest-900 text-forest-300"><TaxIconSvg name={g.icon} className="size-5" /></span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${g.status === "available" ? "bg-forest-100 text-forest-900" : "bg-purple-100 text-forest-900"}`}>{STATUS_LABEL[g.status]}</span></div>
                <h3 className="display mt-3 text-2xl text-forest-900"><Link href={`/lists/${g.slug}`} className="hover:underline">{g.name}</Link></h3>
                <p className="mt-1 text-sm">{g.short}</p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm">Upcoming types are not on sale yet. <Link href="/custom-list" className="font-semibold underline">Request a custom list</Link> and we will tell you what we can source lawfully.</p>
        </div>

        <div id="panel-audience" role="tabpanel" aria-labelledby="tab-audience" hidden={tab !== "audience"}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {([
              ["B2B business databases", "Contact details for businesses: name, address, phone, email, website.", "#databases", Building2, "Browse lists"],
              ["B2C consumer databases", "Not available yet. We currently sell business contact data only.", "/lists?type=b2c", Layers, "See status"],
              ["Industry-specific lists", "One industry at a time, with its own countries, states and cities.", "#industries", Layers, "Pick an industry"],
              ["Geographic contact lists", "Start from a place and see which industries have recorded inventory there.", "#locations", MapPin, "Explore places"],
            ] as const).map(([t, d, href, Icon, cta]) => (
              <li key={t} className="rounded-[1.3rem] border border-sand-300 bg-sand-50 p-6">
                <Icon className="size-6 text-forest-500" aria-hidden /><h3 className="display mt-3 text-2xl text-forest-900">{t}</h3><p className="mt-1 text-sm">{d}</p>
                {href.startsWith("#") && href !== "#databases" ? <button type="button" onClick={() => go(href.slice(1) as Tab)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-900 underline">{cta}<ArrowRight className="size-4" /></button> : <Link href={href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-900 underline">{cta}<ArrowRight className="size-4" /></Link>}
              </li>
            ))}
          </ul>
          <p className="mt-5 flex items-center gap-2 text-sm"><Flag code="US" className="h-3 w-[18px]" />Data is currently sourced for the United States.</p>
        </div>
      </div>
    </section>
  );
}
