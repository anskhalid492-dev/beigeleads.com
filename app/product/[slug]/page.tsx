import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SampleTable } from "@/components/shared/sample-table";
import { FieldColumns } from "@/components/shared/field-columns";
import { Faq } from "@/components/shared/faq";
import { getCategories, getCategory, getCities, getCountry, getProduct, getProducts } from "@/lib/catalog";
import { sampleSheets } from "@/lib/sample-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: `${p.title}: see a masked sample, then pay once and download the file.`,
    alternates: { canonical: `/product/${p.slug}` },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) notFound();
  const c = getCategory(p.categorySlug);
  const k = getCountry(p.countrySlug);
  if (!c || !k) notFound();

  const cities = getCities(k.slug);
  const sheet = sampleSheets[c.slug];
  const related = getCategories().filter((x) => x.slug !== c.slug);
  const forSale = p.status === "live";

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Lists", href: "/lists" },
          { name: c.name, href: `/lists/${c.slug}` },
          { name: p.title, href: `/product/${p.slug}` },
        ]}
      />

      {/* 1. Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-8">
        <h1 className="display max-w-4xl text-6xl text-forest-900 sm:text-7xl">{p.title}</h1>
        <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-6 border-y-2 border-forest-900 py-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-forest-500">Records</dt>
            <dd className="text-xl font-bold text-forest-900">
              {p.recordCount === null ? "Not counted yet" : p.recordCount.toLocaleString("en-US")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-forest-500">Last verified</dt>
            <dd className="text-xl font-bold text-forest-900">{p.lastVerified ?? "Not verified yet"}</dd>
          </div>
          <div>
            <dt className="text-sm text-forest-500">Format</dt>
            <dd className="text-xl font-bold text-forest-900">CSV file</dd>
          </div>
        </dl>
        {!forSale && (
          <p className="mt-5 max-w-xl rounded-lg bg-forest-100 px-4 py-3 text-sm font-medium text-forest-900">
            This is a placeholder page. The list is not for sale yet.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={`/sample?product=${p.slug}`}>Request free sample</Link>
          </Button>
          <Button variant="secondary" size="lg" disabled={!forSale}>
            {forSale ? "Buy now" : "Not for sale yet"}
          </Button>
        </div>
      </section>

      {/* 2. Sample */}
      {sheet && (
        <section className="border-y border-sand-200 bg-sand-100 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900 sm:text-5xl">Sample rows</h2>
            <p className="mt-3 max-w-lg">A masked preview of the columns you get.</p>
            <div className="mt-8">
              <SampleTable rows={sheet.rows} />
            </div>
          </div>
        </section>
      )}

      {/* 3. Fields */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Fields in the file</h2>
        <div className="mt-8">
          <FieldColumns fields={p.fields} />
        </div>
      </section>

      {/* 4. Who uses it */}
      <section className="border-y border-sand-200 bg-sand-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-4xl text-forest-900 sm:text-5xl">Who buys this list</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {c.buyers.map((b) => (
              <li key={b} className="rounded-xl border border-sand-300 bg-sand-50 px-5 py-4 font-medium text-forest-900">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. Coverage */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Coverage</h2>
        <p className="mt-3 max-w-lg">
          {k.name}. City counts are added when the data is verified.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {cities.map((city) => (
            <li key={city.slug}>
              <Link
                href={`/lists/${c.slug}/${k.slug}/${city.slug}`}
                className="rounded-full border border-forest-900 px-4 py-1.5 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50"
              >
                {city.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Pricing */}
      <section className="border-y border-sand-200 bg-sand-100 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-4xl text-forest-900 sm:text-5xl">Pricing</h2>
          <p className="mt-3 max-w-xl">
            Three tiers by record count: Starter, Pro and Complete. One payment, no renewal. Prices are shown
            here once this list goes on sale.
          </p>
        </div>
      </section>

      {/* 7. FAQ */}
      <Faq
        heading="About this list"
        items={[
          ["Is the sample the real data?", "It shows the real layout with emails masked. The file you buy has every row unmasked."],
          ["How do I get the file?", "After your payment confirms, a download link arrives by email. The link expires, so save the file."],
          ["Can someone ask to be removed?", "Yes. Removed contacts are left out of future files through the opt-out page."],
        ]}
      />

      {/* 8. Related */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Related lists</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {related.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/lists/${r.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-sand-300 bg-sand-100 p-6 transition-colors hover:border-forest-900 hover:bg-forest-900"
              >
                <span className="display text-3xl text-forest-900 group-hover:text-sand-50">{r.name}</span>
                <span className="mt-6 text-sm text-forest-700 group-hover:text-sand-200">{r.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </>
  );
}
