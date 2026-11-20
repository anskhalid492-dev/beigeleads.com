import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SolutionFaq } from "@/components/solutions/sections";
import { JsonLd } from "@/components/shared/json-ld";
import { ProductOverview } from "@/components/product/overview";
import { productJsonLd, productMetaDescription, productTitle } from "@/lib/product-seo";
import { ProductHero } from "@/components/product/hero";
import { ProductStats } from "@/components/product/stats";
import { ProductSample } from "@/components/product/sample";
import { ProductFields } from "@/components/product/fields";
import { ProductPricing } from "@/components/product/pricing";
import { ProductAudience } from "@/components/product/audience";
import { ProductHowItWorks } from "@/components/product/how-it-works";
import { ProductQuality } from "@/components/product/quality";
import { RelatedProducts } from "@/components/product/related";
import { getCategory, getCities, getCountry, getProduct, getProductFaqs, getRelatedProducts } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";

// One reusable template (served at /lists/<product-slug>) for every list. Nothing here is specific to one product: name, stats, fields,
// sample, packages, use cases, FAQs and related lists all come from the catalog.
export function productMetadata(slug: string): Metadata {
  const p = getProduct(slug);
  if (!p) return {};
  const k = getCountry(p.countrySlug);
  const c = getCategory(p.categorySlug);
  if (!k || !c) return {};
  const title = p.seoTitle?.trim() || productTitle(p, k);
  const description = p.metaDescription?.trim() || productMetaDescription(p, c, k);
  return {
    title,
    description,
    alternates: { canonical: `/lists/${p.slug}` },
    openGraph: { title, description, url: `/lists/${p.slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function ProductPageView({ slug }: { slug: string }) {
  const p = getProduct(slug);
  if (!p) notFound();
  const c = getCategory(p.categorySlug);
  const k = getCountry(p.countrySlug);
  if (!c || !k) notFound();

  const rows = productSamples[c.slug] ?? [];
  const forSale = p.status === "live";

  return (
    <>
      <ProductHero product={p} category={c} country={k} rows={rows} forSale={forSale} />
      <ProductOverview product={p} category={c} country={k} />
      <ProductStats product={p} country={k} cityCount={getCities(k.slug).length} />
      {rows.length > 0 && <ProductSample product={p} rows={rows} />}
      <ProductFields product={p} />
      <ProductPricing product={p} forSale={forSale} />
      <ProductAudience product={p} category={c} />
      <ProductHowItWorks name={p.name} />
      <ProductQuality product={p} />
      <SolutionFaq name={`the ${p.name}`} items={getProductFaqs(p, c, k)} />
      <RelatedProducts items={getRelatedProducts(p, 12)} />
      <JsonLd data={productJsonLd(p, c, k, forSale)} />
    </>
  );
}
