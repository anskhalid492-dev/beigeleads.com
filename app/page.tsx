import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Eye, FileText, Mail, Search, ShieldCheck, Users, Wallet } from "lucide-react";
import { Copilot } from "@/components/home/copilot";
import { SampleLedger } from "@/components/home/sample-ledger";
import { DbBadge } from "@/components/shared/db-icon";
import { SolutionFaq } from "@/components/solutions/sections";
import { Button } from "@/components/ui/button";
import { formatUsd, getCategories, getCities, getCountries, getProducts, startingPriceCents } from "@/lib/catalog";
import { solutions } from "@/lib/solutions";

// Home. No invented stats, reviews, customers or counts (CLAUDE.md section 2). Never state how many lists exist (section 37).
// Placeholder product numbers are labelled as such wherever they appear.

export const metadata: Metadata = {
  title: { absolute: "BeigeLeads: buy business contact lists once, no subscription" },
  description: "Search ready-made business contact lists by industry and location, preview a masked sample, pay once in crypto and get your file by email. Or request a custom list.",
  alternates: { canonical: "/" },
};

const h2 = "display text-4xl text-forest-900 sm:text-6xl";
const card = "rounded-2xl border border-sand-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md";

const value = [
  { Icon: Wallet, t: "One-time purchase", d: "Pay once per list. No monthly fee, no seats, no credits, nothing to cancel." },
  { Icon: Eye, t: "Preview before you buy", d: "Every list page shows its fields and a free masked sample, so you know the layout first." },
  { Icon: Download, t: "Contact data you keep", d: "After the payment confirms, a link to your file arrives by email. No account needed." },
] as const;

const steps = [
  { Icon: Search, t: "Search", d: "Describe the businesses you need, or browse by industry and city." },
  { Icon: Eye, t: "Preview", d: "Open the masked sample and check the fields." },
  { Icon: Wallet, t: "Purchase", d: "Choose a package and pay once in crypto. No account." },
  { Icon: Download, t: "Download", d: "When the payment confirms on the blockchain, we email your link." },
] as const;

const why = [
  ["No recurring subscription", "You pay for the list you need. Stop whenever you like: there is nothing to stop."],
  ["Individual list pricing", "Each list has its own page and packages, so you see the price of the list you want."],
  ["Simple product discovery", "Search in plain words or browse by industry and city."],
  ["Preview-first purchasing", "Masked samples are free and need no payment details."],
  ["Custom list requests", "Not in the catalog? Describe it and we reply after checking whether we can source it."],
  ["A clear delivery process", "Payment confirms on the blockchain, then your download link is emailed."],
] as const;

const audiences = [
  ["sales-prospecting", "Sales teams", "Give reps accounts to call instead of lists to build."],
  ["marketing-agencies", "Marketing agencies", "Find new clients without renting a data platform."],
  ["b2b-lead-generation", "Lead generation agencies", "Fill a client pipeline with businesses that match."],
  ["market-research", "Market researchers", "Map who is in a market before you decide how to enter it."],
  ["business-expansion", "Business development", "Understand a new city before you open there."],
  ["recruitment-staffing", "Recruiters", "Find employers to work with before they post the job."],
] as const;

const trust = [
  { Icon: FileText, t: "What is in a file", d: "Business name, address, city, country, phone, email and website. Each list page shows the exact fields.", href: "/data-sources", cta: "Where the data comes from" },
  { Icon: Eye, t: "How samples work", d: "A free sample with masked contact details, so you can check the layout without seeing working data.", href: "/sample", cta: "Request a sample" },
  { Icon: ShieldCheck, t: "What verification means", d: "Our team checks every email with in-house SMTP checks and re-verifies all data every 60 days.", href: "/verification", cta: "How we verify" },
  { Icon: Mail, t: "How delivery works", d: "Once your payment is confirmed on the blockchain, a download link is emailed to you.", href: "/legal/delivery", cta: "Delivery policy" },
  { Icon: Users, t: "Using the data lawfully", d: "Lists are for lawful business outreach. Anyone can ask to be removed, and removals are honored.", href: "/legal/lawful-use", cta: "Lawful use" },
  { Icon: ShieldCheck, t: "If emails bounce", d: "Above 5% bounces we replace emails until the list is back at 95% verified, or refund proportionally.", href: "/legal/refund-replacement", cta: "Replacement policy" },
] as const;

