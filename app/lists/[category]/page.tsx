import type { Metadata } from "next";
import Link from "next/link";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SampleTable } from "@/components/shared/sample-table";
import { Faq } from "@/components/shared/faq";
import { getCategory, getCountries, getCountry, getProducts } from "@/lib/catalog";
import { sampleSheets } from "@/lib/sample-data";
import { PlaceDirectory } from "@/components/geo/city-directory";
import { getDb } from "@/lib/db";
import { coverageFor, listAllCities, listAreas, regionTotals } from "@/lib/geo/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/lists/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  const c = getCategory(category);
  if (!c) return {};
  return {
    title: `${c.name} contact lists`,
    description: `${c.description} See a masked sample first, then pay once and download the file.`,
    alternates: { canonical: `/lists/${c.slug}` },
  };
}

export default async function CategoryPage(props: PageProps<"/lists/[category]">) {
  const { category } = await props.params;
  const c = getCategory(category);
  if (!c) notFound();

  const products = getProducts(c.slug);
  const countries = getCountries();
  const sheet = sampleSheets[c.slug];

  // Real places per country (empty until the owner imports geography). Only the first country is expanded to keep the page light.
  const db = getDb();
  const geo = await Promise.all(countries.map(async (k) => {
    const regions = (await listAreas(db, k.slug, null)).filter((a) => a.level === "region");
    const tot = await regionTotals(db, c.slug, regions);
    const cities = await listAllCities(db, k.slug, 60);
    const cov = await coverageFor(db, c.slug, cities.map((a) => a.id));
    const base = `/lists/${c.slug}/${k.slug}`;
    return {
      k,
      regions: regions.map((a) => ({ name: a.name, href: `${base}/${a.slug}`, records: tot.get(a.id) ?? null })),
      cities: cities.map((a) => ({ name: a.name, href: `${base}${a.regionSlug ? `/${a.regionSlug}` : ""}/${a.slug}`, records: cov.get(a.id) ?? null })),
    };
  }));

  return (
    <>
      <Breadcrumbs items={[{ name: "Lists", href: "/lists" }, { name: c.name, href: `/lists/${c.slug}` }]} />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">{c.name}</h1>
        <p className="mt-4 max-w-xl text-lg">{c.description}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={`/sample?category=${c.slug}`}>Get a free sample</Link>
          </Button>
        </div>
      </section>

      {sheet && (
        <section className="border-y border-sand-200 bg-sand-100 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900 sm:text-5xl">What a {c.name.toLowerCase()} list looks like</h2>
            <div className="mt-8">
              <SampleTable rows={sheet.rows} />
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Lists available</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/product/${p.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-sand-300 bg-sand-100 p-6 transition-colors hover:border-forest-900 hover:bg-forest-900"
              >
                <span className="flex items-center gap-4">
                  <DbBadge category={p.categorySlug} country={getCountry(p.countrySlug)?.code} />
                  <span className="display text-3xl text-forest-900 group-hover:text-sand-50">{p.title}</span>
                </span>
                <span className="mt-6 text-sm text-forest-700 group-hover:text-sand-200">
                  {p.status === "draft" ? "Placeholder list. Not for sale yet." : "Open list page"}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="display mt-14 text-3xl text-forest-900">Browse by country</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {countries.map((k) => (
            <li key={k.slug}>
              <Link
                href={`/lists/${c.slug}/${k.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50"
              >
                <Flag code={k.code} /> {k.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {geo.map((g) => (g.regions.length || g.cities.length) ? (
        <section key={g.k.slug} className="border-t border-sand-200 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900 sm:text-5xl">{c.name} in {g.k.name}, by place</h2>
            {g.regions.length > 0 && (<><h3 className="mt-8 text-xl font-bold text-forest-900">By state or region</h3><div className="mt-4"><PlaceDirectory places={g.regions} label="Search states or regions" empty="No state or region matches." /></div></>)}
            {g.cities.length > 0 && (<><h3 className="mt-10 text-xl font-bold text-forest-900">By city</h3><div className="mt-4"><PlaceDirectory places={g.cities} label="Search cities" empty="No city matches." /></div></>)}
          </div>
        </section>
      ) : null)}

      <section className="border-t border-sand-200 bg-sand-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-4xl text-forest-900 sm:text-5xl">Who buys these lists</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {c.buyers.map((b) => (
              <li key={b} className="rounded-xl border border-sand-300 bg-sand-50 px-5 py-4 font-medium text-forest-900">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Faq
        heading={`${c.name} lists: questions`}
        items={[
          ["Can I see the data first?", "Yes. Each list page shows a masked sample, and you can ask for a free sample file by email."],
          ["Do I need an account?", "No. You pay once in crypto and receive a download link by email."],
          ["What if my country is not listed?", "Request it. New countries and cities are added over time."],
        ]}
      />
    </>
  );
}
