import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { CategoryIcon } from "@/components/help/icons";
import { HelpSearch } from "@/components/help/search";
import { articleHref, articlesIn, getArticle, helpArticles, helpCategories, plainText, startingPoints } from "@/lib/help";
import { toDoc } from "@/lib/help/search";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers about BeigeLeads business contact lists: buying, payments, delivery, data verification and custom list requests.",
  alternates: { canonical: "/help-center" },
};

const first = (t: string) => (t.length > 150 ? t.slice(0, t.lastIndexOf(" ", 150)) + "…" : t);

export default function HelpCenterPage() {
  const catName = (slug: string) => helpCategories.find((c) => c.slug === slug)?.name ?? slug;
  const docs = helpArticles.map((a) => toDoc(a, catName(a.category), plainText(a)));
  const picks = startingPoints.map((id) => { const [c, s] = id.split("/"); return getArticle(c, s); }).filter((a) => !!a);

  return (
    <>
      <Breadcrumbs items={[{ name: "Help Center", href: "/help-center" }]} wide />
      <section className="px-2 sm:px-4">
        <div className="mx-auto max-w-[96rem] rounded-[2rem] bg-gradient-to-br from-forest-900 via-forest-700 to-forest-500 px-4 pb-24 pt-16 text-center sm:px-8">
          <p className="text-sm font-bold tracking-widest text-forest-300">HELP CENTER</p>
          <h1 className="display mt-4 text-6xl !text-sand-50 sm:text-8xl">How can we help you?</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-sand-200">Find answers about business contact lists, purchasing, payments, delivery, data verification, and custom list requests.</p>
          <div className="mt-9"><HelpSearch docs={docs} categories={helpCategories.map((c) => ({ slug: c.slug, name: c.name }))} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="start">
        <h2 id="start" className="display text-4xl text-forest-900 sm:text-5xl">Helpful starting points</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {picks.map((a) => (
            <li key={a!.slug}>
              <Link href={articleHref(a!)} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-purple-600">
                <h3 className="text-lg font-bold text-forest-900">{a!.title}</h3>
                <p className="mt-2 flex-1 text-base">{first(a!.description)}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-forest-900">Read answer <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="topics" className="scroll-mt-24 bg-sand-100 py-20" aria-labelledby="topics-h">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="topics-h" className="display text-4xl text-forest-900 sm:text-5xl">Browse by topic</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helpCategories.map((c) => {
              const list = articlesIn(c.slug);
              return (
                <li key={c.slug}>
                  <Link href={`/help/${c.slug}`} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-6 transition-colors hover:border-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
                    <span className="grid size-11 place-items-center rounded-xl bg-forest-100 text-forest-700"><CategoryIcon name={c.icon} className="size-6" /></span>
                    <h3 className="mt-4 text-xl font-bold text-forest-900">{c.name}</h3>
                    <p className="mt-1 flex-1 text-base">{c.description}</p>
                    <span className="mt-4 text-sm font-bold text-forest-900">{list.length} articles</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Couldn&apos;t find what you&apos;re looking for?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg">Send us a message, or tell us about the list you need.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="inline-flex h-12 items-center rounded-full bg-purple-600 px-8 font-semibold text-white hover:bg-purple-700">Contact support</Link>
          <Link href="/custom-list" className="inline-flex h-12 items-center rounded-full border border-sand-300 bg-white px-8 font-semibold text-forest-900 hover:bg-sand-100">Request a custom list</Link>
        </div>
      </section>
    </>
  );
}
