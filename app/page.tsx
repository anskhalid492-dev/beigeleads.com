import type { Metadata } from "next";
import { PromoBanner } from "@/components/promos/banner";
import Link from "next/link";
import { ArrowRight, Check, Download, Eye, FileText, Mail, Search, ShieldCheck, Users, Wallet } from "lucide-react";
import { Copilot } from "@/components/home/copilot";
import { hydrateCatalog } from "@/lib/catalog-db";
import { ledgerSheets } from "@/lib/home-ledger";
import { SampleLedger } from "@/components/home/sample-ledger";
import { DbBadge } from "@/components/shared/db-icon";
import { fmtNum } from "@/components/product/meta";
import { SolutionFaq } from "@/components/solutions/sections";
import { Button } from "@/components/ui/button";
import { formatUsd, getCategories, getCities, getCountries, getCountry, getProducts, startingPriceCents } from "@/lib/catalog";
import { solutions } from "@/lib/solutions";

// Home. No invented stats, reviews, customers or counts (CLAUDE.md section 2). Never state how many lists exist (section 37).
// Placeholder product numbers are labelled as such wherever they appear.

export const metadata: Metadata = {
  title: { absolute: "BeigeLeads: buy business contact lists once, no subscription" },
  description: "Search ready-made business contact lists by industry and location, preview a masked sample, pay once in crypto and get your file by email. Or request a custom list.",
  alternates: { canonical: "/" },
};

const h2 = "display text-4xl text-forest-900 sm:text-6xl";

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
  { Icon: ShieldCheck, t: "What verification means", d: "BeigeLeads refreshes its databases every 90 days.", href: "/verification", cta: "How we verify" },
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
  ["How fresh is the data?", "BeigeLeads refreshes its databases every 90 days."],
  ["What happens after I pay?", "Payment is confirmed on the blockchain, then we email you the link to your file. You do not need an account."],
  ["What format is the file?", "A spreadsheet-style contact file you can open in a spreadsheet app or import into your email tool. The list page shows the fields."],
  ["Can I request a custom list?", "Yes. Describe the industry, place, quantity and fields on the custom list page. We reply by email after checking whether we can source it. Sending a request is free."],
  ["How do I pay?", "In cryptocurrency (BTC, USDT, USDC or ETH). Card payments may come later."],
] as const;

export const dynamic = "force-dynamic"; // reads the full catalog and the real sample

