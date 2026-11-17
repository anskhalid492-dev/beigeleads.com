import Link from "next/link";
import { DbBadge } from "@/components/shared/db-icon";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Copilot } from "@/components/home/copilot";
import { SampleLedger } from "@/components/home/sample-ledger";
import { Faq } from "@/components/shared/faq";
import { FieldColumns } from "@/components/shared/field-columns";
import { FIELDS } from "@/lib/catalog";

// Phase 1 home. No invented stats, reviews, customers or counts (CLAUDE.md section 2).
// Anything marked PLACEHOLDER must be replaced with real data before launch.

const lists = [
  { slug: "dentists", name: "Dentists", note: "Practices and clinics" },
  { slug: "restaurants", name: "Restaurants", note: "Restaurants, cafés and bars" },
  { slug: "ski-shops", name: "Ski shops", note: "Retail, rental and repair" },
] as const;

const steps = [
  ["Pick a list", "Choose a category, then narrow by country or city."],
  ["Check the sample", "Open a masked preview before you pay anything."],
  ["Pay in crypto", "One payment. No account and no subscription."],
  ["Download the file", "A secure link arrives by email once the payment confirms."],
] as const;

const faq = [
  [
    "Is this a subscription?",
    "No. You pay once for a list and download the file. There is no monthly fee and no login to keep.",
  ],
  [
    "Can I see data before I pay?",
    "Yes. Every list page has a masked sample, and you can request a free sample file by email.",
  ],
  [
    "How do I pay?",
    "In crypto. Bitcoin and USDT (TRC20) are supported at launch, with more coins to follow.",
  ],
  [
    "What do I get?",
    "A downloadable file with the fields shown on the list page. The download link expires, so save the file when it arrives.",
  ],
  [
    "Can people ask to be removed?",
    "Yes. Anyone can use the opt-out page, and removed contacts are left out of future files.",
  ],
] as const;

export default function Home() {
  return (
    <>
      {/* Lead discovery co-pilot: structured catalog search, the primary entry point. */}
      <section className="px-2 pt-2 sm:px-4">
        <div className="relative isolate mx-auto max-w-[96rem] overflow-hidden rounded-[2rem] bg-gradient-to-br from-forest-900 via-forest-700 to-forest-500 px-4 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <div aria-hidden className="pointer-events-none absolute -left-24 bottom-[-6rem] -z-10 size-[28rem] rounded-full bg-forest-900/60 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 -z-10 size-[24rem] rounded-full bg-sand-200/20 blur-3xl" />
          <h1 className="display text-5xl text-sand-50 sm:text-7xl">Find the right leads. Own the list.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-sand-100">
            Search business contact lists by industry and location, or ask for a custom one.
          </p>
          <div className="mt-10"><Copilot /></div>
          <p className="mt-12 text-sm text-sand-200">One-time purchase · No subscription · No account · Free masked sample</p>
        </div>
      </section>

      {/* Hero: the list itself is the first thing you see. */}
      <section className="ruled border-b border-sand-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
          <div>
            <h2 className="display text-6xl text-forest-900 sm:text-7xl lg:text-[5.5rem]">
              Pay once.
              <br />
              Own the list.
            </h2>
            <p className="mt-6 max-w-md text-lg">
              Business contact lists by category, country and city. Look at a masked sample first.
              Pay one time. Download your file.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/lists">
                  Browse lists <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/sample">Get a free sample</Link>
              </Button>
            </div>
          </div>
          <SampleLedger />
        </div>
      </section>

      {/* One-time vs subscription: the whole business model in one glance. */}
      <section className="bg-forest-900 text-sand-100">
        <div className="mx-auto grid max-w-6xl gap-px px-4 py-0 md:grid-cols-2">
          <div className="py-12 md:pr-12">
            <h2 className="display text-4xl text-sand-300 sm:text-5xl">Subscription tools</h2>
            <p className="mt-4 max-w-sm text-sand-200">
              Pay every month. Stop paying and the access ends, along with the contacts you
              exported.
            </p>
          </div>
          <div className="border-t border-forest-700 py-12 md:border-l md:border-t-0 md:pl-12">
            <h2 className="display text-4xl text-sand-50 sm:text-5xl">BeigeLeads</h2>
            <p className="mt-4 max-w-sm text-sand-100">
              Pay once and download the file. No renewal, no seat limit, nothing to cancel.
            </p>
          </div>
        </div>
      </section>

      {/* Launch categories */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-5xl text-forest-900 sm:text-6xl">Start with a list</h2>
          <Link href="/lists" className="font-semibold text-forest-700 underline underline-offset-4">
            All categories
          </Link>
        </div>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {lists.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/lists/${l.slug}`}
                className="group flex h-full min-h-44 flex-col justify-between rounded-2xl border border-sand-300 bg-sand-100 p-6 transition-colors hover:border-forest-900 hover:bg-forest-900"
              >
                <span className="flex items-center gap-4">
                  <DbBadge category={l.slug} country="US" size="lg" />
                  <span className="display text-4xl text-forest-900 group-hover:text-sand-50">{l.name}</span>
                </span>
                <span className="flex items-center justify-between text-sm text-forest-700 group-hover:text-sand-200">
                  {l.note}
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm">
          Need another niche?{" "}
          <Link href="/request-category" className="font-semibold underline underline-offset-4">
            Ask for a category
          </Link>
          .
        </p>
      </section>

      {/* What is inside a file: drawn as spreadsheet columns. */}
      <section className="border-y border-sand-200 bg-sand-100 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="display text-5xl text-forest-900 sm:text-6xl">What is in the file</h2>
          <p className="mt-4 max-w-lg">
            Each list opens in Excel, Google Sheets or any email tool. Fields vary by list, and the
            list page shows exactly which ones you get.
          </p>
          <div className="mt-10">
            <FieldColumns fields={FIELDS} />
          </div>
        </div>
      </section>

      {/* How it works: a real sequence, so numbers are earned. */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="display text-5xl text-forest-900 sm:text-6xl">From search to download</h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title} className="border-t-2 border-forest-900 pt-4">
              <span className="display text-5xl text-forest-500">{i + 1}</span>
              <h3 className="mt-3 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-sm">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Faq items={faq} />

    </>
  );
}
