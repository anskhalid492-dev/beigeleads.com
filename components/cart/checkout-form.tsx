"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiForm } from "@/components/forms/api-form";
import { Button } from "@/components/ui/button";
import { cartActions, useCart, useCartBundles, useCartDfy, useCartVerification, useMounted } from "@/lib/cart/client";
import type { CartPricing, VerificationUpsell } from "@/lib/cart/model";
import { VerificationUpsellCard } from "@/components/cart/verification-card";
import { readPartner, writePartner } from "@/lib/cart/partner";
import { CryptoGuide } from "@/components/checkout/crypto-guide";
import { TeamRequest } from "@/components/cart/team-request";
import { formatUsd } from "@/lib/catalog";

type Option = { value: string; label: string };
type Applied = { code: string; email: string };

/** Checkout for the whole cart. The browser sends product + package only; the server prices everything again and creates one order. */
export function CartCheckout({ options }: { options: Option[] }) {
  const cart = useCart();
  const bundleCart = useCartBundles();
  const verif = useCartVerification();
  const dfyCart = useCartDfy();
  const empty = cart.length === 0 && bundleCart.length === 0 && !verif && !dfyCart;
  const mounted = useMounted();
  const [result, setResult] = useState<{ key: string; pricing: CartPricing | null; upsell: VerificationUpsell | null; error: boolean; discountError: string } | null>(null);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [draft, setDraft] = useState({ code: "", email: "" });
  const [codeMsg, setCodeMsg] = useState("");
  const [last, setLast] = useState<CartPricing | null>(null);
  const [lastUpsell, setLastUpsell] = useState<VerificationUpsell | null>(null);
  const key = JSON.stringify([cart, bundleCart, verif, dfyCart, applied]);

  // A code applied in the cart carries over (same tab). The server checks it again.
  useEffect(() => {
    const saved = readPartner();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of sessionStorage after mount
    if (saved) { setApplied(saved); setDraft(saved); }
    // A BeigePilot offer applied from the chat while this page is open.
    const on = () => { const p = readPartner(); if (p) { setApplied(p); setDraft(p); } };
    window.addEventListener("bl:partner-changed", on);
    return () => window.removeEventListener("bl:partner-changed", on);
  }, []);

  useEffect(() => {
    if (!mounted || empty) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart, bundles: bundleCart, ...(verif ? { verification: verif } : {}), ...(dfyCart ? { dfy: { pkg: dfyCart.pkg, ownership: dfyCart.own } } : {}), ...(applied ? { code: applied.code, email: applied.email } : {}) }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean; pricing: CartPricing; upsell?: VerificationUpsell | null; discountError?: string }>) : Promise.reject(new Error(r.status === 429 ? "limit" : "price"))))
      .then((j) => {
        setResult({ key, pricing: j.pricing, upsell: j.upsell ?? null, error: false, discountError: j.discountError ?? "" });
        setLast(j.pricing); setLastUpsell(j.upsell ?? null);
        if (verif && !j.pricing.service) cartActions.setVerification(null);
        if (dfyCart && !j.pricing.dfy) cartActions.setDfy(null);
        if (applied) { if (j.discountError) { setCodeMsg(j.discountError); setApplied(null); writePartner(null); } else { setCodeMsg(j.pricing.applied.some((a) => a.source !== "automatic") ? "Code applied." : ""); writePartner(applied); } }
      })
      .catch((e: Error) => { if (e.name !== "AbortError") setResult({ key, pricing: null, upsell: null, error: true, discountError: "" }); if (e.message === "limit") { setCodeMsg("Too many code attempts. Try again in an hour."); setApplied(null); } });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);
  const current = result?.key === key ? result : null;
  const pricing = current?.pricing ?? last;
  const error = current?.error ? "We could not load your cart. Check your connection and try again." : "";

  if (!mounted) return <p role="status" className="text-sm">Loading your cart…</p>;
  if (empty) {
    return <div className="rounded-2xl border border-sand-200 bg-white p-6"><p className="font-semibold text-forest-900">Your cart is empty.</p><Button asChild className="mt-4"><Link href="/lists">Explore Lists</Link></Button></div>;
  }
  if (error) return <p role="alert" className="rounded-xl border border-sand-300 bg-white p-4 text-sm">{error}</p>;
  if (!pricing) return <p role="status" className="text-sm">Loading your cart…</p>;
  if (!pricing.canCheckout) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6">
        <p className="font-semibold text-forest-900">{pricing.checkoutOpen ? "Part of your cart cannot be bought yet." : "Checkout opens soon."}</p>
        <p className="mt-1 text-sm">{pricing.bundles.find((b) => !b.purchasable)?.reason ?? (pricing.service && !pricing.service.purchasable ? pricing.service.reason : undefined) ?? pricing.lines.find((l) => !l.purchasable)?.reason ?? "Your lists are saved in this browser."}</p>
        <Button asChild variant="secondary" className="mt-4"><Link href="/cart">Back to your cart</Link></Button>
      </div>
    );
  }
  const savings = pricing.applied.reduce((n, a) => n + a.cents, 0) + pricing.bundleSavingsCents;
  const upsellShown = !pricing.service && pricing.lines.length + pricing.bundles.length > 0;
  const hasCode = pricing.applied.some((a) => a.source !== "automatic");
  return (
    <div className="grid gap-8 lg:grid-cols-[58fr_42fr] lg:items-start lg:gap-10">
      <div className="order-2 space-y-6 lg:order-1">
        {upsellShown && lastUpsell && <VerificationUpsellCard upsell={lastUpsell} />}
        <ApiForm
          key={applied?.code ?? "none"}
          endpoint="/api/checkout"
          submitLabel="Continue to Payment"
          successTitle="Creating your order"
          successText="Taking you to the payment page."
          defaults={applied ? { email: applied.email } : {}}
          hidden={{ items: pricing.lines.map((l) => ({ product: l.slug, package: l.packageName })), bundles: pricing.bundles.map((b) => b.slug), ...(pricing.service ? { verification: pricing.service.name } : {}), ...(pricing.dfy ? { dfy: { pkg: pricing.dfy.name, ownership: pricing.dfy.ownership } } : {}), ...(applied && hasCode ? { discountCode: applied.code } : {}) }}
          fields={[]}
          render={({ id, turnstile, error: formError, submit, honeypot }) => (
            <>
              {honeypot}
              <section aria-labelledby="co-delivery" className={card}>
                <h2 id="co-delivery" className="text-xl font-bold text-forest-900">1. Delivery Details</h2>
                <label htmlFor={id("email")} className="mt-5 block text-sm font-semibold text-forest-900">Email address</label>
                <input id={id("email")} name="email" type="email" required autoComplete="email" defaultValue={applied?.email ?? ""} aria-describedby={id("email-help")} className={`${box} mt-1.5`} />
                <p id={id("email-help")} className="mt-2 text-sm">{pricing.lines.length + pricing.bundles.length > 0 ? "We\u2019ll send your database download links to this email after payment confirmation." : "We\u2019ll send your confirmation and your secure list-submission link to this email."}{pricing.service && pricing.lines.length + pricing.bundles.length > 0 ? " Your verification submission link is emailed too." : ""}</p>
              </section>
              <section aria-labelledby="co-pay" className={card}>
                <h2 id="co-pay" className="text-xl font-bold text-forest-900">2. Payment Method</h2>
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold text-forest-900">Pay with</legend>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                    {options.map((o) => (
                      <label key={o.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-sand-300 bg-white px-4 py-3 text-sm font-semibold text-forest-900 transition-colors hover:border-forest-900 has-[:checked]:border-forest-900 has-[:checked]:bg-forest-100 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-purple-600">
                        <input type="radio" name="coin" value={o.value} required className="size-4 accent-forest-900" />{o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <CryptoGuide className="mt-5" />
                <div className="mt-5">{turnstile}</div>
                <div className="mt-4">{formError}</div>
                <div className="mt-5">{submit("Continue to Payment")}</div>
                <p className="mt-3 text-center text-xs">You&rsquo;ll see the exact amount and the address on the next page. Nothing is paid until you send it.</p>
              </section>
            </>
          )}
        />
        <section aria-labelledby="co-team" className={card}>
          <h2 id="co-team" className="text-xl font-bold text-forest-900">Purchasing for Your Team?</h2>
          <p className="mt-2 text-sm">Need your manager to approve this purchase? Send them your selected databases for review and secure payment.</p>
          {pricing.bundles.length === 0 && !pricing.service && !pricing.dfy
            ? <TeamRequest items={pricing.lines.map((l) => ({ product: l.slug, package: l.packageName }))} className="mt-4" />
            : <p className="mt-3 text-sm">Manager approval requests are not available for carts that contain a {pricing.dfy ? "DFY service" : pricing.service ? "verification service" : "bundle"}.</p>}
        </section>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          {["Payment is checked on the network", "Download links are emailed after confirmed payment", "No customer account required"].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{t}</li>)}
        </ul>
      </div>
      <aside aria-label="Order summary" className="order-1 lg:sticky lg:top-24 lg:order-2">
        <div className={card}>
          <h2 className="text-xl font-bold text-forest-900">Your Order</h2>
          <ul className="mt-4 divide-y divide-sand-200">
            {pricing.bundles.map((b) => (
              <li key={`b-${b.slug}`} className="py-3 text-sm">
                <div className="flex justify-between gap-4"><span className="font-semibold text-forest-900">{b.name} <span className="font-normal text-forest-500">· bundle</span></span><span className="font-semibold text-forest-900">{formatUsd(b.priceCents)}</span></div>
                <ul className="mt-1 space-y-0.5 pl-4 text-forest-500">{b.components.map((c) => <li key={c.slug} className="list-disc">{c.name} · {c.packageName}</li>)}</ul>
              </li>
            ))}
            {pricing.lines.map((l) => (
              <li key={l.slug} className="flex justify-between gap-4 py-3 text-sm">
                <span><span className="block font-semibold text-forest-900">{l.name}</span><span className="text-forest-500">{l.packageName}{l.records > 0 ? ` · ${l.records.toLocaleString("en-US")} contacts` : ""}</span></span>
                <span className="font-semibold text-forest-900">{formatUsd(l.priceCents)}</span>
              </li>
            ))}
            {pricing.dfy && (
              <li className="flex justify-between gap-4 py-3 text-sm">
                <span><span className="block font-semibold text-forest-900">DFY Outbound — {pricing.dfy.name}</span><span className="text-forest-500">One-time payment, no renewals</span></span>
                <span className="font-semibold text-forest-900">{formatUsd(pricing.dfy.monthlyCents)}</span>
              </li>
            )}
            {pricing.dfy?.ownership && (
              <li className="flex justify-between gap-4 py-3 text-sm">
                <span><span className="block font-semibold text-forest-900">Infrastructure ownership</span><span className="text-forest-500">One-time fee</span></span>
                <span className="font-semibold text-forest-900">{formatUsd(pricing.dfy.ownershipCents)}</span>
              </li>
            )}
            {pricing.service && (
              <li className="flex justify-between gap-4 py-3 text-sm">
                <span><span className="block font-semibold text-forest-900">Email List Verification</span><span className="text-forest-500">{pricing.service.name} · up to {pricing.service.limit.toLocaleString("en-US")} emails</span></span>
                <span className="font-semibold text-forest-900">{formatUsd(pricing.service.priceCents)}</span>
              </li>
            )}
          </ul>
          <dl className="space-y-1.5 border-t border-sand-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatUsd(pricing.subtotalCents + (pricing.service?.priceCents ?? 0) + (pricing.dfy?.priceCents ?? 0))}</dd></div>
            {pricing.bundleSavingsCents > 0 && <div className="flex justify-between gap-3"><dt>Bundle savings · in the bundle price</dt><dd className="font-semibold text-forest-500">&minus;{formatUsd(pricing.bundleSavingsCents)}</dd></div>}
            {pricing.applied.map((a) => <div key={`${a.source}-${a.code}-${a.title}`} className="flex justify-between gap-3"><dt>{a.title}{a.kind === "percent" && a.percent > 0 ? ` (${a.percent}%)` : ""}{a.source === "automatic" ? " · applied automatically" : a.code ? ` · ${a.code}` : ""}</dt><dd className="font-semibold text-forest-500">&minus;{formatUsd(a.cents)}</dd></div>)}
          </dl>
          <PartnerCode applied={applied} draft={draft} setDraft={setDraft} msg={codeMsg} onApply={() => { setCodeMsg(""); setApplied({ code: draft.code.trim(), email: /^PARTNER-/i.test(draft.code.trim()) ? draft.email.trim().toLowerCase() : "" }); }} onRemove={() => { setApplied(null); setCodeMsg(""); writePartner(null); }} />
          <p className="mt-4 flex items-end justify-between border-t border-sand-200 pt-4"><span className="font-bold text-forest-900">Total</span><span className="display text-5xl leading-none text-forest-900">{formatUsd(pricing.totalCents)}</span></p>
          {savings > 0 && <p className="mt-3 rounded-xl bg-forest-100 px-3 py-2 text-sm font-semibold text-forest-900">You&rsquo;re saving {formatUsd(savings)} on this order.</p>}
          <p className="mt-3 text-xs"><Link href="/cart" className="underline">Change your cart</Link></p>
        </div>
      </aside>
    </div>
  );
}

