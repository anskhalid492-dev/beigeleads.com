import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { getCategories, getCategory, getCities, getCity, getCountries, getCountry, getProductFor } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().flatMap((c) =>
    getCountries().flatMap((k) => getCities(k.slug).map((city) => ({ category: c.slug, country: k.slug, city: city.slug }))),
  );
}

export async function generateMetadata(props: PageProps<"/lists/[category]/[country]/[city]">): Promise<Metadata> {
  const { category, country, city } = await props.params;
  const c = getCategory(category);
  const k = getCountry(country);
  const t = getCity(country, city);
  if (!c || !k || !t) return {};
  return {
    title: `${c.name} in ${t.name}, ${k.name}`,
    description: `${c.name} contact list covering ${t.name}.`,
    alternates: { canonical: `/lists/${c.slug}/${k.slug}/${t.slug}` },
    // Thin until real city counts exist (CLAUDE.md section 5). Remove when this page has real data.
    robots: { index: false, follow: true },
  };
}

export default async function CityPage(props: PageProps<"/lists/[category]/[country]/[city]">) {
  const { category, country, city } = await props.params;
  const c = getCategory(category);
  const k = getCountry(country);
  const t = getCity(country, city);
  if (!c || !k || !t) notFound();

  const product = getProductFor(c.slug, k.slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { name: "Lists", href: "/lists" },
          { name: c.name, href: `/lists/${c.slug}` },
          { name: k.name, href: `/lists/${c.slug}/${k.slug}` },
          { name: t.name, href: `/lists/${c.slug}/${k.slug}/${t.slug}` },
        ]}
      />
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <h1 className="display text-6xl text-forest-900 sm:text-7xl">
          {c.name} in {t.name}
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          {t.name} businesses are part of the {k.name} {c.name.toLowerCase()} list. A separate {t.name}-only file
          will be offered when city-level data is ready.
        </p>
        {product && (
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/product/${product.slug}`}>Open the {k.name} list</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={`/sample?product=${product.slug}`}>Get a free sample</Link>
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
