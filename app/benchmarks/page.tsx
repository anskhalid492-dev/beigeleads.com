import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { BENCHMARKS, BENCH_CATEGORIES, publishedBenchmarks } from "@/lib/benchmarks";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

const TITLE = "B2B Data & Outreach Benchmarks";
const DESC = "Research-backed benchmarks for email outreach, B2B data quality, lead generation and sales prospecting. Every figure is sourced.";
// No page-level robots setting: the site-wide noindex stays until launch.
const metadataRaw: Metadata = { title: { absolute: `${TITLE} | BeigeLeads` }, description: DESC, alternates: { canonical: "/benchmarks" }, openGraph: { title: TITLE, description: DESC, url: "/benchmarks", type: "website" } };
export const metadata: Metadata = fitMeta(metadataRaw);

const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const METHOD: [string, string][] = [
  ["First-party findings", "Aggregate figures from BeigeLeads' own operations are published only after the owner approves them, with the measurement period and what was counted."],
  ["Third-party research", "Studies by other organisations are summarised with a link to the original, its date, sample and method. BeigeLeads did not run them and does not present them as its own."],
  ["Illustrative calculators", "Anything the visitor enters is a scenario, labelled as such, and is never shown as an observed benchmark."],
  ["No source, no page", "A report without verifiable data stays a draft. It is not indexed, not in the sitemap and not cited by Pilo."],
];

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
            {BENCH_CATEGORIES.map((c) => <a key={c.slug} href={`#${c.slug}`} className="inline-flex h-10 items-center rounded-full border border-sand-300/50 px-4 text-sm font-semibold text-sand-50 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300">{c.name}</a>)}
          </nav>
        </div>
      </section>

      <section className={`${wrap} py-8`} aria-labelledby="status">
        <h2 id="status" className="display text-[1.9rem] leading-tight text-forest-900 sm:text-[2.4rem]">{live.length ? "Published research" : "Research in preparation"}</h2>
        <p className="mt-3 max-w-[64ch] text-forest-700">
          {live.length ? "Reports below have verified sources and a documented method." : "No report is published yet. We list the 20 planned benchmarks below, and each one goes live only when it has data we can source and explain. We do not publish estimates to fill a chart."}
        </p>
      </section>

      {BENCH_CATEGORIES.map((c) => {
        const items = BENCHMARKS.filter((b) => b.category === c.slug);
        return (
          <section key={c.slug} id={c.slug} className={`${wrap} scroll-mt-24 py-8`} aria-labelledby={`h-${c.slug}`}>
            <h2 id={`h-${c.slug}`} className="display text-[1.7rem] leading-tight text-forest-900 sm:text-[2.1rem]">{c.name}</h2>
            <p className="mt-1 max-w-[60ch] text-forest-700">{c.text}</p>
            <ul className="mt-5 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white">
              {items.map((b) => (
                <li key={b.slug} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-4">
                  {b.status === "published" ? <Link href={`/benchmarks/${b.slug}`} className="font-semibold text-forest-900 underline-offset-4 hover:underline">{b.title}</Link> : <span className="font-semibold text-forest-900">{b.title}</span>}
                  <span className="text-sm text-forest-700">{b.status === "published" ? "Published" : "In preparation: needs sourced data"}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className={`${wrap} py-10`} aria-labelledby="method">
        <h2 id="method" className="display text-[1.9rem] leading-tight text-forest-900 sm:text-[2.4rem]">How we collect and publish benchmarks</h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {METHOD.map(([t, d]) => <div key={t} className="rounded-2xl border border-sand-200 bg-white p-5"><dt className="font-semibold text-forest-900">{t}</dt><dd className="mt-1 text-forest-700">{d}</dd></div>)}
        </dl>
        <p className="mt-6 text-forest-700">Looking for data now? <Link href="/lists" className="font-semibold text-forest-900 underline">Browse ready-made lists</Link> or read the <Link href="/guides" className="font-semibold text-forest-900 underline">guides</Link>.</p>
      </section>
    </>
  );
}
