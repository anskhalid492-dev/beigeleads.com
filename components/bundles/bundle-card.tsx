import Link from "next/link";
import { Package } from "lucide-react";
import { AddBundleButton } from "./add-bundle-button";
import { formatUsd } from "@/lib/catalog";
import type { PricedBundle } from "@/lib/bundles/pricing";

/** One bundle in the marketplace grid. Every figure comes from the catalog; counts and totals appear only when real. */
export function BundleCard({ b, priority = false }: { b: PricedBundle; priority?: boolean }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white transition-shadow duration-200 hover:shadow-[0_18px_40px_-30px_rgba(15,42,29,0.5)]">
      <Link href={`/bundles/${b.slug}`} aria-label={`View ${b.name}`} className="relative block bg-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
        {b.image
          ? <img src={b.image} alt="" loading={priority ? "eager" : "lazy"} decoding="async" className="aspect-[16/9] w-full object-cover" />
          : <span className="grid aspect-[16/9] place-items-center text-forest-300"><Package className="size-12" aria-hidden /></span>}
        {b.label && <span className="absolute left-3 top-3 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{b.label}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold leading-snug text-forest-900"><Link href={`/bundles/${b.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{b.name}</Link></h3>
        {b.shortDescription && <p className="mt-1.5 text-sm">{b.shortDescription}</p>}
        <p className="mt-3 text-sm font-semibold text-forest-900">{b.components.length} databases{b.totalRecords ? ` · ${b.totalRecords.toLocaleString("en-US")} contacts` : ""}</p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-sand-200 pt-4 text-sm">
          <dt>Bought separately</dt><dd className="text-right text-forest-500 line-through">{formatUsd(b.listCents)}</dd>
          <dt className="font-bold text-forest-900">Bundle price</dt><dd className="display text-right text-3xl leading-none text-forest-900">{formatUsd(b.priceCents)}</dd>
          <dt className="text-forest-700">You save</dt><dd className="text-right font-semibold text-forest-700">{formatUsd(b.savingsCents)} ({b.savingsPercent}%)</dd>
        </dl>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link href={`/bundles/${b.slug}`} className="inline-flex h-11 items-center justify-center rounded-full border border-sand-300 bg-sand-50 px-4 text-sm font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">View Bundle</Link>
          <AddBundleButton slug={b.slug} />
        </div>
      </div>
    </article>
  );
}
