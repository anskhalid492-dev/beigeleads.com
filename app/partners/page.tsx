import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { PartnerForm } from "@/components/partners/form";
import { PartnerApplySection, PartnerHero, PartnerIntro, PartnerSteps, PartnerTerms } from "@/components/partners/sections";
import { SolutionFaq } from "@/components/solutions/sections";
import { PARTNER_FAQS } from "@/lib/partners/content";
import { SITE_URL } from "@/lib/site";

import { fitMeta } from "@/lib/seo/fit";
const TITLE = "Data Reseller Partner Program — 50% Off Databases | BeigeLeads";
const DESC = "Apply to become a BeigeLeads Data Reseller Partner. Approved partners receive 50% off database purchases. Applications reviewed within 7 days.";

const metadataRaw: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  keywords: ["data reseller program", "B2B data reseller", "business email list reseller", "data reseller partnership", "wholesale business databases"],
  alternates: { canonical: "/partners" },
  openGraph: { title: TITLE, description: DESC, url: "/partners", type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
  robots: { index: false, follow: true }, // site-wide noindex until launch (TODO-BEFORE-LAUNCH.md)
};

export default function PartnersPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Data Reseller Partners", url: `${SITE_URL}/partners`, description: DESC, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs items={[{ name: "Data Reseller Partners", href: "/partners" }]} wide /></div>
      <PartnerHero />
      <PartnerIntro />
      <PartnerSteps />
      <PartnerApplySection><PartnerForm /></PartnerApplySection>
      <PartnerTerms />
      <SolutionFaq name="the Data Reseller Partner Program" items={PARTNER_FAQS} />
    </>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
