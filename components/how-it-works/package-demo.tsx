"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { formatUsd, type Package } from "@/lib/catalog";

/**
 * Package picker. Record sizes and prices are shown ONLY when the catalog data is real
 * (`showNumbers`). While products are placeholders, the cards show names and included fields only.
 */
export function PackageDemo({ packages, fields, showNumbers, productTitle }: { packages: readonly Package[]; fields: readonly string[]; showNumbers: boolean; productTitle: string }) {
  const [sel, setSel] = useState(packages.find((p) => p.highlighted)?.name ?? packages[0]?.name ?? "");
  const cur = packages.find((p) => p.name === sel);
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_20px_50px_-32px_rgba(15,42,29,0.5)]">
      <p className="text-sm font-semibold text-forest-900">Example: {productTitle}</p>
      <div role="radiogroup" aria-label="Package" className="mt-3 grid gap-2 sm:grid-cols-3">
        {packages.map((p) => (
          <button key={p.name} type="button" role="radio" aria-checked={p.name === sel} onClick={() => setSel(p.name)}
            className={`relative rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${p.name === sel ? "border-forest-900 bg-forest-100/60 shadow-sm" : "border-sand-300 bg-sand-50 hover:border-forest-500"}`}>
            <span className="block font-semibold text-forest-900">{p.name}</span>
            {showNumbers && <span className="block text-sm">{p.records.toLocaleString("en-US")} records · {formatUsd(p.priceUsdCents)}</span>}
            {p.highlighted && <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">Recommended</span>}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 rounded-xl bg-sand-100 p-4 text-sm">
        <p className="font-semibold text-forest-900">{cur?.name} package includes</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {fields.map((f) => (<li key={f} className="flex items-center gap-2"><Check className="size-4 text-forest-500" aria-hidden />{f}</li>))}
        </ul>
        {!showNumbers && <p className="mt-3">Record sizes and prices are set per list and package. You see them on the product page before you pay.</p>}
      </div>
    </div>
  );
}
