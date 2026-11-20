"use client";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Flag, StateFlag } from "@/components/shared/db-icon";
import { usState } from "@/lib/us-states";
import type { GeoTree } from "@/lib/shop";

type Props = { tree: GeoTree; industries: { slug: string; name: string }[]; productCats: Record<string, string[]> };
const tile = "flex w-full items-center justify-between gap-3 rounded-2xl border border-sand-300 bg-white px-4 py-3 text-left text-sm font-semibold text-forest-900 transition hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";

/** Country -> state or region -> city. Lists only places with REAL recorded inventory; links go to the geography landing pages. */
export function GeoExplorer({ tree, industries, productCats }: Props) {
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [find, setFind] = useState("");
  const name = useMemo(() => new Map(industries.map((i) => [i.slug, i.name])), [industries]);
  const c = tree.find((x) => x.slug === country);
  const r = c?.regions.find((x) => x.slug === region);
  const ct = c?.cities.find((x) => x.slug === city && (x.regionSlug ?? "") === (r?.slug ?? ""));
  const q = find.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);
  const reset = (to: "all" | "country" | "region") => { setFind(""); if (to === "all") { setCountry(""); setRegion(""); setCity(""); } else if (to === "country") { setRegion(""); setCity(""); } else setCity(""); };

  const placeCats = ct ? ct.cats : r ? r.cats : c ? [...new Set([...(productCats[c.slug] ?? []), ...c.regions.flatMap((x) => x.cats), ...c.cities.flatMap((x) => x.cats)])] : [];
  const base = c ? `/lists` : "";
  const hrefFor = (cat: string) => `${base}/${cat}/${c!.slug}${r ? `/${r.slug}` : ""}${ct ? `/${ct.slug}` : ""}`;
  const cityRegionless = c?.cities.filter((x) => !x.regionSlug) ?? [];
  const cityList = r ? c!.cities.filter((x) => x.regionSlug === r.slug) : [];

  return (
    <div className="rounded-[2rem] border border-sand-300 bg-white p-5 sm:p-8">
      <nav aria-label="Location" className="flex flex-wrap items-center gap-1 text-sm">
        <button type="button" onClick={() => reset("all")} className={`font-semibold ${country ? "underline" : "text-forest-900"}`}>All countries</button>
        {c && <><ChevronRight className="size-4" aria-hidden /><button type="button" onClick={() => reset("country")} className={`font-semibold ${region || city ? "underline" : "text-forest-900"}`}>{c.name}</button></>}
        {r && <><ChevronRight className="size-4" aria-hidden /><button type="button" onClick={() => reset("region")} className={`font-semibold ${city ? "underline" : "text-forest-900"}`}>{r.name}</button></>}
        {ct && <><ChevronRight className="size-4" aria-hidden /><span className="font-semibold text-forest-900">{ct.name}</span></>}
      </nav>

      {(!c || (!r && !ct && (c.regions.length + cityRegionless.length > 6)) || (r && cityList.length > 6)) && (
        <div className="mt-4"><label htmlFor="geo-find" className="sr-only">Search places</label><input id="geo-find" value={find} onChange={(e) => setFind(e.target.value)} placeholder={c ? "Search places" : "Search countries"} className="h-10 w-full max-w-sm rounded-xl border border-sand-300 px-3 text-sm focus-visible:outline-2 focus-visible:outline-purple-600" /></div>
      )}

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          {!c ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {tree.filter((x) => match(x.name)).map((x) => {
                const has = (productCats[x.slug] ?? []).length > 0 || x.regions.length > 0 || x.cities.length > 0;
                return <li key={x.slug}><button type="button" className={tile} onClick={() => { reset("country"); setCountry(x.slug); }}><span className="flex items-center gap-3"><Flag code={x.code} className="h-5 w-[30px]" />{x.name}</span><span className="text-xs font-medium">{has ? "Databases available" : "No database yet"}</span></button></li>;
              })}
            </ul>
          ) : ct ? (
            <p className="text-sm">Showing industries with recorded inventory in <strong className="text-forest-900">{ct.name}</strong>. Each page is a view of the national list for that industry.</p>
          ) : (
            <>
              <p className="mb-3 text-sm font-bold text-forest-900">{r ? `Cities in ${r.name}` : c.regions.length ? "States and regions" : "Cities"}</p>
              {!r && c.regions.length === 0 && cityRegionless.length === 0 ? (
                <div className="rounded-2xl bg-sand-100 p-5 text-sm"><p className="font-semibold text-forest-900">No states or cities are recorded for {c.name} yet.</p><p className="mt-1">{placeCats.length ? "You can still open the country pages on the right." : "No ready-made database exists for this country yet. Tell us what you need."}</p>{!placeCats.length && <Link className="mt-3 inline-flex font-semibold underline" href={`/custom-list?country=other&countryText=${encodeURIComponent(c.name)}`}>Request a {c.name} list</Link>}</div>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {(r ? cityList : c.regions).filter((x) => match(x.name)).map((x) => <li key={x.slug}><button type="button" className={tile} onClick={() => { setFind(""); if (r) setCity(x.slug); else setRegion(x.slug); }}><span className="flex items-center gap-2">{!r && c.slug === "united-states" && usState(x.name) ? <StateFlag name={x.name} className="h-4 w-6" /> : <MapPin className="size-4 text-forest-500" aria-hidden />}{x.name}</span><ChevronRight className="size-4" aria-hidden /></button></li>)}
                  {!r && cityRegionless.filter((x) => match(x.name)).map((x) => <li key={`c-${x.slug}`}><button type="button" className={tile} onClick={() => { setFind(""); setCity(x.slug); }}><span className="flex items-center gap-2"><MapPin className="size-4 text-forest-500" aria-hidden />{x.name}</span><ChevronRight className="size-4" aria-hidden /></button></li>)}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl bg-forest-900 p-5 text-sand-50">
          {!c ? (
            <><p className="display text-2xl">Pick a country to begin.</p><p className="mt-2 text-sm text-sand-200">Only places where we have recorded real inventory are listed. Anything else is a custom list request.</p></>
          ) : placeCats.length ? (
            <><p className="display text-2xl">{ct?.name ?? r?.name ?? c.name}</p><p className="mt-1 text-sm text-sand-200">Open the page for an industry</p>
              <ul className="mt-4 space-y-2">{placeCats.map((cat) => <li key={cat}><Link href={hrefFor(cat)} className="flex items-center justify-between rounded-xl bg-forest-700/70 px-4 py-3 text-sm font-semibold hover:bg-forest-700">{name.get(cat) ?? cat} in {ct?.name ?? r?.name ?? c.name}<ChevronRight className="size-4" aria-hidden /></Link></li>)}</ul></>
          ) : (
            <><p className="display text-2xl">Nothing recorded here yet.</p><p className="mt-2 text-sm text-sand-200">We do not list a place as a database until real records exist for it.</p><Link href={`/custom-list?country=other&countryText=${encodeURIComponent(c.name)}${r ? `&region=${encodeURIComponent(r.name)}` : ""}`} className="mt-4 inline-flex font-semibold underline">Build My Custom List</Link></>
          )}
        </div>
      </div>
    </div>
  );
}
