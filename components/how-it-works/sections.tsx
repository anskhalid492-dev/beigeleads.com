import Link from "next/link";
import { FaqAnswer } from "@/components/shared/faq-answer";
import type { ReactNode } from "react";
import {
  ArrowRight, Check, Copy, Eraser, FileSpreadsheet, Globe, LifeBuoy, MailCheck, Minus, Package, RefreshCw, ShieldCheck, Sparkles, Table2, UserX, Wallet, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/shared/json-ld";

const wrap = "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-5xl text-forest-900 sm:text-6xl";

export function Head({ title, text }: { title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className={h2}>{title}</h2>
      {text && <p className="mt-4 text-lg">{text}</p>}
    </div>
  );
}

export function ReadyVsCustom() {
  const col = (
    title: string, who: string, steps: readonly string[], cta: { href: string; label: string }, primary: boolean, icon: ReactNode,
  ) => (
    <div className="reveal flex flex-col rounded-3xl border border-sand-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-lg">
      <span className="grid size-12 place-items-center rounded-2xl bg-forest-100 text-forest-700">{icon}</span>
      <h3 className="mt-4 text-2xl font-bold text-forest-900">{title}</h3>
      <p className="mt-1">{who}</p>
      <ol className="mt-5 flex-1 space-y-2.5">
        {steps.map((s, i) => (<li key={s} className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest-900 text-xs font-bold text-sand-50">{i + 1}</span>{s}</li>))}
      </ol>
      <div className="mt-6"><Button asChild size="lg" variant={primary ? "primary" : "secondary"}><Link href={cta.href}>{cta.label}</Link></Button></div>
    </div>
  );
  return (
    <section className="bg-sand-100 py-16 lg:py-24" aria-labelledby="rvc-h">
      <div className={wrap}>
        <div id="rvc-h"><Head title="Two ways to get exactly what you need." /></div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {col("Ready-made lists", "For buyers who want an existing dataset.", ["Browse available categories.", "Preview the data.", "Choose a package.", "Complete one payment.", "Receive the download link."], { href: "/lists", label: "Browse Ready-Made Lists" }, true, <Package className="size-6" aria-hidden />)}
          {col("Custom list builder", "For buyers with more specific requirements.", ["Describe the target industry.", "Choose geographic coverage.", "Specify quantities and fields.", "Submit your requirements.", "Receive a quotation or follow-up from our team."], { href: "/custom-list", label: "Build My Custom List" }, false, <Sparkles className="size-6" aria-hidden />)}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm">A custom list is a request, not an instant purchase. We reply with a quote or follow-up, and no price is promised in advance.</p>
      </div>
    </section>
  );
}

const pipeline = [
  [Globe, "Collect", "Business information from documented sources."],
  [Eraser, "Clean and organize", "Records are tidied and structured."],
  [Copy, "Remove duplicates", "Duplicate entries are removed."],
  [Sparkles, "Enrich", "Relevant business details are added where missing."],
  [MailCheck, "Verify emails", "BeigeLeads refreshes its databases every 90 days."],
  [RefreshCw, "Re-verify", "All data is checked again every 90 days."],
] as const;

export function VerificationPipeline() {
  return (
    <section className="py-16 lg:py-24" aria-labelledby="ver-h">
      <div className={wrap}>
        <div id="ver-h"><Head title="Business data you can evaluate with confidence." text="This is the process we follow, stage by stage. We do not publish accuracy percentages." /></div>
        <ol className="relative mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3">
          <span aria-hidden className="absolute left-[8%] right-[8%] top-7 hidden h-0.5 bg-sand-300 lg:block"><span className="hiw-fill-x block h-full bg-forest-500" /></span>
          {pipeline.map(([Icon, t, d], i) => (
            <li key={t} className="reveal relative flex gap-3 lg:flex-col lg:items-center lg:text-center">
              <span style={{ animationDelay: `${i * 1.1}s` }} className="hiw-glow relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl border border-sand-300 bg-white text-forest-700"><Icon className="size-6" aria-hidden /></span>
              <span><span className="block font-semibold text-forest-900">{i + 1}. {t}</span><span className="block text-sm">{d}</span></span>
            </li>
          ))}
        </ol>
        <p className="mt-8 text-center text-sm">
          <Link href="/verification" className="font-semibold text-forest-900 underline underline-offset-4">How verification works</Link> · <Link href="/data-sources" className="font-semibold text-forest-900 underline underline-offset-4">Where our data comes from</Link>
        </p>
      </div>
    </section>
  );
}

const benefits = [
  [Wallet, "One-time purchasing", "Pay once. No recurring billing.", "/help/pricing/no-subscription"],
  [UserX, "No account required", "Buy with an email address only.", "/help/getting-started/do-i-need-an-account"],
  [Package, "Transparent packages", "See the package and what it includes before you pay.", "/help/pricing/understanding-packages"],
  [Table2, "Free masked sample", "Inspect the structure before you buy.", "/sample"],
  [Sparkles, "Ready-made or custom", "Pick an existing list or request your own.", "/custom-list"],
  [FileSpreadsheet, "CSV, Excel or TXT", "Files in formats your tools already open.", "/help/delivery/file-formats"],
  [ShieldCheck, "Verification method", "A documented, stage-by-stage process.", "/verification"],
  [LifeBuoy, "Replacement and refund policy", "A written policy for bounced contacts.", "/legal/refund-replacement"],
] as const;

export function Benefits() {
  return (
    <section className="bg-sand-100 py-16 lg:py-24" aria-labelledby="ben-h">
      <div className={wrap}>
        <div id="ben-h"><Head title="Built for buyers who want the data, not another subscription." /></div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(([Icon, t, d, href]) => (
            <li key={t} className="reveal">
              <Link href={href} className="group flex h-full flex-col rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:-translate-y-1 hover:border-forest-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <Icon className="size-6 text-forest-500" aria-hidden />
                <span className="mt-3 font-semibold text-forest-900">{t}</span>
                <span className="mt-1 text-sm">{d}</span>
                <ArrowRight className="mt-auto size-4 pt-0 text-forest-500 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const compareRows = [
  ["Payment", "One payment per list", "Usually a recurring plan"],
  ["What you get", "A downloadable file you keep", "Often ongoing access to a platform"],
  ["Account", "None needed to buy", "Usually an account or login"],
  ["How you buy", "A package for a specific list", "Often a plan, tier or seat"],
  ["Workflow", "Ready-made data you load into your own tools", "Often a prospecting workflow inside the tool"],
] as const;

export function PurchaseModels() {
  return (
    <section className="py-16 lg:py-24" aria-labelledby="pm-h">
      <div className={wrap}>
        <div id="pm-h"><Head title="One-time purchase vs subscription tools" text="A comparison of buying models, not of products. Subscription tools differ from each other, so read this as a general pattern." /></div>
        <div className="mx-auto mt-10 max-w-4xl overflow-x-auto rounded-3xl border border-sand-200 bg-white shadow-sm">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <caption className="sr-only">Purchasing model comparison</caption>
            <thead>
              <tr className="bg-sand-100">
                <th scope="col" className="px-5 py-4" />
                <th scope="col" className="bg-forest-900 px-5 py-4 text-sand-50">BeigeLeads</th>
                <th scope="col" className="px-5 py-4 text-forest-900">Subscription tools (typical)</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map(([k, a, b]) => (
                <tr key={k} className="border-t border-sand-200">
                  <th scope="row" className="px-5 py-4 font-semibold text-forest-900">{k}</th>
                  <td className="bg-forest-100/50 px-5 py-4 font-medium text-forest-900"><Check className="mr-1.5 inline size-4 text-forest-500" aria-hidden />{a}</td>
                  <td className="px-5 py-4"><Minus className="mr-1.5 inline size-4 text-sand-300" aria-hidden />{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8 text-center"><Button asChild size="lg"><Link href="/lists">Explore BeigeLeads Lists</Link></Button></div>
      </div>
    </section>
  );
}

const trust = [
  ["What a masked sample includes", "The same columns as the full list, with email, phone and street address hidden.", "/help/data-quality/masked-sample-data"],
  ["How payment confirmation works", "We watch the blockchain and confirm your order once the payment is seen.", "/help/payments/how-payment-confirmation-works"],
  ["What happens after you pay", "Your order is processed and the link is emailed to you.", "/help/pricing/after-payment"],
  ["How delivery works", "A download link arrives by email. Most orders are instant, some take up to 12 hours.", "/help/delivery/how-you-receive-your-list"],
  ["If a link does not work", "Check the troubleshooting guide, then contact us and we will fix it.", "/help/delivery/download-issues"],
  ["How to request support", "Write to us from the contact page.", "/contact"],
  ["Refunds and replacements", "Our written policy covers bounced contacts.", "/legal/refund-replacement"],
] as const;

export function TrustSection() {
  return (
    <section className="bg-sand-100 py-16 lg:py-24" aria-labelledby="trust-h">
      <div className={wrap}>
        <div id="trust-h"><Head title="Everything you need to know before you purchase." /></div>
        <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trust.map(([t, d, href]) => (
            <li key={t} className="reveal">
              <Link href={href} className="group block h-full rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:border-forest-500 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <span className="font-semibold text-forest-900">{t}</span>
                <span className="mt-1 block text-sm">{d}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest-700 group-hover:text-forest-900">Read more <ArrowRight className="size-3.5" aria-hidden /></span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export const hiwFaqs: readonly (readonly [string, string])[] = [
  ["How does BeigeLeads work?", "You find a business contact list, preview a masked sample, choose a package, pay once in cryptocurrency, and receive an email with a link to your file. There is nothing to install and no account to create."],
  ["Do I need a subscription or account?", "No. Every purchase is one-time and you only give an email address at checkout. There is no recurring billing."],
  ["Can I preview a list before purchasing?", "Yes. Product pages show example rows with masked contact details, and you can request a free masked sample from the sample page. We prepare samples by hand and email them to you."],
  ["What information is included in each list?", "Business name, address, city, country, phone, email and website. The fields available can vary by product, and each product page lists them."],
  ["How do I pay for my list?", "Checkout shows the cryptocurrencies currently open, an exact amount, the network to use and an address. Once the payment is confirmed on the blockchain, your order moves on automatically."],
  ["How quickly will I receive my data?", "Delivery is usually instant. In some cases it can take up to 12 hours at most. The link comes by email, and you can download the file as many times as you need."],
  ["Can I request a custom business contact list?", "Yes. Describe the industry, location, quantity and fields on the custom list page. It is a request, not an instant purchase: we answer with a quote or a follow-up."],
  ["What happens if I have a problem with my purchased data?", "Our refund and replacement policy covers bounced contacts, and the Help Center explains how to report an issue. If a link does not work, contact us and we will help."],
];

export function HowFaq() {
  return (
    <section className="py-16 lg:py-24" aria-labelledby="faq-h">
      <div className="mx-auto max-w-3xl px-4">
        <h2 id="faq-h" className={`${h2} text-center`}>Questions before you buy</h2>
        <div className="mt-10 space-y-3">
          {hiwFaqs.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-sand-300 bg-sand-100 transition-colors open:border-forest-900 open:bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-4 text-lg font-semibold text-forest-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 [&::-webkit-details-marker]:hidden">
                {q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-forest-900 text-forest-300 transition-transform duration-300 group-open:rotate-45"><Plus className="size-4" aria-hidden /></span>
              </summary>
              <p className="px-6 pb-6 leading-relaxed"><FaqAnswer text={a} skip={["/how-it-works"]} /></p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm">More answers: <Link href="/help-center" className="font-semibold text-forest-900 underline underline-offset-4">Help Center</Link></p>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: hiwFaqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 pb-20 sm:px-6" aria-labelledby="final-h">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-forest-900 px-6 py-16 text-center sm:px-12">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
          {[10, 28, 46, 64, 82].map((l, i) => (
            <span key={l} className="hiw-float absolute top-8 h-3 w-16 rounded-full bg-forest-700" style={{ left: `${l}%`, animationDelay: `${i * 0.5}s`, top: `${14 + (i % 3) * 22}%` }} />
          ))}
        </div>
        <div className="relative">
          <h2 id="final-h" className="display mx-auto max-w-3xl text-5xl text-sand-50 sm:text-6xl">Your next customers could be one list away.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-sand-200">Explore available business contact lists, review a sample, and purchase the data that fits your goals.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg"><Link href="/#find-leads">Find My Leads</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/sample">Request a Free Sample</Link></Button>
          </div>
        </div>
      </div>
    </section>
  );
}


