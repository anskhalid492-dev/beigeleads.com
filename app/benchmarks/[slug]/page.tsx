import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { JsonLd } from "@/components/shared/json-ld";
import { BENCHMARKS, publishedBenchmarks } from "@/lib/benchmarks";
import { fitMeta } from "@/lib/seo/fit";
import { SITE_URL } from "@/lib/site";

// Drafts are never rendered: a page exists only for a published record with verified, cited data (CLAUDE.md section 138).
const find = (slug: string) => BENCHMARKS.find((x) => x.slug === slug && x.status === "published" && x.report);
export function generateStaticParams() { return publishedBenchmarks().map((b) => ({ slug: b.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = find((await params).slug);
  if (!b?.report) return {};
  const r = b.report;
  return fitMeta({ title: { absolute: `${r.seoTitle} | BeigeLeads` }, description: r.seoDesc, alternates: { canonical: `/benchmarks/${b.slug}` }, openGraph: { title: r.seoTitle, description: r.seoDesc, url: `/benchmarks/${b.slug}`, type: "article" } });
}
const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";
const num = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0;
const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function BenchmarkPage({ params }: { params: Promise<{ slug: string }> }) {
  const b = find((await params).slug);
  if (!b?.report) notFound();
  const r = b.report;
  const col = r.table.bar?.col;
  const max = col === undefined ? 0 : Math.max(...r.table.rows.map((row) => num(row[col])));
  const related = r.related.map((s) => find(s)).filter((x): x is NonNullable<typeof x> => !!x);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: b.title, description: r.seoDesc, dateModified: r.reviewed, mainEntityOfPage: `${SITE_URL}/benchmarks/${b.slug}`, citation: r.source.url, publisher: { "@type": "Organization", name: "BeigeLeads", url: SITE_URL } }} />
      <div className="bg-sand-50"><Breadcrumbs wide items={[{ name: "Benchmarks", href: "/benchmarks" }, { name: b.title, href: `/benchmarks/${b.slug}` }]} /></div>
      <article>
        <header className={`${wrap} pb-6 pt-4`}>
          <h1 className="display max-w-[22ch] text-[2.5rem] leading-[0.98] text-forest-900 sm:text-[3.6rem]">{b.title}</h1>
          <p className="mt-4 max-w-[62ch] text-lg text-forest-700">{r.summary}</p>
          <p className="mt-3 text-sm text-forest-700">A BeigeLeads benchmark report compiled from published research. Source: <a href={r.source.url} rel="noopener noreferrer" target="_blank" className="font-semibold text-forest-900 underline">{r.source.name}</a>. Reviewed {fmtDate(r.reviewed)}.</p>
        </header>

        <section className={`${wrap} py-6`} aria-labelledby="summary">
          <h2 id="summary" className="display text-[1.7rem] text-forest-900 sm:text-[2.1rem]">Benchmark summary</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            {r.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-sand-200 bg-white p-5">
                <dt className="text-sm font-semibold text-forest-700">{s.label}</dt>
                <dd className="display mt-1 text-[2.4rem] leading-none text-forest-900">{s.value}</dd>
                {s.note ? <p className="mt-2 text-sm text-forest-700">{s.note}</p> : null}
              </div>
            ))}
          </dl>
        </section>

        <section className={`${wrap} py-6`} aria-labelledby="data">
          <h2 id="data" className="display text-[1.7rem] text-forest-900 sm:text-[2.1rem]">The data</h2>
          {col !== undefined ? (
            <ul aria-hidden="true" className="mt-5 space-y-3 rounded-2xl border border-sand-200 bg-white p-5">
              {r.table.rows.map((row) => (
                <li key={row[0]} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_auto]">
                  <span className="truncate text-forest-900">{row[0]}</span>
                  <span className="h-3 rounded-full bg-sand-100"><span className="block h-3 rounded-full bg-forest-500" style={{ width: `${max ? Math.max(2, (num(row[col]) / max) * 100) : 0}%` }} /></span>
                  <span className="font-semibold text-forest-900">{row[col]}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
            <table className="w-full min-w-[420px] text-left text-sm">
              <caption className="p-4 text-left text-forest-700">{r.table.caption}</caption>
              <thead><tr className="border-y border-sand-200 bg-sand-100">{r.table.head.map((h) => <th key={h} scope="col" className="px-4 py-2 font-semibold text-forest-900">{h}</th>)}</tr></thead>
              <tbody>{r.table.rows.map((row) => <tr key={row[0]} className="border-b border-sand-200 last:border-0">{row.map((c, i) => i === 0 ? <th key={i} scope="row" className="px-4 py-2 font-medium text-forest-900">{c}</th> : <td key={i} className="px-4 py-2 text-forest-700">{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>

        <section className={`${wrap} py-6`} aria-labelledby="mean">
          <h2 id="mean" className="display text-[1.7rem] text-forest-900 sm:text-[2.1rem]">What the findings mean</h2>
          <div className="mt-3 max-w-[68ch] space-y-3 text-forest-700">{r.meaning.map((m) => <p key={m}>{m}</p>)}</div>
        </section>

        <section className={`${wrap} py-6`} aria-labelledby="method">
          <h2 id="method" className="display text-[1.7rem] text-forest-900 sm:text-[2.1rem]">Methodology and limitations</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 rounded-2xl border border-sand-200 bg-white p-5 text-sm sm:grid-cols-[10rem_1fr]">
            {([["Source", <a key="s" href={r.source.url} rel="noopener noreferrer" target="_blank" className="font-semibold text-forest-900 underline">{r.source.title} ({r.source.name})</a>], ["Published", r.source.published], ["Data period", r.source.period], ["Population", r.source.population], ["Definition", r.source.definition], ["Last reviewed", fmtDate(r.reviewed)]] as [string, React.ReactNode][]).map(([k, v]) => (
              <div key={k} className="contents"><dt className="font-semibold text-forest-900">{k}</dt><dd className="text-forest-700">{v}</dd></div>
            ))}
          </dl>
          <h3 className="mt-6 font-semibold text-forest-900">Limitations</h3>
          <ul className="mt-2 max-w-[68ch] list-disc space-y-1 pl-5 text-forest-700">{r.limits.map((l) => <li key={l}>{l}</li>)}</ul>
          <p className="mt-4 max-w-[68ch] text-sm text-forest-700">BeigeLeads did not collect this data. Figures are reproduced as the source states them; check the original before relying on them.</p>
        </section>

        <section className={`${wrap} py-6`}>
          <div className="rounded-2xl border border-sand-200 bg-sand-100 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <p className="max-w-[60ch] text-forest-900">{r.cta.text}</p>
            <Link href={r.cta.href} className="mt-3 inline-flex h-11 items-center rounded-full bg-purple-600 px-5 font-semibold text-white hover:bg-purple-700 sm:mt-0">{r.cta.label}</Link>
          </div>
        </section>

        {related.length ? (
          <section className={`${wrap} py-8`} aria-labelledby="rel">
            <h2 id="rel" className="display text-[1.5rem] text-forest-900">Related benchmarks</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              {related.map((x) => <li key={x.slug}><Link href={`/benchmarks/${x.slug}`} className="block rounded-2xl border border-sand-200 bg-white p-4 font-semibold text-forest-900 hover:border-forest-500">{x.title}</Link></li>)}
            </ul>
          </section>
        ) : null}
      </article>
    </>
  );
}