export default async function Home() {
  await hydrateCatalog();
  const ledger = ledgerSheets();
  const categories = getCategories();
  const products = getProducts();
  // Eight lists, live ones first, spread over different industries and countries.
  const featured = (() => {
    const seen = new Set<string>(); const out: (typeof products)[number][] = [];
    for (const p of [...products].sort((a, b) => Number(b.status === "live") - Number(a.status === "live"))) {
      const key = `${p.categorySlug}|${p.countrySlug}`;
      if (seen.has(key)) continue;
      seen.add(key); out.push(p);
      if (out.length === 8) break;
    }
    return out;
  })();
  const countries = getCountries();
  // Full grid rows only: a wide first tile needs exactly five tiles, otherwise three equal ones.
  const tiles = categories.length >= 5 ? categories.slice(0, 5) : categories.slice(0, 3);
  return (
    <>
      <PromoBanner place="home" className="mt-4 mx-4" />
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

      {/* 2. Value proposition: editorial split, ruled rows instead of cards */}
      <section aria-labelledby="value" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <h2 id="value" className="display text-5xl leading-[0.95] text-forest-900 sm:text-7xl">Business contacts. <span className="text-forest-500">No subscription.</span></h2>
            <p className="mt-6 max-w-md text-lg">BeigeLeads sells ready-made business contact lists. Pick one, check the masked sample, pay once and keep the file.</p>
            <Link href="/how-it-works" className="mt-6 inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">See how it works <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ul className="divide-y divide-sand-300 border-y border-sand-300">
            {value.map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-5 py-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300"><Icon className="size-5" aria-hidden /></span>
                <div><h3 className="text-xl font-bold text-forest-900">{t}</h3><p className="mt-1">{d}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 3. Explore available lists: a directory, one row per list */}
      <section aria-labelledby="lists" className="border-y border-sand-200 bg-sand-100 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="lists" className="display text-4xl text-forest-900 sm:text-6xl">Start with a list that exists.</h2>
            <Link href="/lists" className="inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">Browse all lists <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ul className="mt-10 grid overflow-hidden rounded-[1.6rem] border border-sand-300 bg-white lg:grid-cols-2">
            {featured.map((p, i) => {
              const price = startingPriceCents(p);
              const k = getCountry(p.countrySlug);
              return (
                <li key={p.slug} className={`flex items-center gap-4 border-sand-200 p-5 ${i > 0 ? "border-t" : ""} ${i === 1 ? "lg:border-t-0" : ""} ${i % 2 === 0 ? "lg:border-r" : ""}`}>
                  <DbBadge category={p.categorySlug} hint={p.name} country={k?.code} region={p.region} size="lg" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/lists/${p.slug}`} className="block truncate text-lg font-bold leading-snug text-forest-900 hover:text-purple-700">{p.name}</Link>
                    <p className="truncate text-sm">
                      {k?.name ?? ""}
                      {!p.placeholderData && p.recordCount ? ` · ${fmtNum(p.recordCount)} records` : ""}
                      {!p.placeholderData && price ? ` · from ${formatUsd(price)}` : ""}
                    </p>
                  </div>
                  <Link href={`/sample?product=${p.slug}`} className="hidden shrink-0 text-sm font-semibold text-forest-700 underline underline-offset-4 hover:text-purple-700 sm:block">Free sample</Link>
                  <Link href={`/lists/${p.slug}`} aria-label={`View ${p.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-sand-300 text-forest-900 transition-colors hover:border-purple-600 hover:text-purple-600"><ArrowRight className="size-4" aria-hidden /></Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 4. How it works: a real sequence, so numbered; steps step down the page */}
      <section aria-labelledby="how" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
          <div>
            <h2 id="how" className="display text-4xl text-forest-900 sm:text-6xl">From search to file in four steps.</h2>
            <p className="mt-4 text-sm">After payment, delivery is by email link once the transaction confirms.</p>
            <Link href="/how-it-works" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">Full walkthrough <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {steps.map(({ Icon, t, d }, i) => (
              <li key={t} className={`relative overflow-hidden rounded-[1.4rem] border border-sand-300 bg-white p-6 ${i % 2 ? "sm:mt-10" : ""}`}>
                <span aria-hidden className="display absolute -right-1 -top-3 text-[6.5rem] leading-none text-sand-200">{i + 1}</span>
                <span className="relative grid size-11 place-items-center rounded-xl bg-forest-900 text-forest-300"><Icon className="size-5" aria-hidden /></span>
                <h3 className="relative mt-5 text-xl font-bold text-forest-900">{t}</h3>
                <p className="relative mt-1 max-w-[16rem]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
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
            <Button asChild size="lg" className="mt-6"><Link href="/sample">Request a free sample</Link></Button>
          </div>
          {ledger.length > 0 ? <SampleLedger sheets={ledger} /> : <div className="rounded-2xl border border-sand-200 bg-white p-8"><p className="display text-3xl text-forest-900">See real rows, masked.</p><p className="mt-3">Request a free sample and we send you real rows from the list, with emails and phone numbers masked.</p></div>}
        </div>
      </section>

      {/* 7. Browse by industry and location */}
      <section aria-labelledby="browse" className="border-y border-sand-200 bg-sand-100 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="browse" className="display text-4xl text-forest-900 sm:text-6xl">Browse by industry and place.</h2>
            <Link href="/lists" className="inline-flex items-center gap-2 font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">All industries <ArrowRight className="size-4" aria-hidden /></Link>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {tiles.map((c, i) => (
              <li key={c.slug} className={i === 0 && tiles.length === 5 ? "md:col-span-2" : ""}>
                <Link href={`/lists/${c.slug}`} className={`group flex h-full flex-col justify-between rounded-[1.4rem] border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${i === 0 ? "border-forest-900 bg-forest-900 text-sand-100" : "border-sand-300 bg-white hover:border-forest-900"}`}>
                  <span className="flex items-center gap-4"><DbBadge category={c.slug} country="US" size="lg" /><span className={`display ${i === 0 ? "text-4xl text-sand-50 sm:text-5xl" : "text-3xl text-forest-900"}`}>{c.name}</span></span>
                  <span className="mt-6 flex items-center justify-between gap-4 text-sm">{c.blurb}<ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-2" aria-label="Locations">
            {countries.slice(0, 6).flatMap((k) => [
              <Link key={k.slug} href="/lists" className="rounded-full bg-forest-900 px-4 py-1.5 text-sm font-medium text-sand-50">{k.name}</Link>,
              ...getCities(k.slug).slice(0, 6).map((city) => <Link key={city.slug} href="/lists" className="rounded-full border border-sand-300 bg-white px-4 py-1.5 text-sm font-medium text-forest-900 hover:bg-purple-100">{city.name}</Link>),
            ])}
          </div>
          <p className="mt-6">Another industry or place? <Link href="/custom-list" className="font-semibold underline underline-offset-4">We can source it for you</Link> or <Link href="/request-category" className="font-semibold underline underline-offset-4">request a category</Link>.</p>
        </div>
      </section>

      {/* 8. Ready-made vs custom */}
      <section aria-labelledby="paths" className="mx-auto max-w-6xl px-4 py-24">
        <h2 id="paths" className={`${h2} text-center`}>Ready-made or custom</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg">Start with a list that already exists, or tell us exactly who you need. Either way you pay once and get a file you keep.</p>
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <article className="flex flex-col rounded-[2rem] border-2 border-forest-900 bg-white p-7 sm:p-9">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-forest-100 px-3 py-1 text-sm font-bold text-forest-900"><Download className="size-4" aria-hidden /> Buy today</span>
            <h3 className="display mt-4 text-4xl text-forest-900 sm:text-5xl">Ready-made lists</h3>
            <p className="mt-3 text-lg">Browse databases that are already built, inspect the fields and the masked sample, and buy in one payment.</p>
            <ul className="mt-6 space-y-3">
              {[
                ["Masked sample on every list page", "See real record layouts with emails and phone numbers hidden before you pay."],
                ["48+ data fields per record", "Business, location, contact, online presence and operations details."],
                ["Pay once in crypto", "No subscription, no seats, no credits and no account."],
                ["CSV, Excel or TXT by email", "Delivery is mostly instant, in some cases up to 12 hours."],
                ["Replacement promise", "If more than 5% of emails bounce, we replace them or refund proportionally."],
              ].map(([h, d]) => (
                <li key={h} className="flex gap-3"><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-900"><Check className="size-3.5" aria-hidden /></span><span><strong className="text-forest-900">{h}.</strong> {d}</span></li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-sand-100 p-4 text-sm"><strong className="text-forest-900">Best when</strong> your target is an industry, a country or a state we already cover and you want the file today.</div>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
              <Button asChild size="lg"><Link href="/lists">Browse lists</Link></Button>
              <Link href="/sample" className="inline-flex h-11 items-center rounded-full px-2 text-sm font-semibold text-forest-900 underline underline-offset-4">Request a free sample</Link>
            </div>
          </article>
          <article className="flex flex-col rounded-[2rem] bg-forest-900 p-7 text-sand-100 sm:p-9">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-sand-50"><FileText className="size-4" aria-hidden /> Built for you</span>
            <h3 className="display mt-4 text-4xl text-sand-50 sm:text-5xl">Custom list builder</h3>
            <p className="mt-3 text-lg">Tell us the industry, place, quantity and fields you need. We reply by email with what is possible.</p>
            <ul className="mt-6 space-y-3">
              {[
                ["Four short steps", "Prospects, location, data fields and a review, then you send the request."],
                ["Any industry or place", "Niches and regions that are not in the catalog are welcome."],
                ["Choose your fields", "Say which fields matter, such as job titles, website or social links."],
                ["Quoted separately", "No price is promised on the form. We confirm what can be sourced first."],
                ["A reference number", "Every request gets one, so you can follow up by email."],
              ].map(([h, d]) => (
                <li key={h} className="flex gap-3"><span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-forest-300/25 text-forest-300"><Check className="size-3.5" aria-hidden /></span><span><strong className="text-sand-50">{h}.</strong> {d}</span></li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm"><strong className="text-sand-50">Best when</strong> you need a specific mix of niche, role or region that no ready-made list covers.</div>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
              <Button asChild variant="secondary" size="lg"><Link href="/custom-list">Build a custom list</Link></Button>
              <Link href="/help-center" className="inline-flex h-11 items-center rounded-full px-2 text-sm font-semibold text-sand-50 underline underline-offset-4">How requests work</Link>
            </div>
          </article>
        </div>
        <p className="mt-6 text-center text-sm">Not sure which one fits? <Link href="/sample" className="font-semibold text-forest-900 underline underline-offset-4">Start with a free masked sample</Link>. No payment details needed.</p>
      </section>

      {/* 9. Who is it for: ruled list beside the heading */}
      <section aria-labelledby="who" className="border-y border-sand-200 bg-sand-100 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[18rem_1fr]">
          <h2 id="who" className="display text-4xl text-forest-900 sm:text-6xl">Built for teams that sell.</h2>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {audiences.filter(([slug]) => solutions.some((s) => s.slug === slug)).map(([slug, t, d]) => (
              <li key={slug} className="border-b border-sand-300">
                <Link href={`/solutions/${slug}`} className="group flex items-start justify-between gap-4 py-5">
                  <span><span className="block text-xl font-bold text-forest-900 group-hover:text-purple-700">{t}</span><span className="mt-1 block">{d}</span></span>
                  <ArrowRight className="mt-1.5 size-4 shrink-0 text-forest-500 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 10. Trust and transparency */}
      <section aria-labelledby="trust" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[18rem_1fr]">
          <h2 id="trust" className="display text-4xl text-forest-900 sm:text-6xl lg:sticky lg:top-28 lg:self-start">Know what you are buying.</h2>
          <ul className="divide-y divide-sand-300 border-y border-sand-300">
            {trust.map(({ Icon, t, d, href, cta }) => (
              <li key={t} className="grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start sm:gap-5">
                <Icon className="size-6 text-forest-500" aria-hidden />
                <div><h3 className="text-lg font-bold text-forest-900">{t}</h3><p className="mt-1">{d}</p></div>
                <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-forest-900 underline underline-offset-4 hover:text-purple-700">{cta}</Link>
              </li>
            ))}
          </ul>
        </div>
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
