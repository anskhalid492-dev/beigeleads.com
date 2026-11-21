"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { cartActions } from "@/lib/cart/client";
import { trackCart } from "@/lib/cart/track";
import type { DfySettings } from "@/lib/dfy/settings";

const usd0 = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
const n = (x: number) => x.toLocaleString("en-US");
const rng = (a: number, b: number) => (a === b ? String(a) : `${a}–${b}`);

/** Pricing cards. The ownership box is unchecked by default and applies to whichever package is added. Adding is the customer's click; the server re-prices at checkout. */
export function DfyPricing({ s }: { s: DfySettings }) {
  const router = useRouter();
  const [own, setOwn] = useState(false);
  const add = (pkg: string) => { cartActions.setDfy({ pkg, own: s.ownershipEnabled && own }); trackCart("add_to_cart", 1); router.push("/cart"); };
  return (
    <div>
      <div className="grid gap-5 lg:grid-cols-3">
        {s.packages.map((p) => (
          <article key={p.name} className={`flex flex-col rounded-3xl border p-7 ${p.featured ? "border-purple-600 bg-white shadow-lg" : "border-sand-300 bg-white"}`}>
            <h3 className="text-xl font-bold text-forest-900">{p.name}{p.featured && <span className="ml-2 rounded-full bg-purple-100 px-2.5 py-0.5 align-middle text-xs font-semibold text-purple-700">Most chosen</span>}</h3>
            <p className="mt-3"><span className="display text-5xl text-forest-900">{usd0(p.monthlyCents)}</span><span className="text-forest-500">/month</span></p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Verified leads</dt><dd className="font-semibold text-forest-900">{n(p.leads)}</dd></div>
              <div className="flex justify-between"><dt>Initial sends</dt><dd className="font-semibold text-forest-900">{n(p.initialSends)}</dd></div>
              <div className="flex justify-between"><dt>Follow-ups</dt><dd className="font-semibold text-forest-900">{p.followups}</dd></div>
              <div className="flex justify-between"><dt>Estimated domains</dt><dd className="font-semibold text-forest-900">{rng(p.domainsMin, p.domainsMax)}</dd></div>
              <div className="flex justify-between"><dt>Estimated inboxes</dt><dd className="font-semibold text-forest-900">{rng(p.inboxesMin, p.inboxesMax)}</dd></div>
              <div className="flex justify-between"><dt>Reporting</dt><dd className="font-semibold capitalize text-forest-900">{p.reporting}</dd></div>
            </dl>
            <p className="mt-3 text-xs">Domains and inboxes are <strong>estimates</strong>. Your confirmed allocation is agreed after onboarding.</p>
            <ul className="mt-4 space-y-1.5 text-sm">{p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{f}</li>)}</ul>
            <button type="button" onClick={() => add(p.name)} className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">{p.cta}</button>
          </article>
        ))}
      </div>
      {s.ownershipEnabled && (
        <label className="mx-auto mt-6 flex max-w-3xl cursor-pointer items-start gap-3 rounded-2xl border border-sand-300 bg-white p-5 text-sm">
          <input type="checkbox" className="mt-1 accent-purple-600" checked={own} onChange={(e) => setOwn(e.target.checked)} />
          <span><span className="block font-semibold text-forest-900">{s.ownershipLabel}</span><span className="mt-1 block">{s.ownershipDescription}</span></span>
        </label>
      )}
      <p className="mx-auto mt-4 max-w-3xl text-center text-sm">{s.billingTerms}</p>
    </div>
  );
}
