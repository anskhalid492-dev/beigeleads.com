import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleCheck, CircleSlash } from "lucide-react";
import { FitCheckForm } from "@/components/fit-check/form";
import { SolutionFaq } from "@/components/solutions/sections";
import { fitMeta } from "@/lib/seo/fit";

const metadataRaw: Metadata = { title: "Free list fit check | BeigeLeads", description: "Describe your ideal customer in one sentence. We check our real lists for a match and say plainly when there is none. No signup.", alternates: { canonical: "/list-fit-check" } };
export const metadata: Metadata = fitMeta(metadataRaw);

const STEPS: readonly (readonly [string, string])[] = [
  ["Say who you want to reach", "One sentence is enough: the trade, the place, anything that narrows it down, like having a website."],
  ["Pilo reads it against the catalog", "Pilo searches the lists we really sell, by trade, country, state or city and contact type. It does not guess at lists that do not exist."],
  ["You get a straight answer", "Matching lists show their real packages and prices. If nothing fits, you are told so and sent to a custom list request that is already filled in."],
];

const FAQ: readonly (readonly [string, string])[] = [
  ["Do I need to sign up or give my email?", "No. You type one sentence and Pilo answers in the chat. Nothing is saved to an account because there is no account."],
  ["Is this a quiz that collects leads?", "No. It is a search with an explanation. We do not ask for contact details to show you the result."],
  ["What if no list matches?", "Pilo says there is no ready-made match and opens the custom list request with your sentence filled in. You review it before you send anything."],
  ["Will it tell me how many contacts match?", "Only when the list page itself states a record count. The check never invents counts, scores or percentages."],
  ["Can I see a sample before I buy?", "Yes. Every matching list links to a free sample request, and the masked sample on the list page shows the fields."],
  ["Does the check work for any country?", "It covers the countries and places in our catalog. For anywhere else, Pilo points you to the custom list request."],
];

/** Illustrative reading of one sentence. Labelled as such: no real counts, no real list. */
function Reading() {
  const parts: { t: string; tag?: string; cls?: string }[] = [
    { t: "Independent " },
    { t: "dentists", tag: "Trade", cls: "bg-forest-100 text-forest-900" },
    { t: " in " },
    { t: "Texas", tag: "Place", cls: "bg-purple-100 text-purple-700" },
    { t: " with a " },
    { t: "website", tag: "Detail", cls: "bg-sand-200 text-forest-900" },
  ];
  return (
    <div className="relative rounded-[2rem] border border-sand-300 bg-white p-6 sm:p-8" aria-label="Example of how a sentence is read">
      <p className="mt-3 text-2xl font-semibold leading-[1.9] text-forest-900 sm:text-[1.7rem]">
        {parts.map((p, i) => p.tag ? (
          <span key={i} className={`relative mx-0.5 rounded-lg px-2 py-0.5 ${p.cls}`}>
            {p.t}
            <span className="absolute -top-5 left-1 text-[10px] font-semibold text-forest-700">{p.tag}</span>
          </span>
        ) : <span key={i}>{p.t}</span>)}
      </p>
      <div className="mt-8 space-y-3 border-t border-sand-200 pt-6">
        <div className="flex items-start gap-3 rounded-2xl bg-forest-100 p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-forest-500" aria-hidden />
          <div><p className="font-semibold text-forest-900">A list matches</p><p className="text-sm text-forest-700">You see it with its real packages, prices and a link to a free sample.</p></div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl bg-sand-100 p-4">
          <CircleSlash className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
          <div><p className="font-semibold text-forest-900">Nothing matches</p><p className="text-sm text-forest-700">Pilo says so, then opens a custom list request with your sentence filled in.</p></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <main className="bg-sand-50">
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-20">
        <div>
          <h1 className="display text-5xl text-forest-900 sm:text-6xl lg:text-7xl">Does a list fit your customer?</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-forest-700">Describe who you want to reach in one sentence. Pilo checks the real BeigeLeads catalog and tells you which lists match, or says plainly that none does.</p>
          <div className="mt-8"><FitCheckForm /></div>
          <p className="mt-4 text-sm text-forest-700">Free. No signup, no email. Prefer to browse? <Link className="font-semibold underline underline-offset-4" href="/lists">See all lists</Link> or <Link className="font-semibold underline underline-offset-4" href="/custom-list">build a custom list</Link>.</p>
        </div>
        <Reading />
      </section>

      <section className="border-y border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <h2 className="display max-w-xl text-3xl text-forest-900 sm:text-4xl">Three steps, one honest answer.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-sand-300 bg-white p-6">
                <span className="grid size-9 place-items-center rounded-full bg-forest-900 text-sm font-semibold text-sand-50">{i + 1}</span>
                <h3 className="mt-4 text-xl font-semibold text-forest-900">{t}</h3>
                <p className="mt-2 leading-relaxed text-forest-700">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SolutionFaq name="the List Fit Check" items={FAQ} />

      <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] bg-forest-900 p-8 text-sand-50 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="display text-3xl sm:text-4xl">Want to see the data first?</h2>
            <p className="mt-2 text-forest-300">Every list page has a masked sample. Request a free one for any list.</p>
          </div>
          <Link href="/sample" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50">Request a free sample <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>
    </main>
  );
}
