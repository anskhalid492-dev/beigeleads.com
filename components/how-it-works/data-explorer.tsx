"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export type ExplorerSheet = {
  slug: string; label: string; productSlug: string; country: string;
  rows: readonly { business: string; address: string; city: string; phone: string; email: string; website: string }[];
};

const cols = [
  ["business", "Business name"], ["address", "Address"], ["city", "City"], ["country", "Country"], ["phone", "Phone"], ["email", "Email"], ["website", "Website"],
] as const;
const masked = new Set(["address", "phone", "email"]);

/** Spreadsheet-style preview of EXAMPLE rows (fictional businesses, masked contacts). Click a column heading to highlight it. */
export function DataExplorer({ sheets }: { sheets: readonly ExplorerSheet[] }) {
  const id = useId();
  const [active, setActive] = useState(sheets[0]?.slug ?? "");
  const [hl, setHl] = useState<string>("email");
  const sheet = sheets.find((s) => s.slug === active) ?? sheets[0];
  if (!sheet) return null;
  const cell = (k: string) => (hl === k ? "bg-purple-100/70" : "");

  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-4 shadow-[0_24px_60px_-34px_rgba(15,42,29,0.5)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Choose a list" className={`flex flex-wrap gap-1.5 ${sheets.length < 2 ? "hidden" : ""}`}>
          {sheets.map((s) => (
            <button key={s.slug} role="tab" aria-selected={s.slug === active} aria-controls={`${id}-p`} onClick={() => setActive(s.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${s.slug === active ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-700 hover:bg-sand-200"}`}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-sm">Click a column heading to highlight it.</p>
      </div>
      <div id={`${id}-p`} role="tabpanel" className="mt-4 overflow-x-auto rounded-xl border border-sand-200">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">Sample rows for {sheet.label} with masked contact details.</caption>
          <thead className="bg-forest-900 text-sand-100">
            <tr>
              {cols.map(([k, label]) => (
                <th key={k} scope="col" className="p-0">
                  <button type="button" aria-pressed={hl === k} onClick={() => setHl(hl === k ? "" : k)}
                    className={`w-full whitespace-nowrap px-4 py-3 text-left font-semibold transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-purple-600 ${hl === k ? "bg-forest-700" : ""}`}>
                    {label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((r, i) => (
              <tr key={`${sheet.slug}-${r.business}`} className={`row-in border-t border-sand-200 transition-colors hover:bg-forest-100/50 ${i % 2 ? "bg-sand-50" : "bg-white"}`} style={{ animationDelay: `${i * 35}ms` }}>
                {cols.map(([k]) => {
                  const v = k === "country" ? sheet.country : r[k];
                  return (
                    <td key={k} className={`whitespace-nowrap px-4 py-3 transition-colors ${cell(k)} ${k === "business" ? "font-semibold text-forest-900" : ""} ${masked.has(k) ? "font-mono text-[13px]" : ""}`}>
                      {masked.has(k) && <Lock className="mr-1 inline size-3 text-forest-500" aria-hidden />}{v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm"><strong className="text-forest-900">Real rows, masked.</strong> Email, phone and street address are partly hidden in samples. Available fields vary by product.</p>
      <p className="mt-2 text-sm"><Link href={`/lists/${sheet.productSlug}`} className="font-semibold text-forest-900 underline underline-offset-4">See the {sheet.label} list</Link> · <Link href="/lists" className="font-semibold text-forest-900 underline underline-offset-4">Browse all lists</Link></p>
    </div>
  );
}
