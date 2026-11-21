"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiForm } from "@/components/forms/api-form";
import { Button } from "@/components/ui/button";
import { useCart, useMounted } from "@/lib/cart/client";
import type { CartPricing } from "@/lib/cart/model";
import { readPartner, writePartner } from "@/lib/cart/partner";
import { TeamRequest } from "@/components/cart/team-request";
import { formatUsd } from "@/lib/catalog";

type Option = { value: string; label: string };
type Applied = { code: string; email: string };

/** Checkout for the whole cart. The browser sends product + package only; the server prices everything again and creates one order. */
export function CartCheckout({ options }: { options: Option[] }) {
  const cart = useCart();
  const mounted = useMounted();
  const [result, setResult] = useState<{ key: string; pricing: CartPricing | null; error: boolean; discountError: string } | null>(null);
  const [applied, setApplied] = useState<Applied | null>(null);
  const [draft, setDraft] = useState({ code: "", email: "" });
  const [codeMsg, setCodeMsg] = useState("");
  const [last, setLast] = useState<CartPricing | null>(null);
  const key = JSON.stringify([cart, applied]);

  // A code applied in the cart carries over (same tab). The server checks it again.
  useEffect(() => {
    const saved = readPartner();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of sessionStorage after mount
    if (saved) { setApplied(saved); setDraft(saved); }
  }, []);

  useEffect(() => {
    if (!mounted || cart.length === 0) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart, ...(applied ? { code: applied.code, email: applied.email } : {}) }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean; pricing: CartPricing; discountError?: string }>) : Promise.reject(new Error(r.status === 429 ? "limit" : "price"))))
      .then((j) => {
        setResult({ key, pricing: j.pricing, error: false, discountError: j.discountError ?? "" });
        setLast(j.pricing);
        if (applied) { if (j.discountError) { setCodeMsg(j.discountError); setApplied(null); writePartner(null); } else { setCodeMsg(j.pricing.applied.some((a) => a.source !== "automatic") ? "Code applied." : ""); writePartner(applied); } }
      })
      .catch((e: Error) => { if (e.name !== "AbortError") setResult({ key, pricing: null, error: true, discountError: "" }); if (e.message === "limit") { setCodeMsg("Too many code attempts. Try again in an hour."); setApplied(null); } });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);
  const current = result?.key === key ? result : null;
  const pricing = current?.pricing ?? last;
  const error = current?.error ? "We could not load your cart. Check your connection and try again." : "";

  if (!mounted) return <p role="status" className="text-sm">Loading your cart…</p>;
  if (cart.length === 0) {
    return <div className="rounded-2xl border border-sand-200 bg-white p-6"><p className="font-semibold text-forest-900">Your cart is empty.</p><Button asChild className="mt-4"><Link href="/lists">Explore Lists</Link></Button></div>;
  }
  if (error) return <p role="alert" className="rounded-xl border border-sand-300 bg-white p-4 text-sm">{error}</p>;
  if (!pricing) return <p role="status" className="text-sm">Loading your cart…</p>;
  if (!pricing.canCheckout) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-6">
        <p className="font-semibold text-forest-900">{pricing.checkoutOpen ? "Part of your cart cannot be bought yet." : "Checkout opens soon."}</p>
        <p className="mt-1 text-sm">{pricing.lines.find((l) => !l.purchasable)?.reason ?? "Your lists are saved in this browser."}</p>
        <Button asChild variant="secondary" className="mt-4"><Link href="/cart">Back to your cart</Link></Button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <section aria-label="Order summary" className="rounded-2xl border border-sand-200 bg-white p-5">
        <ul className="space-y-2 text-sm">
          {pricing.lines.map((l) => <li key={l.slug} className="flex justify-between gap-3"><span>{l.name} <span className="text-forest-500">· {l.packageName}{l.records > 0 ? `, ${l.records.toLocaleString("en-US")} records` : ""}</span></span><span className="font-semibold text-forest-900">{formatUsd(l.payCents)}</span></li>)}
        </ul>
        {pricing.applied.length > 0 && (
          <dl className="mt-4 space-y-1 border-t border-sand-200 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatUsd(pricing.subtotalCents)}</dd></div>
            {pricing.applied.map((a) => <div key={`${a.source}-${a.code}-${a.title}`} className="flex justify-between gap-3"><dt>{a.title}{a.kind === "percent" && a.percent > 0 ? ` (${a.percent}%)` : ""}{a.source === "automatic" ? " · applied automatically" : a.code ? ` · ${a.code}` : ""}</dt><dd className="font-semibold text-forest-900">&minus;{formatUsd(a.cents)}</dd></div>)}
          </dl>
        )}
        <p className="mt-4 flex items-end justify-between border-t border-sand-200 pt-4"><span className="font-bold text-forest-900">Total</span><span className="display text-4xl leading-none text-forest-900">{formatUsd(pricing.totalCents)}</span></p>
        <p className="mt-2 text-xs"><Link href="/cart" className="underline">Change your cart</Link></p>
      </section>
      <PartnerCode applied={applied} draft={draft} setDraft={setDraft} msg={codeMsg} onApply={() => { setCodeMsg(""); setApplied({ code: draft.code.trim(), email: /^PARTNER-/i.test(draft.code.trim()) ? draft.email.trim().toLowerCase() : "" }); }} onRemove={() => { setApplied(null); setCodeMsg(""); writePartner(null); }} />
      <ApiForm
        key={applied?.code ?? "none"}
        endpoint="/api/checkout"
        submitLabel="Continue to payment"
        successTitle="Creating your order"
        successText="Taking you to the payment page."
        defaults={applied ? { email: applied.email } : {}}
        hidden={{ items: pricing.lines.map((l) => ({ product: l.slug, package: l.packageName })), ...(applied && pricing.applied.some((a) => a.source !== "automatic") ? { discountCode: applied.code } : {}) }}
        fields={[
          { name: "email", label: "Email for your download links", type: "email", required: true },
          { name: "coin", label: "Pay with", type: "select", required: true, options: options },
        ]}
      />
      <TeamRequest items={pricing.lines.map((l) => ({ product: l.slug, package: l.packageName }))} />
      <p className="text-sm">One payment for the whole order. After the network confirms it, we email your download link for each list. No account needed.</p>
    </div>
  );
}

