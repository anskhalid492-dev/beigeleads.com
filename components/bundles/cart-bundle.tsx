"use client";
import Link from "next/link";
import { Package, Trash2 } from "lucide-react";
import { formatUsd } from "@/lib/catalog";
import type { PricedBundle } from "@/lib/bundles/pricing";

/** A curated bundle as ONE cart line: its lists, the bundle price and what it saves. The whole bundle is removed together; its contents are never edited here. */
export function CartBundleCard({ b, onRemove }: { b: PricedBundle; onRemove: () => void }) {
  return (
    <article className="rounded-3xl border border-sand-200 bg-white p-5 sm:p-6">
      <div className="flex gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><Package className="size-7" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h3 className="text-lg font-bold leading-snug text-forest-900"><Link href={`/bundles/${b.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{b.name}</Link></h3>
            <p className="display text-3xl leading-none text-forest-900" aria-label={`Bundle price ${formatUsd(b.priceCents)}`}>
              {b.savingsCents > 0 && <span className="mr-2 text-lg font-normal text-forest-500 line-through">{formatUsd(b.listCents)}</span>}{formatUsd(b.priceCents)}
            </p>
          </div>
          <p className="mt-1 text-sm">Bundle · {b.components.length} databases{b.totalRecords ? ` · ${b.totalRecords.toLocaleString("en-US")} contacts` : ""}</p>
          {b.savingsCents > 0 && <p className="mt-1 text-sm font-semibold text-forest-700">You save {formatUsd(b.savingsCents)} ({b.savingsPercent}%) compared with buying them one by one.</p>}
        </div>
      </div>
      <ul aria-label={`Databases in ${b.name}`} className="mt-4 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-sand-50 text-sm">
        {b.components.map((c) => (
          <li key={c.slug} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-2.5">
            <span className="min-w-0"><Link href={`/lists/${c.slug}`} className="font-semibold text-forest-900 hover:underline">{c.name}</Link> <span className="text-forest-500">· {c.packageName}{c.records > 0 ? ` · ${c.records.toLocaleString("en-US")} contacts` : ""}</span></span>
            <span className="text-forest-500">{formatUsd(c.listCents)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs">The bundle is one purchase. To change what is inside, remove it and add another bundle or build your own. It does not get further discounts.</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 pt-3 text-sm">
        <p className="min-w-0 text-xs sm:text-sm">One-time license. CSV, Excel or TXT. Unlimited downloads.</p>
        <button type="button" onClick={onRemove} aria-label={`Remove the ${b.name} bundle from cart`} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><Trash2 className="size-4" aria-hidden /> Remove bundle</button>
      </div>
      {!b.purchasable && <p role="status" className="mt-4 rounded-xl bg-sand-100 px-4 py-2.5 text-sm">{b.reason}</p>}
    </article>
  );
}
