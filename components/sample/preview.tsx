"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Lock } from "lucide-react";

export type PreviewSheet = {
  slug: string;
  label: string;
  industry: string;
  country: string;
  rows: readonly { business: string; city: string; website: string; email: string; phone: string }[];
};

const cols = ["Business name", "Industry", "City", "Country", "Website", "Email", "Phone"] as const;

/** Interactive example table. Rows are labelled examples (fictional businesses, masked contacts), never customer data. */
export function SamplePreview({ sheets }: { sheets: readonly PreviewSheet[] }) {
  const [active, setActive] = useState(sheets[0]?.slug ?? "");
  const id = useId();
  const sheet = sheets.find((s) => s.slug === active) ?? sheets[0];
  if (!sheet) return null;

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-4 shadow-[0_20px_50px_-32px_rgba(15,42,29,0.5)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-forest-900">Preview a list</h2>
        <div role="tablist" aria-label="Choose a list to preview" className="flex flex-wrap gap-1.5">
          {sheets.map((s) => (
            <button
              key={s.slug}
              role="tab"
              id={`${id}-tab-${s.slug}`}
              aria-selected={s.slug === active}
              aria-controls={`${id}-panel`}
              onClick={() => setActive(s.slug)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                s.slug === active ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-700 hover:bg-sand-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${sheet.slug}`} className="mt-4 overflow-x-auto rounded-xl border border-sand-200">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <caption className="sr-only">Sample rows for {sheet.label} with masked contact details.</caption>
          <thead className="bg-forest-900 text-sand-100">
            <tr>
              {cols.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-3.5 py-2.5 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody key={sheet.slug}>
            {sheet.rows.map((r, i) => (
              <tr key={r.business} style={{ animationDelay: `${i * 40}ms` }} className={`row-in border-t border-sand-200 ${i % 2 ? "bg-sand-50" : "bg-white"}`}>
                <td className="whitespace-nowrap px-3.5 py-2.5 font-semibold text-forest-900">{r.business}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5">{sheet.industry}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5">{r.city}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5">{sheet.country}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5">{r.website}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[13px]"><Lock className="mr-1 inline size-3 text-forest-500" aria-hidden />{r.email}</td>
                <td className="whitespace-nowrap px-3.5 py-2.5 font-mono text-[13px]"><Lock className="mr-1 inline size-3 text-forest-500" aria-hidden />{r.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-sm">
        <strong className="text-forest-900">Real rows, masked.</strong> Email addresses and phone numbers are partly hidden here. The sample file we send you is masked the same way.
      </p>
      <p className="mt-2 text-sm font-semibold text-forest-900">
        Want to explore a specific industry?{" "}
        <a href="#sample-form" className="text-purple-700 underline underline-offset-4 hover:text-purple-600">Request your sample.</a>{" "}
        <Link href="/lists" className="ml-1 font-medium text-forest-700 underline underline-offset-4">Browse lists</Link>
      </p>
    </div>
  );
}
