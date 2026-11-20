"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, FileText, ShoppingBag } from "lucide-react";
import { DbBadge } from "@/components/shared/db-icon";
import { fmtDate, fmtNum } from "@/components/product/meta";
import { cartActions } from "@/lib/cart/client";
import type { Card } from "@/lib/beigepilot/tools";

/** A real product from the catalog. "Get This List" uses the site's normal cart; nothing is bought here. */
export function ChatProductCard({ c, onAdded, onPick }: { c: Card; onAdded?: () => void; onPick?: () => void }) {
  const rec = c.packages.find((p) => p.highlighted) ?? c.packages[0];
  const [pkg, setPkg] = useState(rec?.name ?? "");
  const [added, setAdded] = useState<"" | "added" | "updated" | "full">("");
  const place = c.region ? `${c.region}, ${c.country}` : c.country;
  const date = fmtDate(c.lastUpdated);
  const sellable = c.forSale && c.packages.length > 0;
  return (
    <article onMouseEnter={onPick} onFocus={onPick} className="rounded-2xl border border-sand-300 bg-white p-3 text-sm shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-2.5">
        <DbBadge category={c.category} country={c.countryCode} hint={c.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug text-forest-900">{c.name}</h3>
          <p className="mt-0.5 text-xs">{place}{c.records ? ` · ${fmtNum(c.records)} contacts` : ""}</p>
          <p className="text-xs">{date ? `Last updated ${date}` : "Last updated date not recorded"}{c.startingPrice ? ` · From ${c.startingPrice}` : ""}</p>
        </div>
      </div>
      {sellable ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Package for ${c.name}`}>
          {c.packages.map((p) => (
            <button key={p.name} type="button" role="radio" aria-checked={pkg === p.name} onClick={() => { setPkg(p.name); onPick?.(); }}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${pkg === p.name ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-sand-50 text-forest-900 hover:border-forest-900"}`}>
              {p.name} · {p.price}
            </button>
          ))}
        </div>
      ) : <p className="mt-2 rounded-lg bg-sand-100 px-2.5 py-1.5 text-xs">Not currently for sale. You can still view details or request a sample.</p>}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {sellable && <button type="button" onClick={() => { const r = cartActions.add(c.slug, pkg); setAdded(r); if (r !== "full") onAdded?.(); }} className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"><ShoppingBag className="size-3.5" aria-hidden />Get This List</button>}
        <Link href={c.url} className="rounded-full border border-forest-900 px-3.5 py-1.5 text-xs font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">View Details</Link>
        <Link href={c.sampleUrl} className="inline-flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-purple-700 underline underline-offset-2"><FileText className="size-3.5" aria-hidden />Free sample</Link>
      </div>
      {added && <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-forest-700" role="status"><Check className="size-3.5" aria-hidden />{added === "full" ? "Your cart is full. " : added === "updated" ? "Package updated in your cart. " : "Added to your cart. "}<Link href="/cart" className="text-purple-700 underline">View cart</Link></p>}
    </article>
  );
}
