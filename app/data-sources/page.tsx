import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarClock, EyeOff, Mail, ShieldCheck, Wallet, Hourglass, TrendingDown, MailX } from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SolutionFaq } from "@/components/solutions/sections";
import { Button } from "@/components/ui/button";
import { RecordJourney } from "@/components/data-sources/record-journey";
import { SourceFlow } from "@/components/data-sources/source-flow";
import { VerifyRing } from "@/components/data-sources/verify-ring";

// NEEDS LAWYER REVIEW: describes how data is sourced. Every claim here comes from the owner's
// description of the operation and must stay true; see TODO-BEFORE-LAUNCH.md.
export const metadata: Metadata = {
  title: "Data sources: how every BeigeLeads record is built",
  description:
    "Where our business contact data comes from, how we find missing details, how emails are checked, and how often every record is re-verified.",
  alternates: { canonical: "/data-sources" },
  robots: { index: false, follow: true }, // remove with the site-wide noindex at launch
};

const steps = [
  ["Collect raw data", "Our team gathers raw business records from public listings, websites, registries, directories, licensed providers, surveys and our own research. At this point a record is just a name and a place."],
  ["Append and clean", "We add the basics that were missing, such as address, phone and website, then standardise formats and remove duplicates so one business appears once."],
  ["Find what is missing", "We look for the details that make a list useful: the owner or decision maker, the tech stack a business uses, and a working email address."],
  ["Verify", "Our team checks every email. Records that fail are corrected or dropped, not shipped."],
  ["Organize", "Each record is tagged by category, country, city and size, so you can buy exactly the slice you need."],
  ["Put it on sale", "Only then does a record join a list. Every list page shows a masked sample and the date it was last verified."],
] as const;

const faq = [
  ["Where does your data come from?", "From public business listings and maps, company websites, public government registries, business directories, licensed data providers, public professional profiles and social handles, surveys, and our own research. We pull from more than 200 sources across those eight types."],
  ["Do you collect data automatically?", "Some of it. We use a mix of automated collection from public pages, licensed data, surveys and manual research by our team. Everything goes through the same cleaning and verification steps."],
  ["How do you find email addresses?", "Three ways. We use business emails that companies publish themselves, we work out likely addresses from a company's naming pattern, and we use waterfall enrichment, which asks one source after another until an address is found. Every candidate is checked before it is kept."],
  ["How do you verify emails?", "Our own team runs SMTP checks. That means asking the recipient's mail server whether it accepts the address, without sending a message. No check is perfect, because some servers accept every address, so a small share can still bounce."],
  ["How fresh is the data?", "All data is re-verified every 90 days. Each list page shows the date it was last verified so you can see how fresh it is before you buy."],
  ["Can I email everyone on a list?", "That depends on your country and how you use the data. Read our lawful use policy and the pages for GDPR, CAN-SPAM and CASL before you send. We are not a law firm and this page is not legal advice."],
  ["How can someone be removed?", "Anyone can use the opt-out page. Removed addresses are left out of every file we deliver afterwards."],
] as const;

