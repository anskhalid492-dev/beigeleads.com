"use client";
import Link from "next/link";
import { useState } from "react";
import { Rocket, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cartActions } from "@/lib/cart/client";
import type { DfyUpsell, PricedDfy } from "@/lib/cart/model";
import { trackCart } from "@/lib/cart/track";
import { formatUsd } from "@/lib/catalog";

const usd0 = (c: number) => formatUsd(c).replace(/\.00$/, "");
const n = (x: number) => x.toLocaleString("en-US");

/** Optional offer in the cart (only with databases in it, never auto-added). Prices come from the server; the estimates are ranges, not confirmed allocations. */
export function DfyUpsellCard({ offer, className = "" }: { offer: DfyUpsell; className?: string }) {
  const [pkg, setPkg] = useState(offer.packages.find((p) => p.featured)?.name ?? offer.packages[0]?.name ?? "");
  const [own, setOwn] = useState(false); // unchecked by default
  const cur = offer.packages.find((p) => p.name === pkg);
  if (!cur) return null;
  return (
    <section aria-labelledby="dfy-upsell" className={`rounded-2xl border border-sand-200 bg-white p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700"><Rocket className="size-6" aria-hidden /></span>
        <div className="min-w-0">
          <h3 id="dfy-upsell" className="text-lg font-bold text-forest-900">{offer.headline}</h3>
          <p className="mt-1 text-sm">{offer.description}</p>
          <p className="mt-2 text-sm font-semibold text-forest-900">DFY Outbound starts at {usd0(Math.min(...offer.packages.map((p) => p.monthlyCents)))}/month.</p>
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="sr-only">Choose a DFY Outbound package</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {offer.packages.map((p) => (
            <label key={p.name} className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple-600 ${pkg === p.name ? "border-purple-600 bg-purple-100/40" : "border-sand-300"}`}>
              <span className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><input type="radio" name="dfy-pkg" className="accent-purple-600" checked={pkg === p.name} onChange={() => setPkg(p.name)} /><span className="font-semibold text-forest-900">{p.name}</span></span><span className="font-semibold text-forest-900">{usd0(p.monthlyCents)}/mo</span></span>
              <span className="text-xs">{n(p.leads)} leads · {n(p.initialSends)} initial sends · {p.followups} follow-ups</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-xs">Estimated setup: {cur.domains} domains and {cur.inboxes} inboxes. These are estimates; your confirmed allocation is agreed after onboarding.</p>
      {offer.ownershipEnabled && (
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
          <input type="checkbox" className="mt-0.5 accent-purple-600" checked={own} onChange={(e) => setOwn(e.target.checked)} />
          <span><span className="font-semibold text-forest-900">{offer.ownershipLabel}</span></span>
        </label>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        <Button onClick={() => { cartActions.setDfy({ pkg, own: offer.ownershipEnabled && own }); trackCart("add_to_cart", 1); }}>Add DFY to Cart</Button>
        <Link href="/dfy-outbound" className="text-sm font-semibold text-forest-700 underline underline-offset-2">View Full Service</Link>
      </div>
      <p className="mt-3 text-xs">Optional monthly service, paid manually each month. Not added unless you click Add DFY to Cart.</p>
    </section>
  );
}

/** The service as a cart line: change the package, toggle ownership, or remove it. */
export function DfyLine({ dfy, offer, onRemove }: { dfy: PricedDfy; offer: DfyUpsell | null; onRemove: () => void }) {
  return (
    <li className="cart-in rounded-2xl border border-sand-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-100 text-purple-700"><Rocket className="size-5" aria-hidden /></span>
          <div className="min-w-0">
            <p className="font-bold text-forest-900">DFY Outbound — {dfy.name}</p>
            <p className="text-sm">{n(dfy.leads)} leads · {n(dfy.initialSends)} initial sends · {dfy.followups} follow-ups · est. {dfy.domains} domains, {dfy.inboxes} inboxes</p>
          </div>
        </div>
        <p className="shrink-0 text-right font-bold text-forest-900">{formatUsd(dfy.monthlyCents)}<span className="block text-xs font-normal">per month</span></p>
      </div>
      {dfy.ownership && <p className="mt-2 flex justify-between text-sm"><span>Infrastructure ownership (one-time)</span><span className="font-semibold text-forest-900">{formatUsd(dfy.ownershipCents)}</span></p>}
      {!dfy.purchasable && dfy.reason && <p role="status" className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-sm">{dfy.reason}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        {offer && offer.packages.length > 1 ? (
          <label className="flex items-center gap-2 text-sm"><span className="font-semibold text-forest-900">Package</span>
            <select value={dfy.name} onChange={(e) => cartActions.setDfy({ pkg: e.target.value, own: dfy.ownership })} className="rounded-lg border border-sand-300 bg-white px-2 py-1.5 text-sm">
              {offer.packages.map((p) => <option key={p.name} value={p.name}>{p.name} · {usd0(p.monthlyCents)}/mo</option>)}
            </select></label>
        ) : <span />}
        <div className="flex items-center gap-4">
          {offer?.ownershipEnabled && <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-purple-600" checked={dfy.ownership} onChange={(e) => cartActions.setDfy({ pkg: dfy.name, own: e.target.checked })} /> Own my infrastructure</label>}
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 underline underline-offset-2"><Trash2 className="size-4" aria-hidden /> Remove</button>
        </div>
      </div>
      <p className="mt-3 text-xs">Monthly service paid in advance in crypto. Your first payment today covers month one{dfy.ownership ? " plus the one-time ownership fee" : ""}; later months are invoiced about a week before they are due. Not included in database discounts.</p>
    </li>
  );
}
