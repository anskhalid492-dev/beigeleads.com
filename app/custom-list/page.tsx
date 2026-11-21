import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CustomListBuilder } from "@/components/custom-list/builder";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq, type FaqItem } from "@/components/shared/faq";
import { JsonLd } from "@/components/shared/json-ld";
import { getCategories } from "@/lib/catalog";
import { SITE_URL } from "@/lib/site";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = {
  title: "Custom B2B contact list builder",
  description: "Build a custom B2B contact list: choose industries, locations and data fields, then request a quotation. We review feasibility and reply by email.",
  alternates: { canonical: "/custom-list" },
  robots: { index: false, follow: true }, // site-wide noindex until launch approval
};

const STEPS: readonly [string, string][] = [
  ["Define your prospects", "Tell us who you want to reach."],
  ["Customize your data", "Select locations, quantities, and fields."],
  ["We review feasibility", "Our team checks sourcing possibilities."],
  ["Receive your quotation", "We follow up with available options and pricing."],
];

const FAQS: readonly FaqItem[] = [
  ["Can I request industries not listed on BeigeLeads?", "Yes. Type any industry in the builder. Our ready-made lists are listed on the Lists page, and a custom request lets you ask for anything else. We tell you whether we can source it."],
  ["Can I target multiple countries?", "Yes. Add as many countries as you need in one request, and narrow each by state, province or city. Our ready-made lists cover the United States today, so for other countries we tell you honestly whether we can source them."],
  ["Can I request specific job titles?", "Yes. Add the titles you care about. Titles are a request: we check what we can source for your prospects and tell you what is possible."],
  ["Is requesting a quotation free?", "Yes. Submitting a request is free and you do not need an account. Nothing is charged when you send it."],
  ["Are all requested data fields guaranteed?", "No. Field availability depends on whether we can source it for your prospects. We confirm which fields are possible when we reply."],
  ["How is custom-list pricing determined?", "Pricing is confirmed after review, once we know what we can source. The builder shows no price estimate, because any number before review would be a guess."],
  ["What happens after I submit?", "We save your request, give you a request reference, and our team reviews your requirements. We then contact you by email about availability and pricing. A request is not an order."],
  ["Can I modify my request?", "Yes. Before you send it, you can go back to any step and change it. After you send it, contact us with your request reference and we will update it."],
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CustomListPage(props: { searchParams: Promise<SP> }) {
  const sp = await props.searchParams;
  const initial = {
    q: one(sp.q).slice(0, 300),
    category: one(sp.category).slice(0, 80),
    categoryText: one(sp.categoryText).slice(0, 120),
    quantity: one(sp.quantity).replace(/[^\d]/g, "").slice(0, 9),
    country: one(sp.country).slice(0, 40),
    countryText: one(sp.countryText).slice(0, 80),
    region: one(sp.region).slice(0, 120),
  };
  return (
    <>
      <Breadcrumbs items={[{ name: "Custom list", href: "/custom-list" }]} />
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <p className="text-sm font-bold uppercase tracking-wide text-forest-500">Custom B2B data solutions</p>
        <h1 className="display mt-2 text-5xl text-forest-900 sm:text-6xl">Build the exact business list you need.</h1>
        <p className="mt-3 max-w-2xl text-lg">Choose your target businesses, locations, and data fields. Tell us what you&apos;re looking for, and we&apos;ll review your requirements and provide a custom quotation.</p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16" aria-label="Custom list builder">
        <Suspense>
          <CustomListBuilder categories={getCategories().map((c) => ({ slug: c.slug, name: c.name }))} initial={initial} />
        </Suspense>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">How Custom List Requests Work</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-sand-200 bg-white p-5">
              <span aria-hidden className="grid size-8 place-items-center rounded-full bg-forest-100 text-sm font-bold text-forest-900">{i + 1}</span>
              <h3 className="mt-3 font-bold text-forest-900">{t}</h3>
              <p className="mt-1 text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm">
          Want something ready now? <Link href="/lists" className="font-semibold underline underline-offset-4">Browse available lists</Link>, <Link href="/sample" className="font-semibold underline underline-offset-4">request a free sample</Link> or read <Link href="/verification" className="font-semibold underline underline-offset-4">how we verify data</Link>.
        </p>
      </section>
      <Faq items={FAQS} heading="Custom list questions" />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Custom B2B contact list builder", url: `${SITE_URL}/custom-list`, description: "Request a custom B2B contact list by industry, location and data fields." }} />
    </>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
