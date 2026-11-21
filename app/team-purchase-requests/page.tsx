import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { TprBenefits, TprFinalCta, TprHero, TprPreview, TprRoles, TprSteps } from "@/components/team-requests/sections";
import { TPR_DESC, TPR_FAQS, TPR_TITLE } from "@/lib/team-requests-content";
import { SITE_URL } from "@/lib/site";

// No page-level robots setting: the site-wide noindex in app/layout.tsx stays until launch (CLAUDE.md section 50).
export const metadata: Metadata = {
  title: { absolute: TPR_TITLE },
  description: TPR_DESC,
  alternates: { canonical: "/team-purchase-requests" },
  openGraph: { title: TPR_TITLE, description: TPR_DESC, url: "/team-purchase-requests", type: "website" },
  twitter: { card: "summary_large_image", title: TPR_TITLE, description: TPR_DESC },
};

export default function TeamPurchaseRequestsPage() {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Team Purchase Requests", url: `${SITE_URL}/team-purchase-requests`, description: TPR_DESC, isPartOf: { "@type": "WebSite", name: "BeigeLeads", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Team Purchase Requests", href: "/team-purchase-requests" }]} /></div>
      <TprHero />
      <TprSteps />
      <TprRoles />
      <TprPreview />
      <TprBenefits />
      <SolutionFaq name="Team Purchase Requests" items={TPR_FAQS} />
      <TprFinalCta />
    </>
  );
}
