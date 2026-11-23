import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRICE_PER_VERIFIED_CONTACT_USD } from "@/lib/creators/config";
import { DATABASE_STATEMENT, DIMENSIONS, EXAMPLE_QUANTITIES, RESPONSE_HOURS, STEPS } from "@/lib/creators/content";
import { estimateCents, formatEstimate } from "@/lib/creators/pricing";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const primary = "inline-flex h-12 items-center gap-2 rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function CreatorsHero() {
  const rows: [string, string][] = [["Platform", "Instagram, TikTok"], ["Niche", "Fitness"], ["Country", "United States"], ["Followers", "10K to 100K"]];
  return (
    <section className="bg-sand-50">
      <div className={`${wrap} grid gap-12 pb-20 pt-10 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-16`}>
        <div className="hero-in">
          <h1 className="display text-5xl text-forest-900 sm:text-6xl xl:text-[5.25rem]">{DATABASE_STATEMENT} Database of Creators Across Major Platforms.</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">Find influencers who fit your campaign. Filter by platform, niche, location, follower count, and more. We&apos;ll build a custom contact list around your requirements.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#inquiry" className={primary}>Build Your Custom Creator List <ArrowRight className="size-4" aria-hidden /></a>
            <a href="#how-it-works" className="inline-flex h-12 items-center rounded-full border border-forest-900 px-7 font-semibold text-forest-900 transition-colors hover:bg-forest-900 hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">How It Works</a>
          </div>
          <p className="mt-5 text-sm font-semibold text-forest-900">We&apos;ll get back to you within {RESPONSE_HOURS} hours.</p>
        </div>
        {/* A worked example of one request: the four filters, then what it would cost. Illustration only. */}
        <div className="rounded-[2rem] bg-forest-900 p-7 text-sand-100 shadow-[0_30px_60px_-30px_rgba(15,42,29,0.7)] sm:p-9" aria-label="Example request">
          <p className="text-sm font-semibold text-forest-300">Example request</p>
          <dl className="mt-4 divide-y divide-forest-700">
            {rows.map(([k, val]) => <div key={k} className="flex items-baseline justify-between gap-4 py-3"><dt className="text-sm text-sand-200">{k}</dt><dd className="font-semibold text-sand-50">{val}</dd></div>)}
            <div className="flex items-baseline justify-between gap-4 py-3"><dt className="text-sm text-sand-200">Contacts</dt><dd className="font-semibold text-sand-50">5,000</dd></div>
          </dl>
          <div className="mt-5 border-t border-forest-700 pt-5">
            <p className="display text-7xl text-sand-50">$0.10</p>
            <p className="mt-1 text-sm text-sand-200">per verified influencer contact</p>
            <p className="mt-4 text-sm">5,000 × $0.10 = <strong className="text-sand-50">{formatEstimate(estimateCents(5000))}</strong> estimated</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CreatorsSegments() {
  return (
    <section className="bg-sand-100 py-20 lg:py-28">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className={h2}>Describe the creators you want. We build the list around it.</h2>
          <p className="mt-5 max-w-md text-lg">Nothing here is a ready-made file. Each list starts from your brief, so you only pay for contacts that match it.</p>
        </div>
        <dl className="divide-y divide-sand-300 border-y border-sand-300">
          {DIMENSIONS.map((d) => (
            <div key={d.name} className="grid gap-1 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="text-lg font-bold text-forest-900">{d.name}{d.note && <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 align-middle text-xs font-semibold text-purple-700">{d.note}</span>}</dt>
              <dd>{d.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function CreatorsPricing() {
  return (
    <section id="pricing" className="bg-sand-50 py-20 lg:py-28">
      <div className={`${wrap} grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20`}>
        <div>
          <h2 className={h2}>One price. No tiers to decode.</h2>
          <p className="display mt-6 text-6xl text-forest-900 sm:text-7xl">${PRICE_PER_VERIFIED_CONTACT_USD.toFixed(2)}</p>
          <p className="mt-2 text-xl font-semibold text-forest-900">per verified influencer contact.</p>
          <p className="mt-5 max-w-md">Your estimate is the number of contacts you request times $0.10. No discounts or minimum charges are added to it. Not every creator in the database has an available verified contact, so our team confirms availability and your final total before anything is charged.</p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-sand-300 bg-white">
          <table className="w-full text-left">
            <caption className="sr-only">Estimated price by number of contacts</caption>
            <thead className="bg-sand-100 text-sm text-forest-900"><tr><th scope="col" className="px-6 py-4">Contacts</th><th scope="col" className="px-6 py-4 text-right">Estimated price</th></tr></thead>
            <tbody className="divide-y divide-sand-200">
              {EXAMPLE_QUANTITIES.map((q) => <tr key={q}><th scope="row" className="px-6 py-4 font-semibold text-forest-900">{q.toLocaleString("en-US")}</th><td className="display px-6 py-4 text-right text-3xl text-forest-900">{formatEstimate(estimateCents(q))}</td></tr>)}
            </tbody>
          </table>
          <p className="border-t border-sand-200 px-6 py-4 text-sm">Estimates only. Final availability and total cost are confirmed by our team.</p>
        </div>
      </div>
    </section>
  );
}

export function CreatorsSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-forest-900 py-20 text-sand-100 lg:py-28">
      <div className={wrap}>
        <h2 className="display max-w-2xl text-4xl text-sand-50 sm:text-5xl">From your brief to a confirmed quote.</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.t} className="border-t border-forest-500 pt-6">
              <span className="display text-5xl text-forest-300" aria-hidden>{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold text-sand-50">{s.t}</h3>
              <p className="mt-2 text-sand-200">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function CreatorsFormSection({ children }: { children: React.ReactNode }) {
  return (
    <section id="inquiry" className="scroll-mt-24 bg-sand-100 py-20 lg:py-28">
      <div className={wrap}>
        <div className="mb-10 max-w-2xl">
          <h2 className={h2}>Build your custom creator list.</h2>
          <p className="mt-4 text-lg">Tell us who you want to reach. You get a confirmation email right away and a reply from our team within {RESPONSE_HOURS} hours. Submitting is not a purchase.</p>
        </div>
        <div className="rounded-[2rem] border border-sand-300 bg-sand-50 p-6 sm:p-10">{children}</div>
      </div>
    </section>
  );
}

export function CreatorsFinalCta() {
  return (
    <section className="bg-sand-50 py-20 lg:py-28">
      <div className={`${wrap} text-center`}>
        <h2 className="display mx-auto max-w-3xl text-5xl text-forest-900 sm:text-6xl">Your next creator partnership starts here.</h2>
        <div className="mt-8"><a href="#inquiry" className={primary}>Build Your Custom Creator List <ArrowRight className="size-4" aria-hidden /></a></div>
        <p className="mt-5 text-sm">Prefer to talk first? <Link href="/contact" className="font-semibold text-forest-900 underline underline-offset-4">Contact us</Link></p>
      </div>
    </section>
  );
}
