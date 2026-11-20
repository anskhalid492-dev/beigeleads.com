import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hydrateCatalog } from "@/lib/catalog-db";
import { ProductPageView, productMetadata } from "@/components/product/product-page";
import { PlaceNote } from "@/components/product/place-note";
import { productForPlace } from "@/lib/place-product";
import { GeoPage } from "@/components/geo/geo-page";
import { loadGeoPage } from "@/lib/geo/page-data";
import { TaxonomyPage } from "@/components/lists/taxonomy-page";
import { loadListsData } from "@/lib/lists-data";
import { isTaxGroup, resolveTax, taxIndustries, taxMetadata } from "@/lib/taxonomy-route";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ category: string; country: string; geo: string[] }> }): Promise<Metadata> {
  const { category, country, geo } = await props.params;
  if (await isTaxGroup(category)) { const t = geo.length === 1 ? await resolveTax(category, country, geo[0]) : null; return t ? taxMetadata(t) : {}; }
  await hydrateCatalog();
  const pp = productForPlace(category, country, geo);
  if (pp) return { ...productMetadata(pp.product.slug), alternates: { canonical: pp.exact ? `/lists/${pp.product.slug}` : `/lists/${category}/${country}/${geo.join("/")}` }, ...(pp.exact ? {} : { robots: { index: false, follow: true } }) };
  const d = await loadGeoPage(category, country, geo);
  if (!d) return {};
  return { title: d.copy.title, description: d.copy.description, alternates: { canonical: d.path }, ...(d.indexable ? {} : { robots: { index: false, follow: true } }) };
}

export default async function GeoRoute(props: { params: Promise<{ category: string; country: string; geo: string[] }> }) {
  const { category, country, geo } = await props.params;
  if (await isTaxGroup(category)) {
    const t = geo.length === 1 ? await resolveTax(category, country, geo[0]) : null;
    if (!t) notFound();
    return <TaxonomyPage {...t} products={(await loadListsData()).products} industries={taxIndustries()} />;
  }
  await hydrateCatalog();
  const pp = productForPlace(category, country, geo);
  if (pp) return <>{!pp.exact && pp.placeName && <PlaceNote placeName={pp.placeName} productName={pp.product.name} href={`/lists/${pp.product.slug}`} />}<ProductPageView slug={pp.product.slug} /></>;
  const d = await loadGeoPage(category, country, geo);
  if (!d) notFound();
  return <GeoPage d={d} />;
}
