import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { compareHref, compareTitle } from "@/lib/compare";
import { CHECKED_LABEL, comparisons } from "@/lib/compare-data";

export const metadata: Metadata = {
  title: "Compare BeigeLeads with other list and prospecting tools",
  description: "Sourced, plain comparisons between BeigeLeads (buy a list once) and subscription prospecting tools and other list stores.",
  alternates: { canonical: "/compare" },
};

export default function CompareHub() {
  return (
    <>
      <Breadcrumbs items={[{ name: "Compare", href: "/compare" }]} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-8">
        <h1 className="display text-5xl text-forest-900 sm:text-6xl">Compare BeigeLeads</h1>
        <p className="mt-3 max-w-2xl text-lg">BeigeLeads sells a list once. Many other tools sell access. Each page below sets out the differences using only what the other company says on its own pages, with sources, last read {CHECKED_LABEL}.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {comparisons.map((c) => (
            <li key={c.slug}>
              <Link href={compareHref(c.slug)} className="block h-full rounded-2xl border border-sand-200 bg-white p-6 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <span className="text-lg font-bold text-forest-900">{compareTitle(c.name)}</span>
                <span className="mt-2 block text-sm">{c.tagline}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