const box = "h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Optional. Only approved data reseller partners have a code; it works only with the email they applied with. */
function PartnerCode({ applied, draft, setDraft, msg, onApply, onRemove }: { applied: Applied | null; draft: { code: string; email: string }; setDraft: (d: { code: string; email: string }) => void; msg: string; onApply: () => void; onRemove: () => void }) {
  const partner = /^PARTNER-/i.test(draft.code.trim());
  const ready = draft.code.trim().length > 0 && (!partner || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email.trim()));
  return (
    <details open={!!applied || !!msg} className="rounded-2xl border border-sand-200 bg-white p-5">
      <summary className="cursor-pointer text-sm font-bold text-forest-900">Have a promo code?</summary>
      {applied ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p role="status"><strong className="font-mono text-forest-900">{applied.code.toUpperCase()}</strong> applied{applied.email ? ` for ${applied.email}` : ""}. {msg}</p>
          <Button type="button" size="sm" variant="secondary" onClick={onRemove}>Remove code</Button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-forest-900">Promo code<input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} autoComplete="off" spellCheck={false} placeholder="Enter code" className={`${box} mt-1 font-mono`} /></label>
            {partner && <label className="text-sm font-semibold text-forest-900">Email you applied with<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="email" className={`${box} mt-1`} /></label>}
          </div>
          <Button type="button" size="sm" className="mt-3" disabled={!ready} onClick={onApply}>Apply code</Button>
          {msg && <p role="alert" className="mt-3 rounded-xl bg-sand-100 px-4 py-2.5 text-sm font-medium text-forest-900">{msg}</p>}
          <p className="mt-3 text-xs">Personal partner codes work only with the email address of the approved partner. <Link href="/partners" className="underline">Learn about the partner program</Link></p>
        </div>
      )}
    </details>
  );
}
