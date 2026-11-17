import type { Metadata } from "next";
import { JsonLd } from "@/components/shared/json-ld";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SampleForm, type SampleOption } from "@/components/sample/form";
import { SamplePreview, type PreviewSheet } from "@/components/sample/preview";
import { Benefits, Steps, Trust, WhatYouReceive } from "@/components/sample/sections";
import { getCategories, getCategory, getCountry, getProduct, getProducts } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";
import { SITE_URL } from "@/lib/site";

const DESC = "Explore how BeigeLeads business contact lists are structured, see available fields, and request a free masked sample before purchasing.";

export const metadata: Metadata = {
  title: "Free sample of business contact lists | BeigeLeads",
  description: DESC,
  alternates: { canonical: "/sample" },
  robots: { index: false, follow: true }, // site-wide noindex until launch (TODO-BEFORE-LAUNCH.md)
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SamplePage({ searchParams }: PageProps<"/sample">) {
  const sp = await searchParams;
  const products = getProducts();
  const cats = getCategories();

  const options: SampleOption[] = products.map((p) => ({
    value: p.slug,
    label: p.title,
    group: cats.find((c) => c.slug === p.categorySlug)?.name ?? "Lists",
    fields: p.fields.length,
  }));

  // Preselect from ?product=<slug> (product pages, co-pilot) or ?category=<slug> (category pages).
  let initialProduct = getProduct(one(sp.product))?.slug ?? "";
  let initialCustom = "";
  if (!initialProduct) {
    const cat = getCategory(one(sp.category));
    if (cat) {
      const inCat = getProducts(cat.slug);
      if (inCat.length === 1) initialProduct = inCat[0].slug;
      else initialCustom = cat.name;
    }
  }

  const sheets = cats
    .map((c): PreviewSheet | null => {
      const p = products.find((x) => x.categorySlug === c.slug);
      const rows = p ? productSamples[c.slug] : undefined;
      if (!p || !rows) return null;
      return {
        slug: c.slug,
        label: c.name,
        industry: c.singular,
        country: getCountry(p.countrySlug)?.name ?? "",
        rows: rows.slice(0, 5).map((r) => ({ business: r.business, city: r.city, website: r.website, email: r.email, phone: r.phone })),
      };
    })
    .filter((s): s is PreviewSheet => !!s);

  return (
    <>
      <Breadcrumbs items={[{ name: "Free sample", href: "/sample" }]} wide />
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-2 sm:px-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-12 lg:px-8">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-forest-500">Preview before you purchase</p>
          <h1 className="display mt-2 text-6xl text-forest-900 sm:text-7xl">See the data before you make a decision.</h1>
          <p className="mt-4 max-w-2xl text-lg">{DESC}</p>
          <Benefits />
          <div className="mt-6"><SamplePreview sheets={sheets} /></div>
          <WhatYouReceive />
        </div>
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <SampleForm options={options} initialProduct={initialProduct} initialCustom={initialCustom} />
        </div>
      </section>
      <Steps />
      <Trust />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Free sample of business contact lists",
          description: DESC,
          url: `${SITE_URL}/sample`,
          isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL },
        }}
      />
    </>
  );
}
