import { hydrateCatalog } from "@/lib/catalog-db";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getCategory, getCountries, getProduct } from "@/lib/catalog";
import { ProductPageView, productMetadata } from "@/components/product/product-page";
import { getDb } from "@/lib/db";
import { IndustryPage } from "@/components/category/pages";
import { ImportedCategoryPage, listsLabel } from "@/components/category/imported-page";
import { GeoShopPage } from "@/components/category/geo-shop";
import { countryFromFlat, geoShopMetadata } from "@/lib/geo-shop";
import { TaxonomyPage } from "@/components/lists/taxonomy-page";
import { loadListsData } from "@/lib/lists-data";
import { resolveTax, taxIndustries, taxMetadata } from "@/lib/taxonomy-route";
import { LocalBusinessesPage, LOCAL_DESC, LOCAL_PATH, LOCAL_TITLE } from "@/components/category/local-businesses-page";
import { LOCAL_SLUG } from "@/lib/import/local-business";
import { coverageFor, listAllCities, listAreas, regionTotals } from "@/lib/geo/store";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";

async function generateMetadataRaw(props: PageProps<"/lists/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  await hydrateCatalog();
  const found = getProduct(category);
  if (found && found.slug !== category) return {};
  if (found) return productMetadata(category);
  const flat = countryFromFlat(category);
  if (flat) return geoShopMetadata(flat, "main");
  const tax = await resolveTax(category);
  if (tax) return taxMetadata(tax);
  if (category === LOCAL_SLUG) {
    const any = (await loadListsData()).products.some((x) => x.categorySlug === LOCAL_SLUG);
    return { title: LOCAL_TITLE, description: LOCAL_DESC, alternates: { canonical: LOCAL_PATH }, ...(any ? {} : { robots: { index: false, follow: true } }) };
  }
  const c = getCategory(category);
  if (!c) return {};
  return {
    title: c.imported ? listsLabel(c.name) : `${c.name} contact lists`,
    description: c.imported ? `Ready-made ${c.name.replace(/\s+lists?$/i, "").toLowerCase()} lists. See a masked sample first, then pay once and download the file.` : `${c.description} See a masked sample first, then pay once and download the file.`,
    alternates: { canonical: `/lists/${c.slug}` },
  };
}

export default async function CategoryPage(props: PageProps<"/lists/[category]">) {
  const { category } = await props.params;
  await hydrateCatalog();
  const found = getProduct(category);
  if (found && found.slug !== category) permanentRedirect(`/lists/${found.slug}`); // old slug of a renamed product
  if (found) return <ProductPageView slug={category} />;
  const flat = countryFromFlat(category);
  if (flat) return <GeoShopPage country={flat} products={(await loadListsData()).products} />;
  const tax = await resolveTax(category);
  if (tax) return <TaxonomyPage {...tax} products={(await loadListsData()).products} industries={taxIndustries()} />;
  if (category === LOCAL_SLUG) return <LocalBusinessesPage products={(await loadListsData()).products.filter((x) => x.categorySlug === LOCAL_SLUG)} />;
  const c = getCategory(category);
  if (!c) notFound();
  if (c.imported) {
    const rows = (await loadListsData()).products.filter((p) => p.categorySlug === c.slug || !!p.extraCats?.includes(c.slug));
    if (!rows.length) notFound();
    return <ImportedCategoryPage c={c} products={rows} />;
  }

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
  const rows = (await loadListsData()).products.filter((p) => p.categorySlug === c.slug || !!p.extraCats?.includes(c.slug));
  if (!rows.length) notFound(); // every list of this industry was filed elsewhere (e.g. Local Businesses Database)
  return <IndustryPage c={c} products={rows} geo={geo.map((g) => ({ name: g.k.name, regions: g.regions, cities: g.cities }))} />;
}

export async function generateMetadata(...args: Parameters<typeof generateMetadataRaw>) { return fitMeta(await generateMetadataRaw(...args)); }
