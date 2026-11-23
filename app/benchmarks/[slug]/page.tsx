import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BenchCard } from "@/components/benchmarks/card";
import { ReadingProgress } from "@/components/blog/client";
import { InlineCta } from "@/components/blog/inline-cta";
import { Share } from "@/components/blog/share";
import { Toc } from "@/components/blog/toc";
import { Md } from "@/components/benchmarks/md";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { SideCta } from "@/components/blog/side-cta";
import { BENCHMARKS, BENCH_CATEGORIES, benchAlt, benchImage, benchMinutes, publishedBenchmarks } from "@/lib/benchmarks";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

// Drafts are never rendered: a page exists only for a published record with verified, cited data (CLAUDE.md section 138).
const find = (slug: string) => BENCHMARKS.find((x) => x.slug === slug && x.status === "published" && x.report);
export function generateStaticParams() { return publishedBenchmarks().map((b) => ({ slug: b.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = find((await params).slug);
  if (!b?.report) return {};
  const r = b.report;
  const images = [{ url: benchImage(b.slug), width: 1600, height: 900, alt: benchAlt(b) }];
  return fitMeta({
    title: { absolute: `${r.seoTitle} | BeigeLeads` }, description: r.seoDesc, alternates: { canonical: `/benchmarks/${b.slug}` },
    openGraph: { title: r.seoTitle, description: r.seoDesc, url: `/benchmarks/${b.slug}`, type: "article", images },
    twitter: { card: "summary_large_image", title: r.seoTitle, description: r.seoDesc, images: [benchImage(b.slug)] },
  });
}
const num = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BenchmarkPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = find((await params).slug);
  if (!b?.report) notFound();
  const r = b.report;
  const col = r.table.bar?.col;
  const max = col === undefined ? 0 : Math.max(...r.table.rows.map((row) => num(row[col])));
  const related = r.related.map((s) => find(s)).filter((x): x is NonNullable<typeof x> => !!x);
  const cat = BENCH_CATEGORIES.find((c) => c.slug === b.category);
  const url = `${SITE_URL}/benchmarks/${b.slug}`;
  const minutes = benchMinutes(r);
  const long = r.long;
  const TOC = [{ id: "summary", text: "Benchmark summary", level: 2 }, { id: "data", text: "The data", level: 2 }, { id: "mean", text: "What the findings mean", level: 2 },
    ...(long?.sections.map((x) => ({ id: x.id, text: x.heading, level: 2 })) ?? []), ...(long?.faq.length ? [{ id: "faq", text: "Frequently asked questions", level: 2 }] : []),
    { id: "method", text: "Methodology and limitations", level: 2 }];
  return (
    <>
      <ReadingProgress />
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Article", headline: b.title, description: r.seoDesc, datePublished: r.reviewed, dateModified: r.reviewed,
        author: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL }, publisher: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL },
        mainEntityOfPage: url, image: [`${SITE_URL}${benchImage(b.slug)}`], citation: r.source.url,
      }} />
      {long?.faq.length ? <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: long.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\*\*|\[([^\]]+)\]\([^)]*\)/g, "$1") } })) }} /> : null}
      <Breadcrumbs wide items={[{ name: "Benchmarks", href: "/benchmarks" }, ...(cat ? [{ name: cat.name, href: `/benchmarks#${cat.slug}` }] : []), { name: b.title, href: `/benchmarks/${b.slug}` }]} />
      <article className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-4xl">
          {cat ? <p><Link href={`/benchmarks#${cat.slug}`} className="inline-block rounded-full border border-forest-700/30 bg-forest-100 px-3 py-1 text-sm font-bold text-forest-900 hover:bg-forest-500 hover:text-white">{cat.name}</Link></p> : null}
          <h1 className="display mt-3 text-4xl text-forest-900 sm:text-6xl lg:text-7xl">{b.title}</h1>
          <div className="mt-5 flex items-center gap-3 border-y border-sand-200 py-4">
            <img src="/brand/svg/beigeleads-symbol-light.svg" alt="" width={52} height={52} className="size-[52px] rounded-xl" />
            <p className="text-sm leading-snug"><span className="text-base font-bold text-forest-900">By BeigeLeads</span><br />Compiled from published research · Source: <a href={r.source.url} rel="noopener noreferrer" target="_blank" className="font-semibold text-forest-900 underline underline-offset-2">{r.source.name}</a></p>
          </div>
          <p className="mt-5 max-w-3xl text-lg sm:text-xl">{r.summary}</p>
          <p className="mt-3 text-sm">Reviewed {fmtDate(r.reviewed)} · {minutes} min read</p>
        </header>
        <figure className="mx-auto mt-8 w-full max-w-5xl">
          <img src={benchImage(b.slug)} alt={benchAlt(b)} width={1600} height={900} fetchPriority="high" decoding="async" className="aspect-[16/9] w-full rounded-3xl object-cover" />
        </figure>

        <div className="mx-auto mt-10 grid max-w-6xl gap-x-10 gap-y-6 lg:grid-cols-[3rem_minmax(0,44rem)_15rem] lg:justify-center">
          <div className="hidden lg:block"><div className="sticky top-32"><Share url={url} title={b.title} vertical /></div></div>
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <div className="mb-8 lg:hidden"><Toc items={TOC} /></div>
            <div id="article-body" className="prose-bl">
              <h2 id="summary">Benchmark summary</h2>
              <dl className="grid gap-3 sm:grid-cols-3">
                {r.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl border border-sand-200 bg-white p-4">
                    <dt className="text-sm font-semibold leading-snug text-forest-700">{s.label}</dt>
                    <dd className="display mt-1 text-[2.2rem] leading-none text-forest-900">{s.value}</dd>
                    {s.note ? <p className="mt-2 text-sm leading-snug">{s.note}</p> : null}
                  </div>
                ))}
              </dl>

              <h2 id="data">The data</h2>
              {col !== undefined ? (
                <ul aria-hidden="true" className="!list-none space-y-3 rounded-2xl border border-sand-200 bg-white !p-5 text-sm">
                  {r.table.rows.map((row) => (
                    <li key={row[0]} className="!mt-3 grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-3 sm:grid-cols-[10rem_1fr_auto]">
                      <span className="truncate text-forest-900">{row[0]}</span>
                      <span className="h-3 rounded-full bg-sand-100"><span className="block h-3 rounded-full bg-forest-500" style={{ width: `${max ? Math.max(2, (num(row[col]) / max) * 100) : 0}%` }} /></span>
                      <span className="font-semibold text-forest-900">{row[col]}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="table-wrap">
                <table>
                  <caption className="pb-2 text-left text-sm">{r.table.caption}</caption>
                  <thead><tr>{r.table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
                  <tbody>{r.table.rows.map((row) => <tr key={row[0]}>{row.map((c, i) => i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>)}</tr>)}</tbody>
                </table>
              </div>

              <h2 id="mean">What the findings mean</h2>
              {r.meaning.map((m) => <p key={m}>{m}</p>)}

              {long?.sections.map((x) => (<section key={x.id}><h2 id={x.id}>{x.heading}</h2><Md text={x.body} /></section>))}
              {long?.faq.length ? (
                <section>
                  <h2 id="faq">Frequently asked questions</h2>
                  {long.faq.map((f) => (<div key={f.q}><h3>{f.q}</h3><Md text={f.a} /></div>))}
                </section>
              ) : null}

              <h2 id="method">Methodology and limitations</h2>
              <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-sand-200 bg-white p-5 text-base sm:grid-cols-[8rem_1fr]">
                {([["Source", <a key="s" href={r.source.url} rel="noopener noreferrer" target="_blank">{r.source.title} ({r.source.name})</a>], ["Published", r.source.published], ["Data period", r.source.period], ["Population", r.source.population], ["Definition", r.source.definition], ["Last reviewed", fmtDate(r.reviewed)]] as [string, React.ReactNode][]).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="font-bold text-forest-900">{k}</dt><dd>{v}</dd></div>
                ))}
              </dl>
              <h3>Limitations</h3>
              <ul>{r.limits.map((l) => <li key={l}>{l}</li>)}</ul>
              <p className="text-base">BeigeLeads did not collect this data. Figures are reproduced as the source states them; check the original before relying on them.</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-sand-200 pt-6 lg:hidden"><span className="text-sm font-semibold text-forest-900">Share</span><Share url={url} title={b.title} /></div>
            <InlineCta cta={{ title: r.cta.label, text: r.cta.text, label: r.cta.label, href: r.cta.href }} />
            <p className="mt-8"><Link href="/benchmarks" className="text-sm font-semibold text-forest-900 underline underline-offset-4">← Back to all benchmarks</Link></p>
          </div>
          <aside className="hidden lg:col-start-3 lg:row-start-1 lg:block">
            <div className="sticky top-32 space-y-6">
              <Toc items={TOC} />
              <SideCta cta={{ title: r.cta.label, text: r.cta.text, label: r.cta.label, href: r.cta.href }} />
            </div>
          </aside>
        </div>

        {related.length ? (
          <section className="mx-auto mt-16 max-w-6xl" aria-labelledby="rel">
            <h2 id="rel" className="display text-4xl text-forest-900">Related benchmarks</h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-3">{related.map((x) => <li key={x.slug}><BenchCard b={x} /></li>)}</ul>
          </section>
        ) : null}
      </article>
    </>
  );
}
