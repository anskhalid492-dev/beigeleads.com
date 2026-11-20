import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { Button } from "@/components/ui/button";
import type { GeoPageData } from "@/lib/geo/page-data";
import { PlaceSection } from "@/components/category/place-section";

const n = (x: number) => x.toLocaleString("en-US");

/** One template for the country page and every region/city page. Sections appear only when they have real content. */
export function GeoPage({ d }: { d: GeoPageData }) {
  const { c, k, product, view, copy, records, children, siblings, regions, cities, otherCategories } = d;
  const sampleHref = product ? `/sample?product=${product.slug}` : `/sample?category=${c.slug}`;
  const custom = `/custom-list?category=${c.slug}&countryText=${encodeURIComponent(k.name)}${view ? `&region=${encodeURIComponent(view.area.name)}` : ""}`;
  const places = view ? children : cities;
  return (
    <>
      <Breadcrumbs items={d.crumbs} />
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-4">
        <h1 className="display text-5xl text-forest-900 sm:text-7xl">{copy.h1}</h1>
        <p className="mt-5 max-w-2xl text-lg">{copy.intro}</p>
        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <div><dt className="font-bold text-forest-900">Records here</dt><dd>{records ? n(records) : "None recorded yet"}</dd></div>
          {product && <div><dt className="font-bold text-forest-900">Fields</dt><dd>{product.fields.join(", ")}</dd></div>}
          <div><dt className="font-bold text-forest-900">Formats</dt><dd>CSV, Excel or TXT</dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {product && <Button asChild size="lg"><Link href={`/lists/${product.slug}`}>See the {k.name} list</Link></Button>}
          <Button asChild variant="secondary" size="lg"><Link href={sampleHref}>Get a free sample</Link></Button>
          {!records && <Button asChild variant="secondary" size="lg"><Link href={custom}>Request a custom list</Link></Button>}
        </div>
        {product && <p className="mt-4 max-w-2xl text-sm">This page is a view of the {product.name}. {view ? `${view.area.name} is a part of that file, not a separate product.` : ""}</p>}
      </section>

      {!view && regions.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-6xl px-4">
          <PlaceSection title={`${c.name} Email Lists by States`} lead={`Pick a state or region in ${k.name} to see the recorded inventory there.`} places={regions} noun="states" />
        </div></section>
      )}
      {places.length > 0 && (
        <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4">
          <PlaceSection title={view ? `${c.name} Email Lists in ${view.area.name} by Cities` : `${c.name} Email Lists by Cities`} lead="Pick a city to see the recorded inventory there." places={places} noun="cities" />
        </div></section>
      )}
      {view && siblings.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-14"><div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl text-forest-900">{view.parent ? `More cities in ${view.parent.name}` : `Other ${view.area.level === "region" ? "states and regions" : "cities"}`}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">{siblings.slice(0, 24).map((s) => <li key={s.href}><Link href={s.href} className="inline-flex rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{s.name}</Link></li>)}</ul>
        </div></section>
      )}
      {otherCategories.length > 0 && (
        <section className="border-t border-sand-200 py-14"><div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-3xl text-forest-900">Other industries {view ? `in ${view.area.name}` : `in ${k.name}`}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">{otherCategories.map((o) => <li key={o.slug}><Link href={`${d.path.replace(`/lists/${c.slug}`, `/lists/${o.slug}`)}`} className="inline-flex rounded-full border border-sand-300 bg-sand-50 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:border-forest-900">{o.name}{o.records ? ` (${n(o.records)})` : ""}</Link></li>)}</ul>
        </div></section>
      )}
      <Faq heading={`${copy.h1}: questions`} items={copy.faqs} />
    </>
  );
}
