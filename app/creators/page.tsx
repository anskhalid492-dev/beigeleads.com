import type { Metadata } from "next";
import { CreatorInquiryForm } from "@/components/creators/inquiry-form";
import { CreatorsFinalCta, CreatorsFormSection, CreatorsHero, CreatorsPricing, CreatorsSegments, CreatorsSteps } from "@/components/creators/sections";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { CREATOR_FAQS, CREATORS_DESC, CREATORS_TITLE } from "@/lib/creators/content";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

// No page-level robots setting: the site-wide noindex in app/layout.tsx stays until launch.
const metadataRaw: Metadata = {
  title: { absolute: CREATORS_TITLE },
  description: CREATORS_DESC,
  alternates: { canonical: "/creators" },
  openGraph: { title: CREATORS_TITLE, description: CREATORS_DESC, url: "/creators", type: "website" },
  twitter: { card: "summary_large_image", title: CREATORS_TITLE, description: CREATORS_DESC },
};
export const metadata: Metadata = fitMeta(metadataRaw);

export default function CreatorsPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Creator & Influencer Database", url: `${SITE_URL}/creators`, description: CREATORS_DESC, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: CREATOR_FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Creators", href: "/creators" }]} /></div>
      <CreatorsHero />
      <CreatorsSegments />
      <CreatorsPricing />
      <CreatorsSteps />
      <CreatorsFormSection><CreatorInquiryForm /></CreatorsFormSection>
      <SolutionFaq name="Creator database" items={CREATOR_FAQS} />
      <CreatorsFinalCta />
    </>
  );
}
