import Link from "next/link";
import { Check, CircleCheck, CircleX, Copy, FileSpreadsheet, FileText, FileType2, Layers, Mail, LockKeyhole, ShieldAlert, ShieldCheck, Sparkles, Trash2, TriangleAlert, UserCheck, Wand2, type LucideIcon } from "lucide-react";
import type { EvSettings } from "@/lib/ev/settings";
import { EV_BENEFITS_HERO, EV_FORMATS, EV_PRIVACY, EV_STATUSES, EV_STEPS, EV_WHY } from "@/lib/ev/content";
import { PricingCards } from "./pricing-cards";
import { QuoteForm } from "./quote-form";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
const h2 = "display text-4xl text-forest-900 sm:text-5xl";
const btn = "inline-flex h-12 items-center rounded-full px-7 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

export function EvHero() {
  const rows: [string, "ok" | "bad" | "risk" | "dup"][] = [["maria.lopez@acme-dental.com", "ok"], ["info@blueridge-co.com", "risk"], ["j.smith@@gmail", "bad"], ["maria.lopez@acme-dental.com", "dup"], ["team@clearpath.io", "ok"]];
  const tone = { ok: ["Valid", "bg-forest-100 text-forest-900"], bad: ["Invalid", "bg-sand-200 text-forest-900"], risk: ["Risky", "bg-purple-100 text-forest-900"], dup: ["Duplicate", "bg-sand-100 text-forest-700"] } as const;
  return (
    <section className="relative overflow-hidden bg-forest-900 text-sand-100" style={{ backgroundImage: "radial-gradient(48rem 24rem at 100% 0%, rgba(45,106,79,0.45), transparent 70%)" }}>
      <div className={`${wrap} grid gap-14 pb-20 pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24`}>
        <div className="hero-in">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-forest-300">Email list verification service</p>
          <h1 className="display mt-4 text-5xl text-sand-50 sm:text-7xl xl:text-[5.25rem]">Verify Your Email List Before You Hit Send</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-sand-200">Identify invalid, duplicate, and risky email addresses before your next email campaign. Choose a verification package, securely upload your list, and let our team handle the verification process.</p>
          <ul className="mt-7 grid gap-x-6 gap-y-2.5 text-[0.95rem] font-semibold text-sand-50 sm:grid-cols-2">
            {EV_BENEFITS_HERO.map((b) => <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 size-5 shrink-0 text-forest-300" aria-hidden />{b}</li>)}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#pricing" className={`${btn} bg-purple-600 text-white hover:bg-purple-700`}>View Pricing &amp; Packages</a>
            <a href="#how-it-works" className={`${btn} border border-sand-50/30 text-sand-50 hover:border-sand-50 hover:bg-sand-50/10`}>How It Works</a>
          </div>
        </div>
        <figure className="hero-in rounded-3xl border border-forest-500/40 bg-forest-700/40 p-5 backdrop-blur" style={{ animationDelay: "150ms" }} aria-label="Animated illustration: an email list being checked and sorted by verification result">
          <div className="rounded-2xl bg-sand-50 p-4 text-forest-900">
            <div className="flex items-center justify-between border-b border-sand-200 pb-3 text-xs font-semibold"><span>your-list.csv</span><span>Illustration, not real data</span></div>
            <div className="relative">
              <ul className="mt-2 divide-y divide-sand-200 text-sm">
                {rows.map(([e, k], i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5" style={{ "--i": i } as React.CSSProperties}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="relative size-4 shrink-0">
                        <Mail className="ev-check absolute inset-0 size-4 text-forest-300" aria-hidden />
                        <span className="ev-res absolute inset-0">{k === "ok" ? <CircleCheck className="size-4 text-forest-500" aria-hidden /> : k === "bad" ? <CircleX className="size-4 text-forest-700" aria-hidden /> : k === "risk" ? <TriangleAlert className="size-4 text-purple-600" aria-hidden /> : <Copy className="size-4 text-forest-500" aria-hidden />}</span>
                      </span>
                      <span className="truncate font-mono text-xs">{e}</span>
                    </span>
                    <span className="relative grid h-6 w-[5.5rem] shrink-0 place-items-end">
                      <span className="ev-check absolute right-0 top-0 inline-flex h-6 items-center gap-1 rounded-full bg-sand-100 px-2.5 text-xs font-semibold text-forest-700"><i className="ev-dot" /><i className="ev-dot" /><i className="ev-dot" /></span>
                      <span className={`ev-res absolute right-0 top-0 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${tone[k][1]}`}>{tone[k][0]}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="ev-beam pointer-events-none absolute inset-x-0" aria-hidden />
            </div>
            <div className="mt-3 border-t border-sand-200 pt-3" aria-hidden>
              <div className="flex h-2 gap-1">
                {rows.map(([, k], i) => <span key={i} className={`ev-seg flex-1 rounded-full ${k === "ok" ? "bg-forest-500" : k === "risk" ? "bg-purple-600" : k === "bad" ? "bg-forest-900" : "bg-sand-300"}`} style={{ "--i": i } as React.CSSProperties} />)}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem] font-semibold text-forest-700">
                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-forest-500" />Valid</span>
                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-purple-600" />Risky</span>
                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-forest-900" />Invalid</span>
                <span className="inline-flex items-center gap-1.5"><i className="size-2 rounded-full bg-sand-300" />Duplicate</span>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

const whyIcons: LucideIcon[] = [ShieldAlert, Copy, Trash2, TriangleAlert, Layers, Sparkles];
export function EvWhy() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={`${h2} mx-auto max-w-3xl text-center`}>A Cleaner Email List Starts with Better Verification</h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EV_WHY.map(([t, d], i) => { const I = whyIcons[i]; return (
            <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><span className="grid size-11 place-items-center rounded-xl bg-forest-100 text-forest-700"><I className="size-5" aria-hidden /></span><h3 className="mt-4 text-lg font-bold text-forest-900">{t}</h3><p className="mt-2 text-sm leading-relaxed">{d}</p></li>
          ); })}
        </ul>
      </div>
    </section>
  );
}

export function EvSteps() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={`${h2} mx-auto max-w-3xl text-center`}>Four Simple Steps to a Cleaner Email List</h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-4">
          {EV_STEPS.map(([t, d], i) => <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><span className="grid size-9 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50">{i + 1}</span><h3 className="mt-4 font-bold text-forest-900">{t}</h3><p className="mt-2 text-sm leading-relaxed">{d}</p></li>)}
        </ol>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm">Verification is done by our team and is not instant. We email you when work starts and when your results are ready.</p>
      </div>
    </section>
  );
}

export function EvPricing({ s }: { s: EvSettings }) {
  return (
    <section id="pricing" className="scroll-mt-24 bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={`${h2} mx-auto max-w-3xl text-center`}>Simple, Transparent Verification Pricing</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg">One-time payments. No subscription. Every package is a maximum, so smaller lists can use it too; the {s.packages[0].name} package accepts lists from 5K up to {s.packages[0].limit.toLocaleString("en-US")}.</p>
        <PricingCards packages={s.packages} enabled={s.enabled} />
        {!s.enabled && <p role="status" className="mt-6 text-center text-sm font-semibold">Email verification is not available right now. Please check back soon.</p>}
        <div id="quote" className="mx-auto mt-14 grid max-w-5xl scroll-mt-24 gap-8 rounded-3xl border border-sand-200 bg-white p-7 sm:p-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h3 className="display text-3xl text-forest-900 sm:text-4xl">Need to Verify More Than 1 Million Emails?</h3>
            <p className="mt-3">Contact our team for a custom verification quote.</p>
            <p className="mt-3 text-sm">Tell us roughly how many addresses you have and what you need. We reply by email.</p>
          </div>
          <div><h4 className="sr-only">Request Custom Quote</h4><QuoteForm /></div>
        </div>
      </div>
    </section>
  );
}

const fmtIcons: LucideIcon[] = [FileText, FileSpreadsheet, FileType2];
export function EvFormats({ s }: { s: EvSettings }) {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={`${h2} mx-auto max-w-3xl text-center`}>Upload Your List or Simply Paste Your Emails</h2>
        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {EV_FORMATS.map(([t, d], i) => { const I = fmtIcons[i]; return <li key={t} className="rounded-2xl border border-sand-200 bg-white p-6"><I className="size-7 text-forest-500" aria-hidden /><h3 className="mt-3 text-lg font-bold text-forest-900">{t}</h3><p className="mt-2 text-sm leading-relaxed">{d}</p></li>; })}
        </ul>
        <ul className="mx-auto mt-10 grid max-w-3xl gap-2 text-sm sm:grid-cols-2">
          {["One email per line", "Comma-separated addresses", "Semicolon-separated addresses", "Spreadsheet email columns, with extra columns kept in your original file"].map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{x}</li>)}
        </ul>
        <p className="mt-6 text-center text-sm">Files up to {s.maxUploadMb} MB each ({s.formats.map((f) => f.toUpperCase()).join(", ")}).</p>
      </div>
    </section>
  );
}