const card = "rounded-2xl border border-sand-200 bg-white p-5 sm:p-6";
const box = "h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Optional. Compact promo code: code + Apply. Partner codes also need the email they were approved with. The server validates every code. */
function PartnerCode({ applied, draft, setDraft, msg, onApply, onRemove }: { applied: Applied | null; draft: { code: string; email: string }; setDraft: (d: { code: string; email: string }) => void; msg: string; onApply: () => void; onRemove: () => void }) {
  const partner = /^PARTNER-/i.test(draft.code.trim());
  const ready = draft.code.trim().length > 0 && (!partner || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim()));
  return (
    <div className="mt-4 border-t border-sand-200 pt-4">
      {applied ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p role="status"><strong className="font-mono text-forest-900">{applied.code.toUpperCase()}</strong> applied{applied.email ? ` for ${applied.email}` : ""}. {msg}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRemove}>Remove</Button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (ready) onApply(); }} noValidate>
          <label htmlFor="promo-code" className="text-sm font-semibold text-forest-900">Promo code</label>
          <div className="mt-1.5 flex gap-2">
            <input id="promo-code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} autoComplete="off" spellCheck={false} placeholder="Enter code" aria-describedby={msg ? "promo-msg" : undefined} className={`${box} font-mono`} />
            <Button type="submit" size="sm" className="h-11 shrink-0" disabled={!ready}>Apply</Button>
          </div>
          {partner && <label className="mt-2 block text-sm font-semibold text-forest-900">Email you applied with<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="email" className={`${box} mt-1`} /></label>}
          {msg && <p id="promo-msg" role="alert" className="mt-2 rounded-xl bg-sand-100 px-3 py-2 text-sm font-medium text-forest-900">{msg}</p>}
        </form>
      )}
    </div>
  );
}
