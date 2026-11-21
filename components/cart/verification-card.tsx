"use client";
import Link from "next/link";
import { useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartActions } from "@/lib/cart/client";
import type { PricedVerification, VerificationUpsell } from "@/lib/cart/model";
import { trackCart } from "@/lib/cart/track";
import { formatUsd } from "@/lib/catalog";

/** 10000 -> "10K", 1000000 -> "1M" */
export const shortCount = (n: number) => (n >= 1_000_000 && n % 1_000_000 === 0 ? `${n / 1_000_000}M` : n >= 1000 && n % 1000 === 0 ? `${n / 1000}K` : n.toLocaleString("en-US"));
const usd0 = (c: number) => formatUsd(c).replace(/\.00$/, "");

/** Optional offer, shown in the cart only when it holds a database and no verification yet. Never a popup; adding is the customer's click. */
export function VerificationUpsellCard({ upsell, className = "" }: { upsell: VerificationUpsell; className?: string }) {
  const [pkg, setPkg] = useState(upsell.packages[0]?.name ?? "");
  const lowest = upsell.packages[0];
  if (!lowest) return null;
  return (
    <section aria-labelledby="ev-upsell" className={`rounded-2xl border border-sand-200 bg-white p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700"><ShieldCheck className="size-6" aria-hidden /></span>
        <div className="min-w-0">
          <h3 id="ev-upsell" className="text-lg font-bold text-forest-900">{upsell.headline}</h3>
          <p className="mt-1 text-sm">{upsell.description}</p>
          <p className="mt-2 text-sm font-semibold text-forest-900">Starting at just {usd0(lowest.priceCents)} for up to {lowest.limit.toLocaleString("en-US")} emails.</p>
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="sr-only">Choose a verification package</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {upsell.packages.map((p) => (
            <label key={p.name} className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple-600 ${pkg === p.name ? "border-forest-900 bg-forest-100" : "border-sand-200 hover:border-sand-300"}`}>
              <span className="flex items-center gap-2"><input type="radio" name="ev-pkg" className="accent-purple-600" checked={pkg === p.name} onChange={() => setPkg(p.name)} /><span className="font-semibold text-forest-900">{shortCount(p.limit)}</span></span>
              <span>{usd0(p.priceCents)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Button onClick={() => { cartActions.setVerification(pkg); trackCart("add_to_cart", 1); }}>Add Verification to Cart</Button>
        <Link href="/email-verification" className="text-sm font-semibold text-forest-700 underline underline-offset-2">Learn More</Link>
      </div>
      <p className="mt-3 text-xs">Optional service. No subscription.</p>
    </section>
  );
}

/** The service as a cart line: change the package or remove it. */
export function VerificationLine({ service, packages, onRemove }: { service: PricedVerification; packages: VerificationUpsell["packages"]; onRemove: () => void }) {
  return (
    <li className="cart-in rounded-2xl border border-sand-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest-100 text-forest-700"><ShieldCheck className="size-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="font-bold text-forest-900">Email List Verification</p>
            <p className="text-sm">{service.name} package · up to {service.limit.toLocaleString("en-US")} emails · one-time service</p>
          </div>
        </div>
        <p className="shrink-0 font-bold text-forest-900">{formatUsd(service.priceCents)}</p>
      </div>
      {!service.purchasable && service.reason && <p role="status" className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-sm">{service.reason}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {packages.length > 1 ? (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-forest-900">Package</span>
            <select value={service.name} onChange={(e) => cartActions.setVerification(e.target.value)} className="rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm">
              {packages.map((p) => <option key={p.name} value={p.name}>{p.name} · {shortCount(p.limit)} · {usd0(p.priceCents)}</option>)}
            </select>
          </label>
        ) : <span />}
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline underline-offset-2"><Trash2 className="size-4" aria-hidden /> Remove</button>
      </div>
      <p className="mt-3 text-xs">You submit your list after payment. Verification is done by our team and is not instant. Not included in database discounts.</p>
    </li>
  );
}
