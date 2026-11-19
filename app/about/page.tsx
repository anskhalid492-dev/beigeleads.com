import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { FOUNDER } from "@/lib/about-content";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About BeigeLeads: the story behind the lists",
  description: "How years of client acquisition work led founder Anus to build BeigeLeads: ready-made and custom B2B contact lists you pay for once and own.",
  alternates: { canonical: "/about" },
  robots: { index: false, follow: true }, // site-wide noindex until launch
};

export default function About() {
  return (
    <>
      <Breadcrumbs items={[{ name: "About", href: "/about" }]} />
      <AboutPage />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AboutPage", name: "About BeigeLeads", url: `${SITE_URL}/about`,
        about: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL, founder: { "@type": "Person", name: FOUNDER.name, jobTitle: FOUNDER.role } },
      }} />
    </>
  );
}
