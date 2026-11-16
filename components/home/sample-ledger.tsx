"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// PLACEHOLDER rows to show the layout only. Not real businesses, not real data.
// Replace with real masked samples from the pipeline (see TODO-BEFORE-LAUNCH.md).
const sheets = {
  dentists: {
    label: "Dentists",
    rows: [
      ["Sample Dental Studio", "Denver, US", "o***@example.com", "+1 303 ••• ••01"],
      ["Placeholder Family Dentistry", "Chicago, US", "i***@example.com", "+1 312 ••• ••02"],
      ["Example Smile Clinic", "London, GB", "h***@example.com", "+44 20 •••• ••03"],
      ["Demo Orthodontics", "Toronto, CA", "c***@example.com", "+1 416 ••• ••04"],
    ],
  },
  restaurants: {
    label: "Restaurants",
    rows: [
      ["Sample Noodle House", "Chicago, US", "m***@example.com", "+1 312 ••• ••11"],
      ["Placeholder Bistro", "London, GB", "r***@example.com", "+44 20 •••• ••12"],
      ["Example Grill & Bar", "Denver, US", "g***@example.com", "+1 303 ••• ••13"],
      ["Demo Bakery Café", "Toronto, CA", "b***@example.com", "+1 416 ••• ••14"],
    ],
  },
  "ski-shops": {
    label: "Ski shops",
    rows: [
      ["Sample Alpine Outfitters", "Denver, US", "s***@example.com", "+1 303 ••• ••21"],
      ["Placeholder Snow & Board", "Vancouver, CA", "w***@example.com", "+1 604 ••• ••22"],
      ["Example Ski Rental", "Chamonix, FR", "l***@example.com", "+33 4 •• •• ••23"],
      ["Demo Powder Supply", "Salt Lake City, US", "p***@example.com", "+1 801 ••• ••24"],
    ],
  },
} as const;

type SheetKey = keyof typeof sheets;
const cols = ["Business", "Location", "Email", "Phone"];

export function SampleLedger() {
  const [key, setKey] = useState<SheetKey>("dentists");
  const sheet = sheets[key];

  return (
    <div className="rounded-xl border-2 border-forest-900 bg-white shadow-[6px_6px_0_0_var(--color-forest-900)]">
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-forest-900 bg-sand-100 p-3">
        <span className="mr-1 text-sm font-semibold text-forest-900">Pick a list</span>
        {(Object.keys(sheets) as SheetKey[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={k === key}
            onClick={() => setKey(k)}
            className={cn(
              "rounded-md border px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600",
              k === key
                ? "border-forest-900 bg-forest-900 text-sand-50"
                : "border-sand-300 bg-sand-50 text-forest-900 hover:bg-sand-200",
            )}
          >
            {sheets[k].label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-forest-500">
              {cols.map((c) => (
                <th key={c} scope="col" className="px-4 py-2.5 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody key={key}>
            {sheet.rows.map((r, i) => (
              <tr
                key={r[0]}
                className="row-in border-b border-sand-200"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <td className="px-4 py-3 font-medium text-forest-900">{r[0]}</td>
                <td className="px-4 py-3">{r[1]}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[2]}</td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 bg-forest-900 px-4 py-3 text-sm text-sand-100">
        <Lock className="size-4 shrink-0" aria-hidden />
        <span>Emails stay masked until you buy. The full file has every row, unmasked.</span>
      </div>
      <p className="border-t border-sand-200 px-4 py-2 text-xs text-forest-500">
        Layout preview with placeholder rows. Not real businesses.
      </p>
    </div>
  );
}
