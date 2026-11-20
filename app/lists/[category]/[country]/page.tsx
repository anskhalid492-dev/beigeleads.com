import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hydrateCatalog } from "@/lib/catalog-db";
import { ProductPageView, productMetadata } from "@/components/product/product-page";
import { productForPlace } from "@/lib/place-product";
import { GeoPage } from "@/components/geo/geo-page";
import { loadGeoPage } from "@/lib/geo/page-data";
import { GeoShopPage } from "@/components/category/geo-shop";
import { countryFromFlat, geoShopMetadata } from "@/lib/geo-shop";
import { TaxonomyPage } from "@/components/lists/taxonomy-page";
import { loadListsData } from "@/lib/lists-data";
import { isTaxGroup, resolveTax, taxIndustries, taxMetadata } from "@/lib/taxonomy-route";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/lists/[category]/[country]">): Promise<Metadata> {
  const { category, country } = await props.params;
  const flat = countryFromFlat(category);
  if (flat && country === "cities") return geoShopMetadata(flat, "cities");
  if (await isTaxGroup(category)) { const t = await resolveTax(category, country); return t ? taxMetadata(t) : {}; }
  await hydrateCatalog();
  const pp = productForPlace(category, country);
  if (pp) return { ...productMetadata(pp.product.slug), alternates: { canonical: `/lists/${category}/${country}` } };
  const d = await loadGeoPage(category, country, []);
  if (!d) return {};
  // Indexable pages inherit the site-wide setting (noindex until launch); thin pages are always noindex.
  return { title: d.copy.title, description: d.copy.description, alternates: { canonical: d.path }, ...(d.indexable ? {} : { robots: { index: false, follow: true } }) };
}

export default async function CountryPage(props: PageProps<"/lists/[category]/[country]">) {
  const { category, country } = await props.params;
  const flat = countryFromFlat(category);
  if (flat && country === "cities") return <GeoShopPage country={flat} products={(await loadListsData()).products} view="cities" />;
  if (await isTaxGroup(category)) {
    const t = await resolveTax(category, country);
    if (!t) notFound();
    return <TaxonomyPage {...t} products={(await loadListsData()).products} industries={taxIndustries()} />;
  }
  await hydrateCatalog();
  const pp = productForPlace(category, country);
  if (pp) return <ProductPageView slug={pp.product.slug} />;
  const d = await loadGeoPage(category, country, []);
  if (!d) notFound();
  return <GeoPage d={d} />;
}
