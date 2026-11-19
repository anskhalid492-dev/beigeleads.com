import Link from "next/link";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { formatUsd } from "@/lib/catalog";
import type { ShopProduct } from "@/lib/shop";

/** Real catalog data only. Records and "from" price appear only when they are not placeholders. */
export function ProductCard({ p }: { p: ShopProduct }) {
  const buyable = p.status === "live";
  const shown = p.fields.slice(0, 4);
  return (
    <li className="group flex flex-col overflow-hidden rounded-[1.4rem] border border-sand-300 bg-white shadow-[0_1px_0_rgba(15,42,29,.04)] transition duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-[0_14px_32px_-18px_rgba(15,42,29,.45)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* cover: the list as a small database window */}
      <div className="relative bg-forest-900 px-5 pb-5 pt-4 text-sand-50">
        <div className="flex items-center justify-between">
          <DbBadge category={p.categorySlug} tone="dark" size="md" />
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-700/70 px-3 py-1 text-xs font-semibold"><Flag code={p.countryCode} className="h-3 w-[18px]" />{p.countryName}</span>
        </div>
        <div className="mt-4 space-y-1.5" aria-hidden>
          {[78, 62, 70].map((w, i) => (
            <div key={i} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-forest-300" /><span className="h-1.5 rounded-full bg-forest-500/70" style={{ width: `${w}%` }} /><span className="h-1.5 w-6 rounded-full bg-purple-100/40" /></div>
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="display text-[1.6rem] leading-[1.05] text-forest-900">{p.name}</h3>
        <p className="mt-1 text-sm">{p.categoryName} · {p.countryName}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Data fields">
          {shown.map((f) => <li key={f} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">{f}</li>)}
          {p.fields.length > shown.length && <li className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">+{p.fields.length - shown.length} more</li>}
        </ul>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div><dt className="text-xs font-bold text-forest-900">Formats</dt><dd>CSV, Excel or TXT</dd></div>
          <div><dt className="text-xs font-bold text-forest-900">Sample</dt><dd>Masked, free by email</dd></div>
          {p.recordCount ? <div><dt className="text-xs font-bold text-forest-900">Records</dt><dd>{p.recordCount.toLocaleString("en-US")}</dd></div> : null}
          {p.fromCents ? <div><dt className="text-xs font-bold text-forest-900">From</dt><dd className="font-semibold text-forest-900">{formatUsd(p.fromCents)}</dd></div> : null}
        </dl>
        <p className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-forest-900 ${buyable ? "bg-forest-100" : "bg-sand-100"}`}>
          <span className={`size-1.5 rounded-full ${buyable ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{buyable ? "Available to buy" : "Preview only. Not for sale yet"}
        </p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Link href={buyable ? `/product/${p.slug}#pricing` : `/product/${p.slug}`} className="inline-flex h-10 items-center justify-center rounded-full bg-purple-600 px-3 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{buyable ? "Get This List" : "View Details"}</Link>
          <Link href={`/product/${p.slug}#sample`} className="inline-flex h-10 items-center justify-center rounded-full border border-sand-300 px-3 text-sm font-semibold text-forest-900 hover:border-forest-900">Preview Sample</Link>
        </div>
      </div>
    </li>
  );
}
