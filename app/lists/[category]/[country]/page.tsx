import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CtaBand } from "@/components/shared/cta-band";
import { getCategories, getCategory, getCities, getCountries, getCountry, getProductFor } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().flatMap((c) => getCountries().map((k) => ({ category: c.slug, country: k.slug })));
}

export async function generateMetadata(props: PageProps<"/lists/[category]/[country]">): Promise<Metadata> {
  const { category, country } = await props.params;
  const c = getCategory(category);
  const k = getCountry(country);
  if (!c || !k) return {};
  return {
    title: `${c.name} in ${k.name}`,
    description: `${c.name} contact list for ${k.name}.`,
    alternates: { canonical: `/lists/${c.slug}/${k.slug}` },
    // Thin until real counts exist (CLAUDE.md section 5). Remove when this page has real data.
    robots: { index: false, follow: true },
  };
}

export default async function CountryPage(props: PageProps<"/lists/[category]/[country]">) {
  const { category, country } = await props.params;
  const c = getCategory(category);
  const k = getCountry(country);
  if (!c || !k) notFound();

  const product = getProductFor(c.slug, k.slug);
  const cities = getCities(k.slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Lists", href: "/lists" },
          { name: c.name, href: `/lists/${c.slug}` },
          { name: k.name, href: `/lists/${c.slug}/${k.slug}` },
        ]}
      />
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">
          {c.name} in {k.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg">{c.description}</p>
        {product && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/product/${product.slug}`}>Open the list page</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={`/sample?product=${product.slug}`}>Get a free sample</Link>
            </Button>
          </div>
        )}
      </section>

      {cities.length > 0 && (
        <section className="border-t border-sand-200 bg-sand-100 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="display text-4xl text-forest-900 sm:text-5xl">By city</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link
                    href={`/lists/${c.slug}/${k.slug}/${city.slug}`}
                    className="block rounded-xl border border-sand-300 bg-sand-50 px-5 py-4 font-semibold text-forest-900 hover:border-forest-900"
                  >
                    {c.name} in {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
