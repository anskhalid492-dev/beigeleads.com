import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, getCountries, getProduct } from "@/lib/catalog";
import { ProductPageView, productMetadata } from "@/components/product/product-page";
import { getDb } from "@/lib/db";
import { IndustryPage } from "@/components/category/pages";
import { GeoShopPage } from "@/components/category/geo-shop";
import { countryFromFlat, geoShopMetadata } from "@/lib/geo-shop";
import { TaxonomyPage } from "@/components/lists/taxonomy-page";
import { loadListsData } from "@/lib/lists-data";
import { resolveTax, taxIndustries, taxMetadata } from "@/lib/taxonomy-route";
import { coverageFor, listAllCities, listAreas, regionTotals } from "@/lib/geo/store";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/lists/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  if (getProduct(category)) return productMetadata(category);
  const flat = countryFromFlat(category);
  if (flat) return geoShopMetadata(flat, "main");
  const tax = await resolveTax(category);
  if (tax) return taxMetadata(tax);
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
  if (getProduct(category)) return <ProductPageView slug={category} />;
  const flat = countryFromFlat(category);
  if (flat) return <GeoShopPage country={flat} products={(await loadListsData()).products} />;
  const tax = await resolveTax(category);
  if (tax) return <TaxonomyPage {...tax} products={(await loadListsData()).products} industries={taxIndustries()} />;
  const c = getCategory(category);
  if (!c) notFound();

  const countries = getCountries();

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

  // Every industry uses the shopping landing page.
  const rows = (await loadListsData()).products.filter((p) => p.categorySlug === c.slug);
  return <IndustryPage c={c} products={rows} geo={geo.map((g) => ({ name: g.k.name, regions: g.regions, cities: g.cities }))} />;
}
