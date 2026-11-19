import Link from "next/link";
import { DbBadge, Flag } from "@/components/shared/db-icon";
import { formatUsd } from "@/lib/catalog";
import type { ShopProduct } from "@/lib/shop";

/** One list as a card (grid) or a row (list view). Real catalog data only: records and price appear only when they are not placeholders. */
export function ListCard({ p, view = "grid" }: { p: ShopProduct; view?: "grid" | "list" }) {
  const buyable = p.status === "live";
  const row = view === "list";
  const fields = p.fields.slice(0, row ? 7 : 4);
  const cta = buyable ? { href: `/product/${p.slug}#pricing`, label: "Get This List" } : { href: `/product/${p.slug}`, label: "View Details" };
  return (
    <li className={`group rounded-[1.4rem] border border-sand-300 bg-white p-5 transition duration-200 hover:border-forest-500 hover:shadow-[0_14px_30px_-20px_rgba(15,42,29,.5)] motion-reduce:transition-none ${row ? "flex flex-col gap-5 md:flex-row md:items-center" : "flex flex-col"}`}>
      <div className={`flex items-start gap-4 ${row ? "md:w-[22rem] md:shrink-0" : ""}`}>
        <DbBadge category={p.categorySlug} country={p.countryCode} size="lg" />
        <div className="min-w-0">
          <h3 className="display text-[1.55rem] leading-[1.05] text-forest-900">{p.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm"><Flag code={p.countryCode} className="h-3 w-[18px]" />{p.categoryName} · {p.countryName}</p>
        </div>
      </div>
      <div className={row ? "md:flex-1" : "mt-4"}>
        <ul className="flex flex-wrap gap-1.5" aria-label="Data fields">
          {fields.map((f) => <li key={f} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">{f}</li>)}
          {p.fields.length > fields.length && <li className="rounded-full bg-sand-100 px-2.5 py-1 text-xs font-medium text-forest-900">+{p.fields.length - fields.length} more</li>}
        </ul>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-forest-900"><span className={`size-2 rounded-full ${buyable ? "bg-forest-500" : "bg-sand-300"}`} aria-hidden />{buyable ? "Available to buy" : "Preview only. Not for sale yet"}</span>
          <span>Masked sample on every list page</span>
          {p.recordCount ? <span>{p.recordCount.toLocaleString("en-US")} records</span> : null}
          {p.fromCents ? <span className="font-semibold text-forest-900">From {formatUsd(p.fromCents)}</span> : null}
        </p>
      </div>
      <div className={`grid grid-cols-2 gap-2 ${row ? "md:w-[19rem] md:shrink-0" : "mt-5"}`}>
        <Link href={cta.href} className="inline-flex h-10 items-center justify-center rounded-full bg-purple-600 px-3 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{cta.label}</Link>
        <Link href={`/product/${p.slug}#sample`} className="inline-flex h-10 items-center justify-center rounded-full border border-sand-300 px-3 text-sm font-semibold text-forest-900 hover:border-forest-900">Preview Sample</Link>
      </div>
    </li>
  );
}
