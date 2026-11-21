import type { Metadata } from "next";
import { AiBenefits, AiDfy, AiFeatures, AiFinalCta, AiHero, AiLanguages, AiLimits, AiMemory, AiOffers, AiSteps4 } from "@/components/ai-assistant/sections";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { AI_DESC, AI_V2_FAQS, AI_TITLE } from "@/lib/ai-assistant-content";
import { SITE_URL } from "@/lib/site";

// No page-level robots setting: the site-wide noindex in app/layout.tsx stays until launch (CLAUDE.md section 50).
export const metadata: Metadata = {
  title: { absolute: AI_TITLE },
  description: AI_DESC,
  alternates: { canonical: "/ai-assistant" },
  openGraph: { title: AI_TITLE, description: AI_DESC, url: "/ai-assistant", type: "website" },
  twitter: { card: "summary_large_image", title: AI_TITLE, description: AI_DESC },
};

export default function AiAssistantPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "BeigePilot AI Assistant", url: `${SITE_URL}/ai-assistant`, description: AI_DESC, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "AI Assistant", href: "/ai-assistant" }]} /></div>
      <AiHero />
      <AiFeatures />
      <AiSteps4 />
      <AiLanguages />
      <AiMemory />
      <AiOffers />
      <AiDfy />
      <AiBenefits />
      <AiLimits />
      <SolutionFaq name="BeigePilot" items={AI_V2_FAQS} />
      <AiFinalCta />
    </>
  );
}
