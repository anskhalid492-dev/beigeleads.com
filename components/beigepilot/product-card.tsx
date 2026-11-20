"use client";
import Link from "next/link";
import { useState } from "react";
import { fmtDate, fmtNum } from "@/components/product/meta";
import { cartActions } from "@/lib/cart/client";
import type { Card } from "@/lib/beigepilot/tools";

/** A real product from the catalog. "Get This List" uses the site's normal cart; nothing is bought here. */
export function ChatProductCard({ c }: { c: Card }) {
  const rec = c.packages.find((p) => p.highlighted) ?? c.packages[0];
  const [pkg, setPkg] = useState(rec?.name ?? "");
  const [added, setAdded] = useState<"" | "added" | "updated" | "full">("");
  const place = c.region ? `${c.region}, ${c.country}` : c.country;
  const date = fmtDate(c.lastUpdated);
  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-3.5 text-sm shadow-sm">
      <p className="font-bold leading-snug text-forest-900">{c.name}</p>
      <p className="mt-0.5 text-xs">{place}{c.records ? ` · ${fmtNum(c.records)} contacts` : ""}{c.startingPrice ? ` · From ${c.startingPrice}` : ""}</p>
      <p className="mt-0.5 text-xs">{date ? `Last updated ${date}` : "Last updated date: not recorded"}</p>
      {c.forSale && c.packages.length > 0 ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Package for ${c.name}`}>
          {c.packages.map((p) => (
            <button key={p.name} type="button" role="radio" aria-checked={pkg === p.name} onClick={() => setPkg(p.name)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${pkg === p.name ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-sand-50 text-forest-900 hover:border-forest-900"}`}>
              {p.name} · {p.price}
            </button>
          ))}
        </div>
      ) : <p className="mt-2 rounded-lg bg-sand-100 px-2.5 py-1.5 text-xs">Not currently for sale. You can still view details or request a sample.</p>}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {c.forSale && c.packages.length > 0 && (
          <button type="button" onClick={() => setAdded(cartActions.add(c.slug, pkg))} className="rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">Get This List</button>
        )}
        <Link href={c.url} className="rounded-full border border-forest-900 px-3.5 py-1.5 text-xs font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">View Details</Link>
        <Link href={c.sampleUrl} className="rounded-full border border-sand-300 px-3.5 py-1.5 text-xs font-semibold text-forest-900 hover:border-forest-900">Request a Sample</Link>
      </div>
      {added && <p className="mt-2 text-xs font-semibold text-forest-700" role="status">{added === "full" ? "Your cart is full. " : added === "updated" ? "Package updated in your cart. " : "Added to your cart. "}<Link href="/cart" className="text-purple-700 underline">View cart</Link></p>}
    </div>
  );
}