const compareRows = [
  ["What you pay for", "Ongoing access, seats or credits", "One list, once"],
  ["Cost of staying", "Keeps renewing", "Nothing renews"],
  ["If you stop paying", "Access ends", "The file is yours"],
  ["Preview", "Varies by tool", "Masked sample on every list page"],
  ["Best for", "Prospecting every week", "A list for a campaign"],
] as const;

const faq = [
  ["How does BeigeLeads pricing work?", "Each list has its own page with fixed packages. You see the price before checkout and pay once. There are no seats, credits or renewals."],
  ["Is this a subscription?", "No. You buy a list once and download the file. Nothing renews and there is nothing to cancel."],
  ["Can I see data before I pay?", "Yes. Every list page has a masked sample, and you can request a free sample by email. It needs no payment details."],
  ["How fresh is the data?", "Our team verifies every email with in-house SMTP checks and re-verifies all data every 60 days."],
  ["What happens after I pay?", "Payment is confirmed on the blockchain, then we email you the link to your file. You do not need an account."],
  ["What format is the file?", "A spreadsheet-style contact file you can open in a spreadsheet app or import into your email tool. The list page shows the fields."],
  ["Can I request a custom list?", "Yes. Describe the industry, place, quantity and fields on the custom list page. We reply by email after checking whether we can source it. Sending a request is free."],
  ["How do I pay?", "In cryptocurrency (BTC, USDT, USDC or ETH). Card payments may come later."],
] as const;

