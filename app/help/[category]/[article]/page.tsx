import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { Feedback } from "@/components/help/feedback";
import { Body, slugify } from "@/components/help/rich";
import { Toc } from "@/components/help/toc";
import { TopicNav } from "@/components/help/topic-nav";
import { ViewPing } from "@/components/help/view-ping";
import { HELP_UPDATED, faqsOf, readingMinutes } from "@/lib/help";
import { articleHref, articleId, getArticle, getCategory, relatedOf } from "@/lib/help/data";
import { getHelp } from "@/lib/help/server";
import { SITE_URL } from "@/lib/site";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";

async function generateMetadataRaw(props: PageProps<"/help/[category]/[article]">): Promise<Metadata> {
  const { category, article } = await props.params;
  const a = getArticle(await getHelp(), category, article);
  if (!a) return {};
  // The site-wide noindex stays; a page can only ADD noindex here, never remove it.
  return { title: a.seoTitle || a.title, description: a.metaDescription || a.description, alternates: { canonical: articleHref(a) }, ...(a.noindex ? { robots: { index: false, follow: true } } : {}) };
}

const fmt = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

export default async function HelpArticlePage(props: PageProps<"/help/[category]/[article]">) {
  const { category, article } = await props.params;
  const d = await getHelp();
  const a = getArticle(d, category, article);
  const c = getCategory(d, category);
  if (!a || !c) notFound();
  const toc = a.body.filter((b) => b[0] === "h").map((b) => ({ id: slugify(b[1] as string), label: b[1] as string }));
  const related = relatedOf(d, a);
  const faqs = faqsOf(a);
  const updated = a.updated ?? HELP_UPDATED;
  const isPolicy = a.category === "privacy-compliance" || a.category === "troubleshooting";
  const url = `${SITE_URL}${articleHref(a)}`;

  return (
    <>
      <Breadcrumbs wide items={[{ name: "Help Center", href: "/help-center" }, { name: c.name, href: `/help/${c.slug}` }, { name: a.title, href: articleHref(a) }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-x-10 gap-y-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_14rem]">
          <aside aria-label="Topic navigation" className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2"><TopicNav data={d} category={c.slug} current={a.slug} /></div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <details className="mb-5 rounded-2xl border border-sand-200 bg-white p-4 lg:hidden">
              <summary className="cursor-pointer font-bold text-forest-900">In this topic: {c.name}</summary>
              <div className="mt-3"><TopicNav data={d} category={c.slug} current={a.slug} /></div>
            </details>

            <p className="text-sm font-bold text-forest-500">{c.name}</p>
            <h1 className="display mt-2 text-5xl text-forest-900 sm:text-6xl">{a.title}</h1>
            <p className="mt-4 text-xl text-forest-700">{a.description}</p>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" aria-hidden />{readingMinutes(a)} min read</span>
              <span>Last updated <time dateTime={updated}>{fmt(updated)}</time></span>
            </p>
            {toc.length > 1 && (
              <details className="mt-6 rounded-2xl border border-sand-200 bg-white p-4 xl:hidden">
                <summary className="cursor-pointer font-bold text-forest-900">On this page</summary>
                <ul className="mt-3 space-y-2 text-sm">{toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="underline underline-offset-4">{t.label}</a></li>)}</ul>
              </details>
            )}
            <div className="mt-8"><Body blocks={a.body} /></div>

            {a.cta && !isPolicy && (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-forest-900 p-6">
                <p className="max-w-sm text-lg font-semibold text-sand-50">Ready to take the next step?</p>
                <Link href={a.cta.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-purple-600 px-6 font-semibold text-white hover:bg-purple-700">{a.cta.label} <ArrowRight className="size-4" aria-hidden /></Link>
              </div>
            )}

            <Feedback articleId={articleId(a)} />
            <ViewPing articleId={articleId(a)} />

            {related.length > 0 && (
              <section className="mt-10 xl:hidden" aria-labelledby="rel">
                <h2 id="rel" className="display text-3xl text-forest-900">Related articles</h2>
                <ul className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
                  {related.map((r) => <li key={r.slug}><Link href={articleHref(r)} className="flex items-center justify-between gap-4 px-5 py-4 font-semibold text-forest-900 hover:bg-sand-50">{r.title}<ArrowRight className="size-4 shrink-0" aria-hidden /></Link></li>)}
                </ul>
              </section>
            )}

            <section className="mt-8 rounded-2xl border border-sand-200 bg-sand-100 p-6">
              <p className="font-bold text-forest-900">Still need help?</p>
              <p className="mt-1 text-base">Send us a message and include your order ID if you have one.</p>
              <Link href="/contact" className="mt-4 inline-flex h-10 items-center rounded-full border border-sand-300 bg-white px-5 text-sm font-semibold text-forest-900 hover:bg-sand-50">Contact support</Link>
            </section>
          </article>

          <aside aria-label="Table of contents and related resources" className="hidden xl:block">
            <div className="sticky top-28 space-y-8">
              {toc.length > 1 && <Toc items={toc} />}
              {related.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-forest-900">Related articles</p>
                  <ul className="mt-3 space-y-2 text-sm">{related.map((r) => <li key={r.slug}><Link href={articleHref(r)} className="underline-offset-4 hover:text-forest-900 hover:underline">{r.title}</Link></li>)}</ul>
                </div>
              )}
              <div className="text-sm">
                <p className="font-bold text-forest-900">Need a person?</p>
                <Link href="/contact" className="mt-2 inline-block font-semibold text-forest-900 underline underline-offset-4">Contact support</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "TechArticle", headline: a.title, description: a.description, url, dateModified: updated, inLanguage: "en", mainEntityOfPage: url, publisher: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL }, articleSection: c.name }} />
      {faqs.length > 0 && <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "") } })) }} />}
    </>
  );
}

export async function generateMetadata(...args: Parameters<typeof generateMetadataRaw>) { return fitMeta(await generateMetadataRaw(...args)); }
