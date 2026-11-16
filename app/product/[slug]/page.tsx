import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Faq } from "@/components/shared/faq";
import { ProductHero } from "@/components/product/hero";
import { ProductStats } from "@/components/product/stats";
import { ProductSample } from "@/components/product/sample";
import { ProductFields } from "@/components/product/fields";
import { ProductPricing } from "@/components/product/pricing";
import { ProductAudience } from "@/components/product/audience";
import { ProductHowItWorks } from "@/components/product/how-it-works";
import { ProductQuality } from "@/components/product/quality";
import { RelatedProducts } from "@/components/product/related";
import { ProductFinalCta } from "@/components/product/final-cta";
import { getCategory, getCities, getCountry, getProduct, getProductFaqs, getProducts, getRelatedProducts } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";

// One reusable template for every list. Nothing here is specific to one product: name, stats, fields,
// sample, packages, use cases, FAQs and related lists all come from the catalog.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description,
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

  const rows = productSamples[c.slug] ?? [];
  const forSale = p.status === "live";

  return (
    <>
      <ProductHero product={p} category={c} country={k} rows={rows} forSale={forSale} />
      <ProductStats product={p} country={k} cityCount={getCities(k.slug).length} />
      {rows.length > 0 && <ProductSample product={p} rows={rows} />}
      <ProductFields product={p} />
      <ProductPricing product={p} forSale={forSale} />
      <ProductAudience product={p} category={c} />
      <ProductHowItWorks />
      <ProductQuality product={p} />
      <Faq split heading={`FAQs About the ${p.name}`} items={getProductFaqs(p, c, k)} />
      <RelatedProducts items={getRelatedProducts(p)} />
      <ProductFinalCta product={p} category={c} />
    </>
  );
}
