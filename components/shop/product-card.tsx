import Link from "next/link";
import { DbBadge } from "@/components/shared/db-icon";
import { formatUsd, getCategory, getCountry, startingPriceCents, type Product } from "@/lib/catalog";

/** Real catalog data only. Counts and prices appear only when they are not placeholders. */
export function ProductCard({ p }: { p: Product }) {
  const c = getCategory(p.categorySlug);
  const k = getCountry(p.countrySlug);
  const real = !p.placeholderData;
  const from = startingPriceCents(p);
  return (
    <li className="flex flex-col rounded-2xl border border-sand-300 bg-white p-5">
      <div className="flex items-center gap-3">
        <DbBadge category={p.categorySlug} country={k?.code} />
        <div className="min-w-0"><h3 className="display text-2xl leading-tight text-forest-900">{p.name}</h3><p className="text-sm">{c?.name} · {k?.name}</p></div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="font-bold text-forest-900">Fields</dt><dd>{p.fields.length}</dd></div>
        <div><dt className="font-bold text-forest-900">Formats</dt><dd>CSV, Excel or TXT</dd></div>
        {real && p.recordCount ? <div><dt className="font-bold text-forest-900">Records</dt><dd>{p.recordCount.toLocaleString("en-US")}</dd></div> : null}
        {real && from ? <div><dt className="font-bold text-forest-900">From</dt><dd>{formatUsd(from)}</dd></div> : null}
      </dl>
      <p className="mt-3 text-sm">{p.status === "draft" ? "Placeholder list. Not for sale yet." : "Masked sample available."}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={`/product/${p.slug}`} className="inline-flex h-10 items-center rounded-full bg-forest-900 px-5 text-sm font-semibold text-sand-50 hover:bg-forest-700">View list</Link>
        <Link href={`/sample?product=${p.slug}`} className="inline-flex h-10 items-center rounded-full border border-sand-300 px-5 text-sm font-semibold text-forest-900 hover:border-forest-900">Free sample</Link>
      </div>
    </li>
  );
}