export default function DataSourcesPage() {
  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-forest-900 text-sand-100">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 60% at 85% 20%, rgba(143,208,169,0.18), transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-32 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-28 lg:pt-44">
          <div>
            <h1 className="display text-6xl text-sand-50 sm:text-7xl lg:text-8xl">Every record has a paper trail.</h1>
            <p className="mt-6 max-w-xl text-lg text-sand-200">
              A list is only worth what its worst record is worth. So before a business reaches your file, a person on our team has
              collected it, filled its gaps, checked its email and tagged it. This page shows each step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sample">See a sample first</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/lists">Browse lists</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <RecordJourney />
          </div>
        </div>
      </section>

      <Breadcrumbs items={[{ name: "Data sources", href: "/data-sources" }]} />

      {/* 2. Sources */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">Records come from many places, never from one.</h2>
        <p className="mt-5 max-w-2xl text-lg">
          We draw on more than 200 sources across eight types. A single source can be wrong or out of date. When several independent
          sources agree, a record is far more likely to be right.
        </p>
        <div className="mt-10">
          <SourceFlow />
        </div>
      </section>

      {/* 3. Pipeline */}
      <section className="border-y border-sand-200 bg-sand-100 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">From raw record to ready list, in six steps.</h2>
          <ol className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
            {steps.map(([title, text], i) => (
              <li key={title} className="flex gap-5">
                <span className="display grid size-12 shrink-0 place-items-center rounded-full bg-forest-900 text-2xl text-forest-300">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-1.5">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4. Email discovery */}
      <section className="bg-forest-900 py-20 text-sand-200">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="display text-5xl text-sand-50 sm:text-6xl">Three ways we find an email. One way we keep it.</h2>
            <ul className="mt-8 space-y-5">
              {[
                ["Published by the business", "Many companies list a contact email on their own site. We start there."],
                ["Pattern inference", "If a company writes first.last@domain, we work out the likely address for the person we need."],
                ["Waterfall enrichment", "We ask one source after another until an address turns up, and stop as soon as we have one."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <Mail className="mt-1 size-5 shrink-0 text-forest-300" aria-hidden />
                  <p>
                    <span className="font-semibold text-sand-50">{t}.</span> {d}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sand-50">Whichever way an address is found, it only stays if it passes our SMTP check.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-sand-300">Illustration: candidates for one fictional business</p>
            <ul className="mt-4 space-y-3 font-mono text-sm">
              {[
                ["info@example-dental.test", "Published on the website", "kept", true],
                ["owner@example-dental.test", "Pattern guess", "rejected by mail server", false],
                ["a.example@example-dental.test", "Waterfall enrichment", "kept", true],
              ].map(([addr, how, result, ok], i) => (
                <li
                  key={addr as string}
                  className="field-in rounded-xl bg-forest-700/60 px-4 py-3"
                  style={{ animationDelay: `${i * 260}ms` }}
                >
                  <p className="text-sand-50">{addr}</p>
                  <p className="mt-1 flex items-center gap-2 font-sans text-xs text-sand-300">
                    {how} ·{" "}
                    <span className={`inline-flex items-center gap-1 font-semibold ${ok ? "text-forest-300" : "text-sand-300"}`}>
                      {ok ? <BadgeCheck className="size-3.5" aria-hidden /> : <MailX className="size-3.5" aria-hidden />}
                      {result as string}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Verification */}
      <section className="bg-forest-700 py-20 text-sand-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div className="rounded-3xl bg-forest-900 p-8">
            <VerifyRing />
          </div>
          <div>
            <h2 className="display text-5xl text-sand-50 sm:text-6xl">Checked by our team, then checked again every 90 days.</h2>
            <p className="mt-5 text-lg">
              Email addresses go stale as people change jobs and companies close. So the work does not stop when a list goes on sale.
              All of our data is re-verified every 90 days, and each list page shows when it was last done.
            </p>
            <p className="mt-4">
              BeigeLeads refreshes its databases every 90 days. Be aware that no check is
              perfect: some mail servers accept every address, so a few contacts can still bounce. Our{" "}
              <Link href="/legal/refund-replacement" className="font-semibold text-sand-50 underline underline-offset-4">
                Refund &amp; Returns policy
              </Link>{" "}
              explains what happens then: above a 5% bounce rate, we replace the bounced emails.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Why it matters + promises */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">What a stale list really costs you.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            [MailX, "Bounces hurt your sender name", "Mail providers watch how many of your emails bounce. Too many, and even your good emails land in spam."],
            [Hourglass, "Hours go to dead ends", "Every wrong number or closed business is time your team spends and never gets back."],
            [TrendingDown, "Deals you never see", "The right owner never hears from you, because the list pointed at someone who left."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof MailX;
            return (
              <div key={t as string} className="rounded-2xl border border-sand-200 bg-sand-100 p-6">
                <I className="size-6 text-forest-500" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold">{t as string}</h3>
                <p className="mt-2">{d as string}</p>
              </div>
            );
          })}
        </div>

        <h2 className="display mt-20 max-w-3xl text-5xl text-forest-900 sm:text-6xl">Four things you can check for yourself.</h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            [EyeOff, "A masked sample before you pay", "Every list page shows sample rows with the contact details hidden, and you can request a free sample by email."],
            [CalendarClock, "A last-verified date on every list", "You can see how fresh a list is before you spend anything."],
            [ShieldCheck, "Opt-outs that really work", "People who ask to be removed are left out of every file we deliver afterwards."],
            [Wallet, "Pay once, keep the file", "No subscription and no account. You download your list and it is yours to use under our lawful use policy."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Mail;
            return (
              <li key={t as string} className="flex gap-4 rounded-2xl border border-sand-200 p-6">
                <I className="mt-1 size-6 shrink-0 text-forest-500" aria-hidden />
                <div>
                  <h3 className="text-lg font-semibold">{t as string}</h3>
                  <p className="mt-1">{d as string}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <SolutionFaq name="Our Data" items={faq} />
    </>
  );
}
