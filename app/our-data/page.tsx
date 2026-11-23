import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { Accuracy, Coverage, Delivery, FinalCta, Freshness, Hero, Industries, Inside, Privacy, Roles, Sourcing, Stats, Verification } from "@/components/our-data/sections";
import { loadOurData } from "@/lib/our-data/settings";
import { loadOurDataFacts } from "@/lib/our-data/facts";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

// No robots setting here: the site-wide noindex in app/layout.tsx stays until launch (CLAUDE.md section 50).
export async function generateMetadata(): Promise<Metadata> {
  const s = await loadOurData(getCloudflareContext().env);
  return fitMeta({
    title: { absolute: s.seoTitle },
    description: s.seoDescription,
    alternates: { canonical: "/our-data" },
    openGraph: { title: s.seoTitle, description: s.seoDescription, url: "/our-data", type: "website" },
    twitter: { card: "summary_large_image", title: s.seoTitle, description: s.seoDescription },
  });
}

export default async function OurDataPage() {
  const s = await loadOurData(getCloudflareContext().env);
  if (!s.published) notFound();
  const f = await loadOurDataFacts();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Our Data", url: `${SITE_URL}/our-data`, description: s.seoDescription, isPartOf: { "@type": "WebSite", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Our Data", href: "/our-data" }]} /></div>
      <Hero s={s} />
      <Stats s={s} f={f} />
      <Inside />
      <Coverage f={f} />
      <Industries />
      <Roles />
      <Sourcing />
      <Verification />
      <Accuracy s={s} />
      <Freshness f={f} />
      <Delivery />
      <Privacy />
      <SolutionFaq name="Our Data" items={s.faqs.map((x) => [x.q, x.a] as const)} />
      <FinalCta />
    </>
  );
}
