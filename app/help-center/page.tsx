import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy, ListPlus, ShieldOff } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CommonQuestions } from "@/components/help/common-questions";
import { CategoryIcon } from "@/components/help/icons";
import { HelpSearch } from "@/components/help/search";
import { JsonLd } from "@/components/shared/json-ld";
import { articleHref, articlesIn, commonQuestions, getArticle, helpArticles, helpCategories, plainText, readingMinutes, startingPoints } from "@/lib/help";
import { toDoc } from "@/lib/help/search";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers about BeigeLeads business contact lists: buying, payments, delivery, data verification and custom list requests.",
  alternates: { canonical: "/help-center" },
};

const first = (t: string) => (t.length > 120 ? t.slice(0, t.lastIndexOf(" ", 120)) + "…" : t);

const help = [
  { href: "/contact", Icon: LifeBuoy, title: "Contact support", text: "Ask a question and include your order ID if you have one." },
  { href: "/custom-list", Icon: ListPlus, title: "Request a custom list", text: "Tell us the industry, place and fields you need." },
  { href: "/opt-out", Icon: ShieldOff, title: "Remove your data", text: "Ask to be removed from our lists." },
] as const;

export default function HelpCenterPage() {
  const catName = (slug: string) => helpCategories.find((c) => c.slug === slug)?.name ?? slug;
  const docs = helpArticles.map((a) => toDoc(a, catName(a.category), plainText(a)));
  const picks = startingPoints.map((id) => { const [c, s] = id.split("/"); return getArticle(c, s); }).filter((a) => !!a);

  return (
    <>
      <Breadcrumbs items={[{ name: "Help Center", href: "/help-center" }]} wide />
      <section className="px-2 sm:px-4" aria-labelledby="hc-h1">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-gradient-to-br from-forest-900 via-forest-700 to-forest-500 px-4 pb-14 pt-12 text-center sm:px-8">
          <h1 id="hc-h1" className="display text-5xl !text-sand-50 sm:text-7xl">How can we help you?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-sand-200">Answers about buying lists, payments, delivery, data verification and custom requests. {helpArticles.length} articles, searchable as you type.</p>
          <div className="mt-7"><HelpSearch docs={docs} categories={helpCategories.map((c) => ({ slug: c.slug, name: c.name }))} /></div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 lg:px-8">
        <section id="topics" className="scroll-mt-24" aria-labelledby="topics-h">
          <h2 id="topics-h" className="display text-3xl text-forest-900 sm:text-4xl">Browse by topic</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((c) => {
              const list = articlesIn(c.slug);
              return (
                <li key={c.slug}>
                  <Link href={`/help/${c.slug}`} className="group flex h-full gap-4 rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-forest-900 hover:shadow-md focus-visible:outline-2 focus-visible:outline-purple-600">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700"><CategoryIcon name={c.icon} className="size-6" /></span>
                    <span className="min-w-0">
                      <span className="block text-lg font-bold text-forest-900">{c.name}</span>
                      <span className="mt-0.5 block text-sm">{c.description}</span>
                      <span className="mt-2 block text-xs font-bold text-forest-500">{list.length} articles</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="start">
          <h2 id="start" className="display text-3xl text-forest-900 sm:text-4xl">Getting started</h2>
          <p className="mt-1">Our editors&rsquo; picks for new buyers.</p>
          <ul className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {picks.map((a) => (
              <li key={a!.slug}>
                <Link href={articleHref(a!)} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-purple-600">
                  <span className="text-xs font-bold text-forest-500">{catName(a!.category)} · {readingMinutes(a!)} min read</span>
                  <h3 className="mt-1 text-lg font-bold text-forest-900">{a!.title}</h3>
                  <p className="mt-1 flex-1 text-sm">{first(a!.description)}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-forest-900">Read answer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="common" className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 id="common" className="display text-3xl text-forest-900 sm:text-4xl">Common questions</h2>
            <p className="mt-2">Short answers to what buyers ask most. Open one for the details.</p>
          </div>
          <CommonQuestions ids={commonQuestions} />
        </section>

        <section aria-labelledby="contact-h" className="rounded-[2rem] bg-sand-100 p-6 sm:p-8">
          <h2 id="contact-h" className="display text-3xl text-forest-900 sm:text-4xl">Couldn&apos;t find what you&apos;re looking for?</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {help.map(({ href, Icon, title, text }) => (
              <li key={href}>
                <Link href={href} className="flex h-full gap-3 rounded-2xl border border-sand-200 bg-white p-5 hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
                  <Icon className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                  <span><span className="block font-bold text-forest-900">{title}</span><span className="mt-0.5 block text-sm">{text}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "BeigeLeads Help Center", url: `${SITE_URL}/help-center`, description: "Answers about BeigeLeads business contact lists.", hasPart: helpCategories.map((c) => ({ "@type": "CollectionPage", name: c.name, url: `${SITE_URL}/help/${c.slug}` })) }} />
    </>
  );
}
