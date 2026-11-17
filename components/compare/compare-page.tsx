import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { compareHref, compareTitle } from "@/lib/compare";
import { US, type Comparison } from "@/lib/compare-data";
import { compareFaqs, visibleRows } from "@/lib/compare-view";
import { SITE_URL } from "@/lib/site";

const cell = "block px-4 py-3 align-top md:table-cell before:mb-1 before:block before:text-xs before:font-semibold before:text-forest-500 before:content-[attr(data-label)] md:before:hidden";
const card = "rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";

// What we can say about where the data comes from: the owner's sourcing statement (CLAUDE.md section 21). No numbers.
const SOURCES = ["Business listings and maps", "Company websites", "Public government registries", "Business directories", "Licensed data providers", "Public professional profiles", "Surveys", "Our own research"] as const;
const PIPELINE = [
  ["Collect", "Our team gathers raw business data from the sources above."],
  ["Enrich", "We fill gaps: owners, tech stack and emails, from published addresses, pattern inference and waterfall enrichment."],
  ["Verify", "Every email goes through our own SMTP checks."],
  ["Organize", "Records are cleaned and sorted by category, place and fields."],
  ["Re-verify", "All data is re-verified every 60 days."],
] as const;

export function ComparePage({ c }: { c: Comparison }) {
  const title = compareTitle(c.name);
  const rows = visibleRows(c);
  const glance = rows.slice(0, 4);
  const faqs = compareFaqs(c);
  const group = c.slug === "subscription-tools";
  const them = group ? "Subscription tools" : c.name;
  return (
    <>
      <Breadcrumbs items={[{ name: "Compare", href: "/compare" }, { name: title, href: compareHref(c.slug) }]} />
      <main>
        {/* 1. Hero */}
        <section className="px-2 sm:px-4">
          <div className="mx-auto max-w-[96rem] rounded-[2rem] bg-forest-900 px-4 py-16 text-center sm:py-24">
            <h1 className="display text-5xl text-sand-50 sm:text-7xl">
              BeigeLeads <span className="text-sand-300">vs</span> {them}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-sand-100">
              Looking for business contacts without another subscription? See how BeigeLeads lets you inspect a list, pay once and own the file, with data you can trace back to its sources.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/lists">Browse lead lists</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/sample">Get a free sample</Link></Button>
            </div>
            <p className="mt-5 text-sm text-sand-200">One-time purchase · No subscription · No account · Free masked sample first</p>
          </div>
        </section>

        {/* 2. Intro + at-a-glance */}
        <section aria-labelledby="intro" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="intro" className={h2}>Business contacts from sources you can trace</h2>
            <p className="mt-5 text-lg">
              BeigeLeads is a marketplace for ready-made business contact lists. Our team collects the data from named public and licensed sources, verifies every email in-house and re-verifies it every 60 days. You buy a list once, no account needed.
            </p>
            <p className="mt-4">
              {group ? "Subscription tools sell ongoing access to a database." : `${c.about}`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/verification">See how we verify</Link></Button>
              <Button asChild variant="secondary"><Link href="/data-sources">Where our data comes from</Link></Button>
            </div>
          </div>
          <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-md sm:p-6">
            <div className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 text-center text-sm font-bold text-forest-900">
              <span />
              <span className="rounded-lg bg-forest-900 px-2 py-2 text-sand-50">BeigeLeads</span>
              <span className="rounded-lg bg-sand-100 px-2 py-2">{them}</span>
            </div>
            <dl className="mt-3 divide-y divide-sand-200 text-sm">
              {glance.map((r) => (
                <div key={r.label} className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 py-3">
                  <dt className="font-semibold text-forest-900">{r.label}</dt>
                  <dd className="rounded-md bg-forest-100/60 p-2">{r.us}</dd>
                  <dd className="p-2">{r.them}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 3. Why different */}
        <section aria-labelledby="diff" className="border-y border-sand-200 bg-sand-100 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="diff" className={`${h2} text-center`}>Why BeigeLeads is different</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg">
              {group ? "Subscription tools rent you access." : `${them} sells access to a platform.`} BeigeLeads sells you the list.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className={card}><h3 className="text-xl font-bold text-forest-900">You own the file</h3><p className="mt-2">{US.model} {US.delivery}</p></div>
              <div className={card}><h3 className="text-xl font-bold text-forest-900">You see it before you pay</h3><p className="mt-2">{US.sample} Check the fields and the layout first, then choose a package.</p></div>
              <div className={card}><h3 className="text-xl font-bold text-forest-900">You get a written promise</h3><p className="mt-2">{US.guarantee}</p></div>
            </div>
          </div>
        </section>

        {/* 4. Trust: data sources */}
        <section aria-labelledby="trust" className="mx-auto max-w-6xl px-4 py-20">
          <h2 id="trust" className={h2}>Data you can trust starts with where it comes from</h2>
          <p className="mt-4 max-w-3xl text-lg">
            We do not resell a black box. Every list is built by our team from the sources below, then checked by us before it reaches you.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="Data sources">
            {SOURCES.map((s) => <li key={s} className="rounded-full border border-sand-300 bg-white px-4 py-1.5 text-sm font-medium text-forest-900">{s}</li>)}
          </ul>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {PIPELINE.map(([t, d], i) => (
              <li key={t} className={card}>
                <span className="grid size-8 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold text-forest-900">{t}</h3>
                <p className="mt-1 text-sm">{d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="secondary"><Link href="/data-sources">Read our data sources</Link></Button>
            <Button asChild variant="secondary"><Link href="/legal/refund-replacement">Replacement policy</Link></Button>
          </div>
        </section>

        {/* 5. When to use each */}
        <section aria-labelledby="choose" className="border-y border-sand-200 bg-sand-100 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="choose" className={`${h2} text-center`}>When to use each tool</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-lg">The right choice depends on how you work.</p>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className={`${card} border-2 border-forest-900`}>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-forest-900">Recommended for one-time list buyers</span>
                <h3 className="mt-3 text-2xl font-bold text-forest-900">Choose BeigeLeads if</h3>
                <ul className="mt-3 space-y-2">{c.chooseUs.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="text-forest-500">✓</span>{t}</li>)}</ul>
                <Button asChild className="mt-6"><Link href="/sample">Get a free sample</Link></Button>
              </div>
              <div className={card}>
                <h3 className="mt-3 text-2xl font-bold text-forest-900">Choose {them} if</h3>
                <ul className="mt-3 space-y-2">{c.chooseThem.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="text-forest-500">✓</span>{t}</li>)}</ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Table */}
        <section aria-labelledby="table" className="mx-auto max-w-6xl px-4 py-20">
          <h2 id="table" className={`${h2} text-center`}>{title}: feature comparison</h2>
          <div className="mt-8 overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm md:text-base">
              <caption className="sr-only">{title}: feature comparison</caption>
              <thead className="sr-only md:not-sr-only md:table-header-group">
                <tr className="text-forest-900">
                  <th scope="col" className="px-4 py-4 font-semibold md:w-1/5">Feature</th>
                  <th scope="col" className="bg-forest-900 px-4 py-4 text-sand-50 md:w-2/5">BeigeLeads</th>
                  <th scope="col" className="bg-sand-100 px-4 py-4 md:w-2/5">{them}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {rows.map((r) => (
                  <tr key={r.label} className="block md:table-row">
                    <th scope="row" className={`${cell} font-semibold text-forest-900 before:hidden`}>{r.label}</th>
                    <td data-label="BeigeLeads" className={`${cell} bg-forest-100/50`}>{r.us}</td>
                    <td data-label={them} className={cell}>{r.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 text-center"><Button asChild size="lg"><Link href="/lists">Explore available lists</Link></Button></div>
        </section>

        {/* 7. Pricing */}
        <section aria-labelledby="pricing" className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-6 rounded-[2rem] bg-sand-100 p-8 md:grid-cols-2 md:p-12">
            <h2 id="pricing" className={h2}>Transparent pricing, no sales call required</h2>
            <div>
              <p className="text-lg">Every list has its own page with fixed packages, so you see the price of the list you want before you check out. No seats, no credits, nothing that renews.</p>
              <p className="mt-3">Need something that is not in the catalog? Describe it and we reply by email with what is possible. Sending a request is free.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild><Link href="/pricing">See pricing</Link></Button>
                <Button asChild variant="secondary"><Link href="/custom-list">Request a custom list</Link></Button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Final CTA */}
        <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-[2rem] bg-forest-900 p-8 text-center text-sand-50 sm:p-12">
            <h2 id="cta" className="display text-4xl sm:text-6xl">Why pay for another subscription when you just need the list?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sand-200">Explore ready-made business contact lists, preview available data, and purchase only what you need.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/lists">Find my leads</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/sample">Get a free sample</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Faq items={faqs} heading={`Questions about BeigeLeads vs ${them}`} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE_URL}${compareHref(c.slug)}` }} />
    </>
  );
}
