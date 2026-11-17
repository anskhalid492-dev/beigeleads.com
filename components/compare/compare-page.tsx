import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Faq } from "@/components/shared/faq";
import { JsonLd } from "@/components/shared/json-ld";
import { Button } from "@/components/ui/button";
import { compareHref, compareTitle } from "@/lib/compare";
import { CHECKED, CHECKED_LABEL, US, type Comparison } from "@/lib/compare-data";
import { SITE_URL } from "@/lib/site";

const cell = "block px-4 py-3 align-top md:table-cell before:mb-1 before:block before:text-xs before:font-semibold before:text-forest-500 before:content-[attr(data-label)] md:before:hidden";

export function ComparePage({ c }: { c: Comparison }) {
  const title = compareTitle(c.name);
  return (
    <>
      <Breadcrumbs items={[{ name: "Compare", href: "/compare" }, { name: title, href: compareHref(c.slug) }]} />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <h1 className="display text-5xl text-forest-900 sm:text-6xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-lg">{c.tagline}</p>
        <p className="mt-3 max-w-2xl rounded-2xl border border-sand-200 bg-sand-100 p-4 text-sm">
          We are a competitor, so read this with care. Everything about {c.name} comes from its own pages (linked at the bottom), read on <time dateTime={CHECKED}>{CHECKED_LABEL}</time>. Where a page did not say something, we write &ldquo;not stated&rdquo;. Plans change: check their site before you decide.
        </p>

        <section aria-labelledby="glance" className="mt-10 grid gap-4 md:grid-cols-2">
          <h2 id="glance" className="sr-only">At a glance</h2>
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="text-xl font-bold text-forest-900">{c.name}</h3>
            <p className="mt-2">{c.about}</p>
          </div>
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="text-xl font-bold text-forest-900">BeigeLeads</h3>
            <p className="mt-2">{US.model} {US.coverage}</p>
          </div>
        </section>

        <section aria-labelledby="table" className="mt-12">
          <h2 id="table" className="display text-4xl text-forest-900 sm:text-5xl">Side by side</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <table className="w-full border-collapse text-left text-sm md:text-base">
              <caption className="sr-only">{title}: feature comparison</caption>
              <thead className="sr-only md:not-sr-only md:table-header-group">
                <tr className="bg-sand-100 text-forest-900">
                  <th scope="col" className="px-4 py-3 font-semibold md:w-1/5">Topic</th>
                  <th scope="col" className="px-4 py-3 font-semibold md:w-2/5">{c.name}</th>
                  <th scope="col" className="px-4 py-3 font-semibold md:w-2/5">BeigeLeads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {c.rows.map((r) => (
                  <tr key={r.label} className="block md:table-row">
                    <th scope="row" className={`${cell} font-semibold text-forest-900 before:hidden`}>{r.label}</th>
                    <td data-label={c.name} className={cell}>{r.them}</td>
                    <td data-label="BeigeLeads" className={cell}>{r.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="choose" className="mt-12 grid gap-4 md:grid-cols-2">
          <h2 id="choose" className="sr-only">Who should choose which</h2>
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="text-xl font-bold text-forest-900">Choose {c.name} if</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5">{c.chooseThem.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="rounded-2xl border border-sand-200 bg-white p-6">
            <h3 className="text-xl font-bold text-forest-900">Choose BeigeLeads if</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5">{c.chooseUs.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>

        <section aria-labelledby="verdict" className="mt-12 rounded-2xl bg-forest-100 p-6 sm:p-8">
          <h2 id="verdict" className="display text-4xl text-forest-900">Our honest take</h2>
          <p className="mt-3 max-w-3xl text-lg">{c.verdict}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/sample">Get a free masked sample</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href="/lists">Browse lists</Link></Button>
          </div>
        </section>

        <section aria-labelledby="sources" className="mt-12">
          <h2 id="sources" className="text-xl font-bold text-forest-900">Sources (read {CHECKED_LABEL})</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {c.sources.map((s) => (
              <li key={s.url}><a href={s.url} rel="noopener noreferrer nofollow" target="_blank" className="underline underline-offset-4 hover:text-forest-900">{s.label}</a></li>
            ))}
            <li><Link href="/legal/refund-replacement" className="underline underline-offset-4 hover:text-forest-900">BeigeLeads refund and replacement policy</Link></li>
            <li><Link href="/verification" className="underline underline-offset-4 hover:text-forest-900">How BeigeLeads verifies data</Link></li>
          </ul>
        </section>
      </main>
      <Faq items={c.faqs} heading={`Questions about ${c.name}`} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE_URL}${compareHref(c.slug)}`, dateModified: CHECKED }} />
    </>
  );
}
