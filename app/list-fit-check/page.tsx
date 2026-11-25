import type { Metadata } from "next";
import Link from "next/link";
import { FitCheckForm } from "@/components/fit-check/form";
import { fitMeta } from "@/lib/seo/fit";

const metadataRaw: Metadata = { title: "Free list fit check | BeigeLeads", description: "Describe your ideal customer in one sentence. We check our real lists for a match and say plainly when there is none. No signup.", alternates: { canonical: "/list-fit-check" } };
export const metadata: Metadata = fitMeta(metadataRaw);

export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-12 sm:px-6">
      <h1 className="display text-5xl text-forest-900 sm:text-6xl">Does a list fit your customer?</h1>
      <p className="mt-4 text-forest-700">Describe your ideal customer in one sentence. Pilo checks the real BeigeLeads catalog and tells you which ready-made lists match. When none does, it says so and opens a custom list request already filled in. No signup, no email needed.</p>
      <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-100 p-5"><FitCheckForm /></div>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-forest-700">
        <li>Matches come from the live catalog only, with real packages and prices.</li>
        <li>No made-up counts or scores. If a list is not for sale yet, you are told.</li>
        <li>Prefer to browse? <Link className="underline" href="/lists">See all lists</Link> or <Link className="underline" href="/custom-list">build a custom list</Link>.</li>
      </ul>
    </main>
  );
}
