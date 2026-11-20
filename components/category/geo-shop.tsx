import Link from "next/link";
import { Check, FileSpreadsheet, MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Flag } from "@/components/shared/db-icon";
import { SolutionFaq } from "@/components/solutions/sections";
import { CityCollection, type CityItem } from "@/components/category/city-collection";
import { Block, UseCases } from "@/components/category/blocks";
import { wrap } from "@/components/category/parts";
import { getCategory, getDefaultSample, sampleRowsOf } from "@/lib/catalog";
import type { ShopProduct } from "@/lib/shop";

export const geoShopPath = (countrySlug: string) => `/lists/${countrySlug}-business-email-lists`;

const faqs = (k: string, hasFull: boolean): [string, string][] => [
  ["What data is included?", `Each record can include business name, address, city, country, phone, email and website. The fields on each database page list exactly what is in that file.`],
  ["Can I preview the contacts?", "Yes. Every database page shows a masked sample, and you can request a free sample by email."],
  ["How current is the data?", "Our team re-verifies all data every 60 days and checks emails with in-house SMTP tests. Each database page shows when it was last verified."],
  [`Can I target specific cities in ${k}?`, `Yes. Each city has its own database. ${hasFull ? "The full-country database covers every city together." : ""}`.trim()],
  ["How does one-time pricing work?", "You pay once per database, in crypto. Packages and prices are on each database page. There is no subscription."],
  ["How is the list delivered?", "By email, as a link to your file in CSV, Excel or TXT format. No account is needed."],
  ["Can I send marketing email to these contacts?", `Rules for emailing businesses differ by country, and ${k} has its own. You are responsible for lawful use. Read our lawful use policy and GDPR page, and get legal advice for your campaign. We are not a law firm.`],
];

