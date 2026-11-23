import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRICE_PER_VERIFIED_CONTACT_USD } from "@/lib/creators/config";
import { DATABASE_STATEMENT, DIMENSIONS, EXAMPLE_QUANTITIES, RESPONSE_HOURS, STEPS } from "@/lib/creators/content";
import { CreatorsHeroAnimation } from "./hero-animation";
import { estimateCents, formatEstimate } from "@/lib/creators/pricing";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const primary = "inline-flex h-12 items-center gap-2 rounded-full bg-purple-600 px-7 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function CreatorsHero() {
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
        <CreatorsHeroAnimation />
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
  const max = Math.max(...EXAMPLE_QUANTITIES);
  const unit = PRICE_PER_VERIFIED_CONTACT_USD.toFixed(2);
  return (
    <section id="pricing" className="bg-sand-50 py-20 lg:py-28">
      <div className={`${wrap} grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16`}>
        <div>
          <h2 className={h2}>One price. No tiers to decode.</h2>
          <div className="mt-8 inline-flex items-end gap-3 rounded-[1.75rem] bg-forest-900 px-7 py-6 text-sand-50">
            <span className="display text-7xl leading-none">${unit}</span>
            <span className="pb-1 text-sm font-semibold text-forest-300">per verified<br />influencer contact</span>
          </div>
          <p className="mt-6 max-w-md">Your estimate is the number of contacts you request times ${unit}. No discounts or minimum charges are added to it.</p>
          <p className="mt-3 max-w-md text-sm">Not every creator in the database has an available verified contact, so our team confirms availability and your final total before anything is charged.</p>
        </div>
        <div className="rounded-[2rem] border border-sand-300 bg-white p-6 shadow-[0_24px_50px_-34px_rgba(15,42,29,0.45)] sm:p-8">
          <div className="flex items-baseline justify-between text-sm font-semibold text-forest-700"><span>Contacts</span><span>Estimated price</span></div>
          <ul className="mt-4 space-y-5">
            {EXAMPLE_QUANTITIES.map((q) => (
              <li key={q}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-semibold text-forest-900">{q.toLocaleString("en-US")}</span>
                  <span className="display text-3xl text-forest-900">{formatEstimate(estimateCents(q))}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-sand-100" aria-hidden>
                  <div className="h-full rounded-full bg-forest-500" style={{ width: `${Math.max(3, (q / max) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl bg-sand-50 px-4 py-3 text-sm">Estimates only. Final availability and total cost are confirmed by our team.</p>
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
        <ol className="relative mt-14 grid gap-5 md:grid-cols-3">
          <span className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-gradient-to-r from-forest-500 via-forest-300 to-forest-500 md:block" aria-hidden />
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative rounded-[1.75rem] border border-forest-700 bg-forest-700/40 p-7 pt-12">
              <span className="display absolute -top-0 left-7 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-sand-100 text-2xl text-forest-900 ring-8 ring-forest-900" aria-hidden>{i + 1}</span>
              <h3 className="text-xl font-bold text-sand-50">{s.t}</h3>
              <p className="mt-3 text-sand-200">{s.d}</p>
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
