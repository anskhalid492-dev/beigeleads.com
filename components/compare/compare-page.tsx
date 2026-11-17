/* eslint-disable @next/next/no-img-element -- static logo files; the image optimizer is off (CLAUDE.md section 3) */
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
const card = "rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md";

/** Official logo when the owner has supplied the file; otherwise the name set as a wordmark badge. */
function Mark({ name, logo, iconOnly = false, dark = false }: { name: string; logo?: string; iconOnly?: boolean; dark?: boolean }) {
  if (logo && iconOnly)
    return (
      <span className="flex items-center gap-2">
        <img src={logo} alt="" className="size-10 object-contain" />
        <span className="display text-3xl text-forest-700">{name}</span>
      </span>
    );
  if (logo) return <img src={logo} alt={`${name} logo`} className="h-10 w-auto max-w-[180px] object-contain sm:h-12 sm:max-w-[220px]" />;
  return <span className={`display text-3xl ${dark ? "text-forest-900" : "text-forest-700"}`}>{name}</span>;
}

const benefits = [
  { t: "Pay once", d: "No subscription, seats or credits. One purchase per list, nothing renews." },
  { t: "See the list before you buy", d: "Every list page shows its fields and a free masked sample." },
  { t: "Fixed packages", d: "Each list has its own page and packages, so you know the cost of the list you want." },
  { t: "Delivered by email link", d: "After the payment is confirmed, the download link is emailed to you. No account." },
  { t: "Custom requests", d: "Not in the catalog? Describe the list and we reply after checking if we can source it." },
  { t: "A replacement rule in writing", d: "Above 5% bounces we replace emails until the list is back at 95% verified, or refund proportionally." },
] as const;

