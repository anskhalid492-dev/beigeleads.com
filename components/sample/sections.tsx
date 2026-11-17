import Link from "next/link";
import { Eye, EyeOff, ListChecks, Mail, ShieldCheck, Table2 } from "lucide-react";

export function Benefits() {
  const items = [
    ["No payment details", "Requesting a sample never asks for a card or a wallet."],
    ["Masked by design", "Emails and phone numbers are hidden in every sample."],
    ["See the real structure", "Check the fields and layout before you buy."],
  ] as const;
  return (
    <ul className="mt-6 grid gap-3 sm:grid-cols-3">
      {items.map(([t, d]) => (
        <li key={t} className="rounded-2xl border border-sand-200 bg-white/70 p-4">
          <p className="font-semibold text-forest-900">{t}</p>
          <p className="mt-1 text-sm">{d}</p>
        </li>
      ))}
    </ul>
  );
}

export function WhatYouReceive() {
  return (
    <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-100 p-5">
      <h2 className="text-base font-semibold text-forest-900">What you receive</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        <li>A masked sample of the list you pick, as the table above shows.</li>
        <li>The same columns the full list has, so you can judge the structure.</li>
        <li>A confirmation email first. Our team prepares and sends the sample itself.</li>
      </ul>
    </div>
  );
}

export function Steps() {
  const steps = [
    [ListChecks, "Choose your list", "Pick a ready-made list, or describe the one you need."],
    [Mail, "Request your sample", "Enter your email. No payment details."],
    [Table2, "Review the preview", "Inspect the fields and the masked rows before you decide."],
  ] as const;
  return (
    <section className="py-16 lg:py-20" aria-labelledby="steps-h">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="steps-h" className="display text-center text-5xl text-forest-900 sm:text-6xl">Three steps, no commitment</h2>
        <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
          <svg aria-hidden className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-1 w-[68%] md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
            <line x1="0" y1="1" x2="100" y2="1" stroke="var(--color-sand-300)" strokeWidth="2" vectorEffect="non-scaling-stroke" className="flow-line" />
          </svg>
          {steps.map(([Icon, t, d], i) => (
            <li key={t} className="relative text-center">
              <span className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border border-sand-200 bg-white text-forest-700 shadow-sm">
                <Icon className="size-7" aria-hidden />
                <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-forest-900 text-xs font-bold text-sand-50">{i + 1}</span>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-forest-900">{t}</h3>
              <p className="mx-auto mt-1 max-w-xs text-sm">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Trust() {
  const cards = [
    [EyeOff, "Why data is masked", "A sample is for checking structure. Contact details are hidden so working contacts are not given away before purchase."],
    [Eye, "What you can inspect", "The columns, how fields are formatted, and how a row looks. The product page lists every field a list includes."],
    [ShieldCheck, "How a full list differs", "A full list contains complete, unmasked contact details. A sample shows the same layout with hidden values."],
  ] as const;
  const links = [
    ["/help/data-quality/masked-sample-data", "How masked samples work"],
    ["/help/getting-started/preview-data-before-purchase", "Preview data before you buy"],
    ["/help/products/whats-in-a-list", "What is in a list"],
    ["/verification", "How we verify emails"],
  ] as const;
  return (
    <section className="border-t border-sand-200 bg-sand-100 py-16 lg:py-20" aria-labelledby="trust-h">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="trust-h" className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">Know what you&rsquo;re getting before you buy.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {cards.map(([Icon, t, d]) => (
            <div key={t} className="rounded-2xl border border-sand-200 bg-white p-6">
              <Icon className="size-6 text-forest-500" aria-hidden />
              <h3 className="mt-3 text-lg font-semibold text-forest-900">{t}</h3>
              <p className="mt-1.5 text-sm">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 font-semibold text-forest-900">Review product details and read more:</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {links.map(([h, l]) => (
            <li key={h}><Link href={h} className="inline-block rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-white">{l}</Link></li>
          ))}
          <li><Link href="/lists" className="inline-block rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-white">Browse all lists</Link></li>
        </ul>
      </div>
    </section>
  );
}
