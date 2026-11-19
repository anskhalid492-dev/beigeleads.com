import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { ContactForm } from "@/components/contact/form";
import { QuickLinks, SupportCards, TrustStrip } from "@/components/contact/sections";
import { SITE_URL } from "@/lib/site";

const DESC = "Questions about business contact lists, an existing order, payments or custom data? Send BeigeLeads a message and get a reference number and confirmation email.";

export const metadata: Metadata = {
  title: "Contact BeigeLeads | Questions, orders and custom data",
  description: DESC,
  alternates: { canonical: "/contact" },
  robots: { index: false, follow: true }, // site-wide noindex until launch (TODO-BEFORE-LAUNCH.md)
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const sp = await searchParams;
  const type = (Array.isArray(sp.type) ? sp.type[0] : sp.type) ?? "";
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact BeigeLeads", url: `${SITE_URL}/contact`, description: DESC }} />
      <Breadcrumbs items={[{ name: "Contact", href: "/contact" }]} wide />
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-2 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:px-8">
        <div className="hero-in min-w-0 lg:pt-4">
          <h1 className="display text-6xl text-forest-900 sm:text-7xl">Let&rsquo;s Talk About What You Need.</h1>
          <p className="mt-5 max-w-xl text-lg">Have a question about business contact lists, an existing order, or custom data? We&rsquo;re here to help you find the answers.</p>
          <div className="hidden lg:block"><QuickLinks /></div>
        </div>
        <div className="hero-in min-w-0 [animation-delay:120ms]">
          <ContactForm initialType={type} />
        </div>
        <div className="lg:hidden"><QuickLinks /></div>
      </section>
      <SupportCards />
      <TrustStrip />
    </>
  );
}
