"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sampleColumns } from "@/lib/sample-data";

export type LedgerSheet = { key: string; label: string; rows: [string, string, string, string][] };

/** Real masked rows only (a product's own sample or the site-wide one). Tabs appear only when there is more than one sheet. */
export function SampleLedger({ sheets }: { sheets: LedgerSheet[] }) {
  const [key, setKey] = useState(sheets[0]?.key ?? "");
  const sheet = sheets.find((s) => s.key === key) ?? sheets[0];
  if (!sheet) return null;
  return (
    <div className="rounded-xl border-2 border-forest-900 bg-white shadow-[6px_6px_0_0_var(--color-forest-900)]">
      {sheets.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-b-2 border-forest-900 bg-sand-100 p-3">
          <span className="mr-1 text-sm font-semibold text-forest-900">Pick a list</span>
          {sheets.map((s) => (
            <button key={s.key} type="button" aria-pressed={s.key === key} onClick={() => setKey(s.key)}
              className={cn("rounded-md border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600", s.key === key ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-sand-50 text-forest-900 hover:bg-sand-200")}>
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead><tr className="border-b border-sand-200 text-forest-500">{sampleColumns.map((c) => <th key={c} scope="col" className="px-4 py-2.5 font-semibold">{c}</th>)}</tr></thead>
          <tbody key={sheet.key}>
            {sheet.rows.map((r, i) => (
              <tr key={`${r[0]}-${i}`} className="row-in border-b border-sand-200" style={{ animationDelay: `${i * 45}ms` }}>
                <td className="px-4 py-3 font-medium text-forest-900">{r[0]}</td><td className="px-4 py-3">{r[1]}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[2]}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 bg-forest-900 px-4 py-3 text-sm text-sand-100">
        <Lock className="size-4 shrink-0" aria-hidden />
        <span>Emails stay masked until you buy. The full file has every row, unmasked.</span>
      </div>
    </div>
  );
}