/** Shopping landing page for a country: full-country database, then every city database. No pricing here (packages live on product pages). */
export function GeoShopPage({ country, products, view = "main" }: { country: { slug: string; name: string; code: string }; products: ShopProduct[]; view?: "main" | "cities" }) {
  const k = country.name;
  const path = geoShopPath(country.slug);
  const full = products.find((p) => p.countrySlug === country.slug && p.scope === "country" && p.categorySlug === "business");
  const cityProducts = products.filter((p) => p.countrySlug === country.slug && p.scope === "city");
  const others = products.filter((p) => p.countrySlug === country.slug && p.scope !== "city" && p !== full);
  const cities: CityItem[] = cityProducts.map((p) => ({ slug: p.slug, city: p.name.replace(/ Business Email List$/, ""), name: p.name, title: p.title, description: p.description ?? p.title, fields: p.fields, recordCount: p.recordCount, coverage: `${p.name.replace(/ Business Email List$/, "")}, ${k}`, href: `/lists/${p.slug}`, forSale: p.status === "live" }));
  const rows = full ? sampleRowsOf(full.slug) : getDefaultSample();
  const industry = getCategory("business");
  const crumbs = [{ name: "Lists", href: "/lists" }, { name: `${k} Business Email Lists`, href: path }, ...(view === "cities" ? [{ name: "Cities", href: `${path}/cities` }] : [])];
  const primary = full ? { label: `Get the Full ${k} Database`, href: `/lists/${full.slug}` } : { label: `Browse ${k} Lists by City`, href: "#cities" };
  const fmt = (n: number | null) => (n === null ? "Count to be confirmed" : n.toLocaleString("en-US"));
  return (
    <>
      <Breadcrumbs items={crumbs} />
      {view === "main" && (
        <section className={`${wrap} pb-4 pt-2`}>
          <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-sand-300 bg-sand-100 p-6 sm:p-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-12 lg:p-12">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-bold text-forest-500"><Flag code={country.code} className="h-3.5 w-5" />{k} business contact databases</p>
              <h1 className="display cat-in mt-3 text-[2.9rem] leading-[0.95] text-forest-900 sm:text-[4.4rem]">{k} Business Email Lists</h1>
              <p className="mt-4 max-w-[52ch] text-lg">Ready-made business contact databases for {k}: one file for the whole country, or a dedicated database for each city. Preview a masked sample, then pay once and keep the file.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={primary.href} className="inline-flex h-12 items-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{primary.label}</Link>
                {full && cities.length > 0 && <Link href="#cities" className="inline-flex h-12 items-center rounded-full border border-forest-900 px-6 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Browse {k} Lists by City</Link>}
              </div>
              <ul className="mt-6 space-y-2">{["One full-country database", "A database for every city", "Pay once, no subscription"].map((x) => <li key={x} className="flex items-center gap-2.5 font-semibold text-forest-900"><span className="grid size-5 place-items-center rounded-full bg-forest-100"><Check className="size-3" aria-hidden /></span>{x}</li>)}</ul>
            </div>
            <div className="overflow-hidden rounded-2xl border border-forest-700 bg-forest-900 shadow-[0_30px_70px_-30px_rgba(15,42,29,0.7)]" aria-label="Masked sample preview">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><span className="truncate font-mono text-xs text-sand-300">{full?.slug ?? "preview"}</span><span className="rounded-full bg-forest-100 px-2.5 py-0.5 text-[0.7rem] font-semibold text-forest-900">Masked sample</span></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[24rem] text-left text-[0.8rem]"><thead><tr className="text-forest-300">{["Business", "City", "Email"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-semibold">{h}</th>)}</tr></thead>
                <tbody>{rows.slice(0, 5).map((r) => <tr key={r.business} className="border-t border-white/10 text-sand-100"><td className="whitespace-nowrap px-4 py-2.5 font-medium text-sand-50">{r.business}</td><td className="whitespace-nowrap px-4 py-2.5">{r.city}</td><td className="whitespace-nowrap px-4 py-2.5 font-mono">{r.email}</td></tr>)}</tbody></table></div>
              <p className="border-t border-white/10 bg-black/20 px-4 py-2.5 text-xs text-sand-300">Real rows, masked. CSV · Excel · TXT</p>
            </div>
          </div>
        </section>
      )}

      {view === "main" && full && (
        <section className="py-12 sm:py-14"><div className={wrap}>
          <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">Full {k} Database</h2>
          <div className="mt-8 grid gap-6 rounded-[2rem] border-2 border-forest-900 bg-white p-6 sm:p-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              <p className="text-sm font-bold text-forest-500">Featured database</p>
              <h3 className="display mt-1 text-[2.2rem] leading-none text-forest-900 sm:text-[2.8rem]">{k} Business Email Database: Full Country</h3>
              <p className="mt-3 max-w-[56ch]">{full.description}</p>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Data fields">{full.fields.slice(0, 8).map((f) => <li key={f} className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-3 py-1 text-sm font-medium text-forest-900"><Check className="size-3 text-forest-500" aria-hidden />{f}</li>)}</ul>
            </div>
            <div className="flex flex-col justify-between gap-5 rounded-2xl bg-sand-100 p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-3"><dt>Contacts</dt><dd className="display text-2xl text-forest-900">{fmt(full.recordCount)}</dd></div>
                <div className="flex items-baseline justify-between gap-3"><dt className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />Coverage</dt><dd className="font-semibold text-forest-900">All of {k}</dd></div>
                <div className="flex items-baseline justify-between gap-3"><dt className="flex items-center gap-1.5"><FileSpreadsheet className="size-4" aria-hidden />Formats</dt><dd className="font-semibold text-forest-900">CSV, Excel, TXT</dd></div>
                <div className="flex items-baseline justify-between gap-3"><dt>Masked preview</dt><dd className="font-semibold text-forest-900">Available</dd></div>
                <div className="flex items-baseline justify-between gap-3"><dt>Status</dt><dd className="font-semibold text-forest-900">{full.status === "live" ? "Available to buy" : "Preview only"}</dd></div>
              </dl>
              <Link href={`/lists/${full.slug}`} className="inline-flex h-12 items-center justify-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">Get the Full {k} Database</Link>
            </div>
          </div>
        </div></section>
      )}

      {cities.length > 0 && (
        <section id="cities" className="scroll-mt-28 border-y border-sand-200 bg-sand-100 py-12 sm:py-14"><div className={wrap}>
          <h2 className="display text-[2.1rem] leading-[1.02] text-forest-900 sm:text-[2.9rem]">{k} Business Email Lists by City</h2>
          <p className="mt-3 max-w-[60ch]">Every city database has its own page with a masked sample and packages.</p>
          <div className="mt-8"><CityCollection items={cities} countryName={k} /></div>
          {view === "main" && <p className="mt-6 text-sm"><Link className="font-semibold text-forest-900 underline decoration-purple-600 decoration-2 underline-offset-4" href={`${path}/cities`}>Open the city collection on its own page</Link></p>}
        </div></section>
      )}

      {others.length > 0 && view === "main" && (
        <Block title={`More ${k} Databases`} lead="Databases for a specific industry or region.">
          <ul className="grid gap-3 sm:grid-cols-2">{others.map((p) => <li key={p.slug}><Link href={`/lists/${p.slug}`} className="block rounded-2xl border border-sand-300 bg-white p-4 font-semibold text-forest-900 hover:border-forest-900">{p.name}</Link></li>)}</ul>
        </Block>
      )}

      {view === "main" && (
        <>
          <Block title={`Who Buys ${k} Business Data`} tone="sand"><UseCases items={(industry?.useCases ?? []).map((u) => [u.name, u.text] as const)} /></Block>
          <SolutionFaq name={`${k} Business Lists`} items={faqs(k, !!full)} />
        </>
      )}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: `${k} Business Email Lists`, url: `https://beigeleads.com${path}`, mainEntity: { "@type": "ItemList", itemListElement: [...(full ? [full] : []), ...cityProducts].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `https://beigeleads.com/lists/${p.slug}`, name: p.name })) } }} />
    </>
  );
}
