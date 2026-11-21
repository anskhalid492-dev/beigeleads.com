import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { DfyPricing } from "@/components/dfy/buy";
import { DfyCompare, DfyDetails, DfyFinalCta, DfyHero, DfyOwnership, DfyServices, DfySteps, DfyWho } from "@/components/dfy/sections";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SolutionFaq } from "@/components/solutions/sections";
import { DFY_DESC, DFY_FAQS, DFY_TITLE } from "@/lib/dfy/content";
import { loadDfySettings } from "@/lib/dfy/settings";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
// No page-level robots: the site-wide noindex stays until launch (CLAUDE.md section 50).
export const metadata: Metadata = {
  title: { absolute: DFY_TITLE }, description: DFY_DESC, alternates: { canonical: "/dfy-outbound" },
  openGraph: { title: DFY_TITLE, description: DFY_DESC, url: "/dfy-outbound", type: "website" },
};

export default async function DfyPage() {
  const { env } = getCloudflareContext();
  const s = await loadDfySettings(env);
  if (!s.enabled) return <section className="mx-auto max-w-3xl px-4 py-24 text-center"><h1 className="display text-4xl text-forest-900">DFY Outbound is not available right now</h1><p className="mt-4">Check back soon, or request a custom list.</p></section>;
  const low = Math.min(...s.packages.map((p) => p.monthlyCents));
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: DFY_FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "DFY Outbound", url: `${SITE_URL}/dfy-outbound`, description: DFY_DESC }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: "Done-for-you cold email outbound", serviceType: "Cold email outbound management", provider: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL }, url: `${SITE_URL}/dfy-outbound`, description: DFY_DESC, offers: s.packages.map((p) => ({ "@type": "Offer", name: `${p.name} DFY Outbound package`, price: (p.monthlyCents / 100).toFixed(2), priceCurrency: "USD", url: `${SITE_URL}/dfy-outbound#packages` })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: SITE_URL }, { "@type": "ListItem", position: 2, name: "DFY Outbound", item: `${SITE_URL}/dfy-outbound` }] }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "DFY Outbound", href: "/dfy-outbound" }]} /></div>
      <DfyHero low={low} />
      <DfyServices />
      <DfyWho />
      <DfySteps />
      <section id="packages" className="scroll-mt-24 bg-sand-50 py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="display text-4xl text-forest-900 sm:text-5xl">Pick your one-time package</h2><div className="mt-10"><DfyPricing s={s} /></div></div></section>
      <DfyCompare s={s} />
      <DfyOwnership s={s} />
      <DfyDetails />
      <SolutionFaq name="DFY Outbound" items={DFY_FAQS} />
      <DfyFinalCta low={low} />
    </>
  );
}
