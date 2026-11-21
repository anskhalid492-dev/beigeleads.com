import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { EvFinalCta, EvFormats, EvHero, EvPricing, EvPrivacy, EvSteps, EvStatuses, EvWhy } from "@/components/email-verification/landing";
import { EV_DESC, EV_TITLE, evFaqs } from "@/lib/ev/content";
import { loadEvSettings } from "@/lib/ev/settings";
import { SITE_URL } from "@/lib/site";

import { fitMeta } from "@/lib/seo/fit";
// No page-level robots setting: the site-wide noindex stays until launch (CLAUDE.md section 50).
export const dynamic = "force-dynamic"; // prices and limits come from the admin settings
const metadataRaw: Metadata = {
  title: { absolute: EV_TITLE },
  description: EV_DESC,
  alternates: { canonical: "/email-list-verification" },
  openGraph: { title: EV_TITLE, description: EV_DESC, url: "/email-list-verification", type: "website" },
  twitter: { card: "summary_large_image", title: EV_TITLE, description: EV_DESC },
};

export default async function EmailVerificationPage() {
  const s = await loadEvSettings(getCloudflareContext().env);
  const faqs = evFaqs(s);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: "Bulk Email List Verification", url: `${SITE_URL}/email-list-verification`, description: EV_DESC, provider: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Email List Verification", href: "/email-list-verification" }]} /></div>
      <EvHero />
      <EvWhy />
      <EvSteps />
      <EvPricing s={s} />
      <EvFormats s={s} />
      <EvStatuses />
      <EvPrivacy s={s} />
      <SolutionFaq name="Email List Verification" items={faqs} />
      <EvFinalCta />
    </>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