export function EvStatuses() {
  return (
    <section className="bg-sand-50 py-20 lg:py-24">
      <div className={wrap}>
        <h2 className={`${h2} mx-auto max-w-3xl text-center`}>Understand Your Verification Results</h2>
        <dl className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EV_STATUSES.map(([t, , d]) => <div key={t} className="rounded-2xl border border-sand-200 bg-white p-5"><dt className="font-bold text-forest-900">{t}</dt><dd className="mt-1.5 text-sm leading-relaxed">{d}</dd></div>)}
        </dl>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm">Verification results are estimates based on the checks available, not a guarantee of future deliverability.</p>
      </div>
    </section>
  );
}

const privIcons: LucideIcon[] = [LockKeyhole, ShieldCheck, Wand2, UserCheck, Trash2];
export function EvPrivacy({ s }: { s: EvSettings }) {
  return (
    <section className="bg-forest-900 py-20 text-sand-100 lg:py-24">
      <div className={wrap}>
        <h2 className="display mx-auto max-w-3xl text-center text-4xl text-sand-50 sm:text-5xl">Your Data Deserves Secure Handling</h2>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {EV_PRIVACY.map(([t, d], i) => { const I = privIcons[i]; return <li key={t} className="rounded-2xl border border-forest-500/40 bg-forest-700/40 p-6"><I className="size-6 text-forest-300" aria-hidden /><h3 className="mt-3 font-bold text-sand-50">{t}</h3><p className="mt-2 text-sm leading-relaxed text-sand-200">{d}</p></li>; })}
          <li className="rounded-2xl border border-forest-500/40 bg-forest-700/40 p-6"><Trash2 className="size-6 text-forest-300" aria-hidden /><h3 className="mt-3 font-bold text-sand-50">Defined retention</h3><p className="mt-2 text-sm leading-relaxed text-sand-200">Original files are deleted {s.retainOriginalDays} days after the job is completed. Result files are deleted {s.retainResultDays} days after delivery.</p></li>
        </ul>
        <p className="mt-8 text-center text-sm text-sand-200">Read how we handle personal data in our <Link href="/legal/privacy" className="font-semibold underline">privacy policy</Link>.</p>
      </div>
    </section>
  );
}

export function EvFinalCta() {
  return (
    <section className="bg-sand-100 py-20 lg:py-24">
      <div className={`${wrap} text-center`}>
        <h2 className={`${h2} mx-auto max-w-3xl`}>Ready to Verify Your Email List?</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg">Choose a package, securely submit your list, and let BeigeLeads handle the verification.</p>
        <a href="#pricing" className={`${btn} mt-8 bg-purple-600 text-white hover:bg-purple-700`}>Choose Your Package</a>
      </div>
    </section>
  );
}