export default function Home() {
  const categories = getCategories();
  const products = getProducts();
  const countries = getCountries();
  return (
    <>
      {/* 1. Hero + co-pilot */}
      <section id="find-leads" className="scroll-mt-24 px-2 pt-6 sm:px-4">
        <div className="relative isolate mx-auto max-w-[96rem] overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-900 via-forest-700 to-forest-500 px-4 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          <div aria-hidden className="drift pointer-events-none absolute -left-24 bottom-[-6rem] -z-10 size-[28rem] rounded-full bg-forest-900/60 blur-3xl" />
          <div aria-hidden className="drift pointer-events-none absolute -right-16 -top-16 -z-10 size-[24rem] rounded-full bg-sand-200/20 blur-3xl" />
          <p className="hero-in mx-auto inline-block rounded-full border border-sand-200/30 px-4 py-1.5 text-xs font-semibold tracking-wide text-sand-100" style={{ animationDelay: "0ms" }}>
            THE SMARTER WAY TO FIND BUSINESS CONTACT LISTS
          </p>
          <h1 className="hero-in display mt-6 text-6xl text-sand-50 sm:text-8xl" style={{ animationDelay: "80ms" }}>
            Find the right leads.
            <br />
            Own the list.
          </h1>
          <p className="hero-in mx-auto mt-5 max-w-2xl text-lg text-sand-100" style={{ animationDelay: "160ms" }}>
            Search ready-made business contact lists by industry and location. Preview available data, pay once, or request a custom list built around your prospects.
          </p>
          <div className="hero-in mt-10" style={{ animationDelay: "240ms" }}><Copilot /></div>
          <p className="mt-12 text-sm text-sand-200">One-time purchase · No subscription · No account · Masked sample on every list page</p>
        </div>
      </section>

      {/* 2. Value proposition */}
      <section aria-labelledby="value" className="mx-auto max-w-6xl px-4 py-24">
        <h2 id="value" className={`${h2} text-center`}>Business contacts without the subscription.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg">BeigeLeads is a marketplace for ready-made business contact lists. Pick one, check the sample, pay once.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {value.map(({ Icon, t, d }) => (
            <div key={t} className={card}>
              <span className="grid size-12 place-items-center rounded-xl bg-forest-900 text-forest-300"><Icon className="size-6" aria-hidden /></span>
              <h3 className="mt-5 text-xl font-bold text-forest-900">{t}</h3>
              <p className="mt-2">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Explore available lists */}
      <section aria-labelledby="lists" className="border-y border-sand-200 bg-sand-100 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="lists" className={h2}>Explore available lists</h2>
            <Link href="/lists" className="font-semibold text-forest-700 underline underline-offset-4">All lists</Link>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {products.map((p) => {
              const price = startingPriceCents(p);
              return (
                <li key={p.slug} className={`${card} flex flex-col`}>
                  <span className="flex items-center gap-3"><DbBadge category={p.categorySlug} country="US" size="lg" /><span><span className="block text-lg font-bold text-forest-900">{p.name}</span><span className="text-sm">{p.title}</span></span></span>
                  <p className="mt-4 text-sm">Fields: {p.fields.join(", ")}.</p>
                  <p className="mt-3 text-sm font-medium text-forest-900">
                    {p.recordCount ? `${p.recordCount.toLocaleString("en-US")} records` : null}
                    {price ? ` · from ${formatUsd(price)}` : null}
                    {p.placeholderData ? <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold">Placeholder figures</span> : null}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    <Button asChild size="sm"><Link href={`/product/${p.slug}`}>View list</Link></Button>
                    <Button asChild size="sm" variant="secondary"><Link href={`/sample?product=${p.slug}`}>Free sample</Link></Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. How it works */}
      <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-24">
        <h2 id="how" className={`${h2} text-center`}>How BeigeLeads works</h2>
        <ol className="relative mt-14 grid gap-8 md:grid-cols-4">
          <div aria-hidden className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 bg-sand-300 md:block"><div className="flow-line h-full bg-forest-900" /></div>
          {steps.map(({ Icon, t, d }, i) => (
            <li key={t} className="relative text-center">
              <span className="relative mx-auto grid size-14 place-items-center rounded-full border-2 border-forest-900 bg-white text-forest-900"><Icon className="size-6" aria-hidden /><span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-forest-900 text-xs font-bold text-sand-50">{i + 1}</span></span>
              <h3 className="mt-4 text-xl font-bold text-forest-900">{t}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-10 text-center text-sm">After payment, delivery is by email link once the transaction confirms. <Link href="/how-it-works" className="font-semibold underline underline-offset-4">Full walkthrough</Link></p>
      </section>

      {/* 5. Why BeigeLeads: editorial */}
      <section aria-labelledby="why" className="bg-forest-900 py-24 text-sand-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="why" className="display text-5xl text-sand-50 sm:text-6xl">Why BeigeLeads?</h2>
            <p className="mt-5 max-w-sm text-lg text-sand-200">Subscription tools rent you access. We sell you the list.</p>
            <Button asChild size="lg" className="mt-8"><Link href="/compare/beigeleads-vs-subscription-tools">See the difference</Link></Button>
          </div>
          <dl className="divide-y divide-forest-700">
            {why.map(([t, d]) => (
              <div key={t} className="grid gap-1 py-5 sm:grid-cols-[14rem_1fr] sm:gap-6">
                <dt className="text-lg font-bold text-sand-50">{t}</dt>
                <dd>{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. Interactive data preview */}
      <section aria-labelledby="preview" className="mx-auto max-w-6xl px-4 py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
          <div>
            <h2 id="preview" className={h2}>Look inside before you buy</h2>
            <p className="mt-4 text-lg">Switch between lists and see how a file is laid out. Contact details are masked in samples.</p>
            <p className="mt-3 text-sm">The rows shown here are demonstrations, not real businesses.</p>
            <Button asChild size="lg" className="mt-6"><Link href="/sample">Request a free sample</Link></Button>
          </div>
          <SampleLedger />
        </div>
      </section>

      {/* 7. Browse by industry and location */}
      <section aria-labelledby="browse" className="border-y border-sand-200 bg-sand-100 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="browse" className={h2}>Browse by industry and location</h2>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/lists/${c.slug}`} className="group flex h-full flex-col justify-between rounded-2xl border border-sand-300 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-forest-900 hover:shadow-md">
                  <span className="flex items-center gap-4"><DbBadge category={c.slug} country="US" size="lg" /><span className="display text-3xl text-forest-900">{c.name}</span></span>
                  <span className="mt-4 flex items-center justify-between text-sm">{c.blurb}<ArrowRight className="size-4" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Locations">
            {countries.flatMap((k) => [
              <Link key={k.slug} href="/lists" className="rounded-full bg-forest-900 px-4 py-1.5 text-sm font-medium text-sand-50">{k.name}</Link>,
              ...getCities(k.slug).map((city) => <Link key={city.slug} href="/lists" className="rounded-full border border-sand-300 bg-white px-4 py-1.5 text-sm font-medium text-forest-900 hover:bg-purple-100">{city.name}</Link>),
            ])}
          </div>
          <p className="mt-6">Another industry or place? <Link href="/custom-list" className="font-semibold underline underline-offset-4">We can source it for you</Link> or <Link href="/request-category" className="font-semibold underline underline-offset-4">request a category</Link>.</p>
        </div>
      </section>

      {/* 8. Ready-made vs custom */}
      <section aria-labelledby="paths" className="mx-auto max-w-6xl px-4 py-24">
        <h2 id="paths" className={`${h2} text-center`}>Ready-made or custom</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-[2rem] border-2 border-forest-900 bg-white p-8">
            <h3 className="display text-4xl text-forest-900">Ready-made lists</h3>
            <p className="mt-3 text-lg">Browse existing databases, inspect the fields and the masked sample, and buy in one payment.</p>
            <Button asChild size="lg" className="mt-auto self-start"><Link href="/lists">Browse lists</Link></Button>
          </div>
          <div className="flex flex-col rounded-[2rem] bg-forest-900 p-8 text-sand-100">
            <h3 className="display text-4xl text-sand-50">Custom list builder</h3>
            <p className="mt-3 text-lg">Tell us the industry, place, quantity and fields you need. We reply by email with what is possible.</p>
            <Button asChild variant="secondary" size="lg" className="mt-auto self-start"><Link href="/custom-list">Build a custom list</Link></Button>
          </div>
        </div>
      </section>

      {/* 9. Who is it for */}
      <section aria-labelledby="who" className="border-y border-sand-200 bg-sand-100 py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 id="who" className={h2}>Who is BeigeLeads for?</h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.filter(([slug]) => solutions.some((s) => s.slug === slug)).map(([slug, t, d]) => (
              <li key={slug}>
                <Link href={`/solutions/${slug}`} className={`${card} block h-full`}>
                  <h3 className="text-xl font-bold text-forest-900">{t}</h3>
                  <p className="mt-2">{d}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest-700">Read more <ArrowRight className="size-4" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Trust and transparency */}
      <section aria-labelledby="trust" className="mx-auto max-w-6xl px-4 py-24">
        <h2 id="trust" className={h2}>What you should know before you buy</h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trust.map(({ Icon, t, d, href, cta }) => (
            <li key={t} className={card}>
              <Icon className="size-6 text-forest-500" aria-hidden />
              <h3 className="mt-3 text-lg font-bold text-forest-900">{t}</h3>
              <p className="mt-2 text-sm">{d}</p>
              <Link href={href} className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{cta}</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 11. Comparison with subscription tools */}
      <section aria-labelledby="vs" className="border-y border-sand-200 bg-sand-100 py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 id="vs" className={`${h2} text-center`}>One purchase vs a subscription</h2>
          <div className="mt-10 overflow-hidden rounded-2xl border border-sand-200 bg-white">
            <table className="w-full text-left text-sm sm:text-base">
              <thead><tr className="text-forest-900"><th className="px-4 py-3" /><th className="bg-sand-100 px-4 py-3">Subscription tools</th><th className="bg-forest-900 px-4 py-3 text-sand-50">BeigeLeads</th></tr></thead>
              <tbody className="divide-y divide-sand-200">
                {compareRows.map(([a, b, c]) => (
                  <tr key={a}><th scope="row" className="px-4 py-3 font-semibold text-forest-900">{a}</th><td className="px-4 py-3">{b}</td><td className="bg-forest-100/50 px-4 py-3">{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center"><Button asChild variant="secondary"><Link href="/compare">See all comparisons</Link></Button></div>
        </div>
      </section>

      {/* 12. FAQ */}
      <SolutionFaq name="BeigeLeads" items={faq} />

      {/* 13. Final CTA */}
      <section aria-labelledby="final" className="px-2 py-16 sm:px-4">
        <div className="mx-auto max-w-[96rem] rounded-[2rem] bg-gradient-to-br from-forest-900 via-forest-700 to-forest-500 px-4 py-20 text-center text-sand-50">
          <h2 id="final" className="display text-5xl text-white sm:text-7xl">Your next prospects are one search away.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-sand-100">Find an available business contact list or tell us exactly what you need.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/#find-leads">Find my leads</Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href="/custom-list">Build a custom list</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}
