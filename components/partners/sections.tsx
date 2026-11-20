import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PARTNER_HIGHLIGHTS, PARTNER_STEPS, PARTNER_TERMS } from "@/lib/partners/content";

const wrap = "mx-auto w-full max-w-[1200px] px-5 sm:px-8";

/** Forest hero: headline + highlights on the left, the 50% split-price bar on the right. */
export function PartnerHero() {
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100">
      <div aria-hidden className="glow-breathe pointer-events-none absolute -right-24 top-0 h-96 w-[34rem] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(143,208,169,0.2), transparent)" }} />
      <div className={`${wrap} relative grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16 lg:py-24`}>
        <div>
          <h1 className="display text-6xl text-sand-50 sm:text-7xl lg:text-[5.25rem] lg:leading-[0.95]">Resell Better Data. Grow Your Business.</h1>
          <p className="mt-6 max-w-xl text-lg text-sand-200">Join the BeigeLeads Data Reseller Partner Program and unlock an exclusive 50% discount on every database purchase once approved.</p>
          <ul className="mt-7 space-y-2.5">
            {PARTNER_HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-3 text-base text-sand-100">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-forest-300 text-forest-900"><Check className="size-3.5" aria-hidden strokeWidth={3} /></span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#apply">Apply to Become a Partner</a></Button>
            <Button asChild size="lg" variant="secondary"><a href="#how-it-works">See how it works</a></Button>
          </div>
        </div>
        <SplitPrice />
      </div>
    </section>
  );
}

/** The one memorable element. Shows the idea (half the standard price) without inventing a single price. */
function SplitPrice() {
  return (
    <figure aria-label="Partner price is half the standard price" className="rounded-[2rem] border border-forest-700 bg-forest-700/30 p-6 sm:p-8">
      <p className="display text-[7rem] leading-none text-sand-50 sm:text-[9rem]">50<span className="text-forest-300">%</span></p>
      <p className="mt-1 text-xl font-semibold text-sand-50">off every list. Every package.</p>
      <div className="mt-8 space-y-5" aria-hidden>
        <div>
          <p className="mb-1.5 text-sm text-sand-200">Standard price</p>
          <div className="h-9 w-full rounded-xl bg-sand-300" />
        </div>
        <div>
          <p className="mb-1.5 text-sm text-sand-200">Partner price</p>
          <div className="relative h-9 w-full rounded-xl border border-dashed border-forest-500">
            <div className="pt-bar h-full rounded-xl bg-forest-300" />
            <span className="pt-saved absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-forest-300">half saved</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-6 text-sm text-sand-200">Approved partners buy the same databases at half the list price. One-time purchases, no subscription.</figcaption>
    </figure>
  );
}

export function PartnerIntro() {
  return (
    <section className="bg-sand-50 py-14 lg:py-16">
      <div className={`${wrap} max-w-3xl`}>
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">A data reseller program without the extras</h2>
        <p className="mt-4 text-lg">
          The BeigeLeads Data Reseller Partner Program is built for agencies, sales teams and B2B data resellers who buy business email lists in volume. Approved partners get partner pricing on our wholesale business databases: 50% off every ready-made list, bought once and kept.
        </p>
        <p className="mt-4 text-lg">
          There is no affiliate dashboard, no referral links and no commission scheme. A data reseller partnership here means one thing: after approval you get a personal code, and checkout takes half off.
        </p>
      </div>
    </section>
  );
}

export function PartnerSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-100 py-16 lg:py-20">
      <div className={wrap}>
        <h2 className="display max-w-2xl text-4xl text-forest-900 sm:text-5xl">How it works</h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-4 md:gap-6">
          <span aria-hidden className="absolute left-[1.15rem] top-3 hidden h-[calc(100%-1.5rem)] w-px bg-sand-300 max-md:block md:left-[1.15rem] md:top-[1.15rem] md:h-px md:w-[calc(100%-2.3rem)]" />
          {PARTNER_STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 md:block">
              <span className="relative z-10 grid size-9 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{i + 1}</span>
              <div className="md:mt-4">
                <h3 className="text-xl font-bold text-forest-900">{s.title}</h3>
                <p className="mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PartnerApplySection({ children }: { children: React.ReactNode }) {
  return (
    <section id="apply" className="scroll-mt-24 bg-sand-50 py-16 lg:py-20">
      <div className={`${wrap} grid items-start gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14`}>
        <div className="lg:sticky lg:top-28">
          <h2 className="display text-4xl text-forest-900 sm:text-5xl">Tell us about your business.</h2>
          <p className="mt-4 text-lg">We read every application. The more clearly you describe how you work with business data, the faster we can decide.</p>
          <ul className="mt-6 space-y-3 text-base">
            <li className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-forest-500" aria-hidden strokeWidth={3} />We respond within 7 days, by email.</li>
            <li className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-forest-500" aria-hidden strokeWidth={3} />Nothing is charged. Applying is free.</li>
            <li className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-forest-500" aria-hidden strokeWidth={3} />Applying does not grant a discount. Only approved partners receive a code.</li>
          </ul>
          <p className="mt-6 text-sm">Not a reseller? You can still <Link href="/lists" className="font-semibold underline underline-offset-4">buy any list</Link> at its standard price.</p>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

export function PartnerTerms() {
  return (
    <section id="terms" className="scroll-mt-24 bg-sand-100 py-14 lg:py-16">
      <div className={`${wrap} max-w-3xl`}>
        <h2 className="display text-4xl text-forest-900 sm:text-5xl">Partner Program Terms</h2>
        <ol className="mt-6 list-decimal space-y-3 pl-5 text-base marker:font-semibold marker:text-forest-900">
          {PARTNER_TERMS.map((t) => <li key={t}>{t}</li>)}
        </ol>
        <p className="mt-6 text-sm">Read also: <Link href="/legal/lawful-use" className="underline underline-offset-4">lawful use policy</Link>, <Link href="/legal/refund-replacement" className="underline underline-offset-4">refund and replacement policy</Link>, <Link href="/legal/terms" className="underline underline-offset-4">terms of service</Link>.</p>
      </div>
    </section>
  );
}
