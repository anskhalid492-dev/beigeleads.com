import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { BENCH_CATEGORIES, publishedBenchmarks } from "@/lib/benchmarks";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

const TITLE = "B2B Data & Outreach Benchmarks";
const DESC = "Research-backed benchmarks for email outreach, B2B data quality, lead generation and sales prospecting. Every figure is sourced.";
// No page-level robots setting: the site-wide noindex stays until launch.
const metadataRaw: Metadata = { title: { absolute: `${TITLE} | BeigeLeads` }, description: DESC, alternates: { canonical: "/benchmarks" }, openGraph: { title: TITLE, description: DESC, url: "/benchmarks", type: "website" } };
export const metadata: Metadata = fitMeta(metadataRaw);

const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

export default function BenchmarksPage() {
  const live = publishedBenchmarks();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: TITLE, url: `${SITE_URL}/benchmarks`, description: DESC }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Benchmarks", href: "/benchmarks" }]} /></div>
      <section className={`${wrap} pb-6 pt-4`}>
        <div className="rounded-[2rem] bg-forest-900 p-7 text-sand-100 sm:p-12">
          <h1 className="display max-w-[18ch] text-[2.8rem] leading-[0.95] text-sand-50 sm:text-[4.2rem]">{TITLE}</h1>
          <p className="mt-4 max-w-[56ch] text-lg text-sand-200">Explore research-backed benchmarks for email outreach, data quality, lead generation, and sales prospecting.</p>
          <nav aria-label="Benchmark categories" className="mt-7 flex flex-wrap gap-2">
            {BENCH_CATEGORIES.filter((c) => live.some((b) => b.category === c.slug)).map((c) => <a key={c.slug} href={`#${c.slug}`} className="inline-flex h-10 items-center rounded-full border border-sand-300/50 px-4 text-sm font-semibold text-sand-50 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">{c.name}</a>)}
          </nav>
        </div>
      </section>


      {BENCH_CATEGORIES.map((c) => {
        const items = live.filter((b) => b.category === c.slug);
        if (!items.length) return null;
        return (
          <section key={c.slug} id={c.slug} className={`${wrap} scroll-mt-24 py-8`} aria-labelledby={`h-${c.slug}`}>
            <h2 id={`h-${c.slug}`} className="display text-[1.7rem] leading-tight text-forest-900 sm:text-[2.1rem]">{c.name}</h2>
            <p className="mt-1 max-w-[60ch] text-forest-700">{c.text}</p>
            <ul className="mt-5 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
              {items.map((b) => (
                <li key={b.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-4">
                  <Link href={`/benchmarks/${b.slug}`} className="font-semibold text-forest-900 underline-offset-4 hover:underline">{b.title}</Link>
                  <span className="text-sm text-forest-700">{b.report?.summary.split(". ")[0]}.</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

    </>
  );
}