export function ComparePage({ c }: { c: Comparison }) {
  const title = compareTitle(c.name);
  const rows = visibleRows(c);
  const faqs = compareFaqs(c);
  const isGroup = c.slug === "subscription-tools";
  return (
    <>
      <Breadcrumbs items={[{ name: "Compare", href: "/compare" }, { name: title, href: compareHref(c.slug) }]} />
      <main>
        {/* Hero */}
        <section className="border-b border-sand-200 bg-sand-100">
          <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 text-center">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-4 sm:gap-6" aria-hidden={false}>
              <div className="flex flex-1 justify-end"><Mark name="BeigeLeads" dark /></div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">VS</span>
              <div className="flex flex-1 justify-start"><Mark name={c.name} logo={c.logo} iconOnly={c.logoIconOnly} /></div>
            </div>
            <h1 className="display mt-8 text-5xl text-forest-900 sm:text-7xl">{title}: which is better for buying B2B contact lists?</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg">
              Want business contacts without another subscription? See how BeigeLeads lets you browse, preview and buy ready-made contact lists with a single payment, and how it differs from {isGroup ? "subscription tools" : c.name}.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/lists">Browse lead lists</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/sample">Get a free sample</Link></Button>
            </div>
            <p className="mt-4 text-sm">One-time purchase. No subscription. No account. Free masked sample first.</p>
          </div>
        </section>

        {/* Meet BeigeLeads */}
        <section aria-labelledby="meet" className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="meet" className="display text-4xl text-forest-900 sm:text-5xl">Meet BeigeLeads: a simpler way to buy business contact lists</h2>
          <p className="mt-4 max-w-3xl text-lg">
            BeigeLeads is a marketplace for ready-made business contact lists. It is built for agencies, sales teams, founders and recruiters who need a list for a campaign and would rather pay once than run another subscription.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className={card}><h3 className="text-lg font-bold text-forest-900">How it works</h3><p className="mt-2">Browse the lists, open one, check the free masked sample, pick a package and pay once in crypto. {US.delivery}</p></div>
            <div className={card}><h3 className="text-lg font-bold text-forest-900">What you get</h3><p className="mt-2">Business name, address, city, country, phone, email and website. {US.freshness}</p></div>
            <div className={card}><h3 className="text-lg font-bold text-forest-900">Where it is today</h3><p className="mt-2">{US.coverage} Need something else? <Link href="/custom-list" className="font-semibold underline underline-offset-4">Request a custom list</Link>.</p></div>
          </div>
        </section>

        {/* About them / us */}
        <section aria-labelledby="glance" className="mx-auto grid max-w-6xl gap-4 px-4 md:grid-cols-2">
          <h2 id="glance" className="sr-only">At a glance</h2>
          <div className={card}><h3 className="text-xl font-bold text-forest-900">{c.name}</h3><p className="mt-2">{c.about}</p></div>
          <div className={`${card} border-forest-900`}><h3 className="text-xl font-bold text-forest-900">BeigeLeads</h3><p className="mt-2">{US.model}</p></div>
        </section>

        {/* Table */}
        <section aria-labelledby="table" className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="table" className="display text-4xl text-forest-900 sm:text-5xl">{title}: side by side</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <table className="w-full border-collapse text-left text-sm md:text-base">
              <caption className="sr-only">{title}: feature comparison</caption>
              <thead className="sr-only md:not-sr-only md:table-header-group">
                <tr className="bg-sand-100 text-forest-900">
                  <th scope="col" className="px-4 py-4 font-semibold md:w-1/5">Topic</th>
                  <th scope="col" className="px-4 py-4 md:w-2/5"><Mark name={c.name} logo={c.logo} iconOnly={c.logoIconOnly} /></th>
                  <th scope="col" className="border-x-2 border-t-2 border-forest-900 bg-forest-100 px-4 py-4 md:w-2/5"><Mark name="BeigeLeads" dark /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {rows.map((r) => (
                  <tr key={r.label} className="block md:table-row">
                    <th scope="row" className={`${cell} font-semibold text-forest-900 before:hidden`}>{r.label}</th>
                    <td data-label={c.name} className={cell}>{r.them}</td>
                    <td data-label="BeigeLeads" className={`${cell} bg-forest-100/50 md:border-x-2 md:border-forest-900`}>{r.us}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Why BeigeLeads */}
        <section aria-labelledby="why" className="border-y border-sand-200 bg-sand-100 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 id="why" className="display text-4xl text-forest-900 sm:text-5xl">Why choose BeigeLeads?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <div key={b.t} className={`${card} hover:-translate-y-0.5`}>
                  <span aria-hidden className="mb-3 grid size-9 place-items-center rounded-full bg-forest-100 text-forest-700">✓</span>
                  <h3 className="text-lg font-bold text-forest-900">{b.t}</h3>
                  <p className="mt-1.5">{b.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8"><Button asChild size="lg"><Link href="/lists">Explore available lists</Link></Button></div>
          </div>
        </section>

        {/* Who should choose */}
        <section aria-labelledby="choose" className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="choose" className="display text-4xl text-forest-900 sm:text-5xl">Who should choose which?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className={`${card} border-2 border-forest-900`}>
              <h3 className="text-xl font-bold text-forest-900">Choose BeigeLeads if</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">{c.chooseUs.map((t) => <li key={t}>{t}</li>)}</ul>
              <Button asChild className="mt-5"><Link href="/sample">Get a free sample</Link></Button>
            </div>
            <div className={card}>
              <h3 className="text-xl font-bold text-forest-900">Choose {c.name} if</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5">{c.chooseThem.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 pb-20">
          <div className="rounded-[2rem] bg-forest-900 p-8 text-center text-sand-50 sm:p-12">
            <h2 id="cta" className="display text-4xl sm:text-6xl">Why pay for another subscription when you just need the list?</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-sand-200">Explore ready-made business contact lists, preview available data, and purchase only what you need.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/lists">Find my leads</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/sample">Get a free sample</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/custom-list">Request a custom list</Link></Button>
            </div>
          </div>
          <p className="mt-6 text-center text-sm">
            More comparisons: <Link href="/compare" className="underline underline-offset-4">all BeigeLeads comparisons</Link> · <Link href="/verification" className="underline underline-offset-4">how we verify data</Link> · <Link href="/legal/refund-replacement" className="underline underline-offset-4">refund and replacement policy</Link>
          </p>
        </section>
      </main>
      <Faq items={faqs} heading={`Questions about BeigeLeads vs ${c.name}`} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: title, url: `${SITE_URL}${compareHref(c.slug)}` }} />
    </>
  );
}
