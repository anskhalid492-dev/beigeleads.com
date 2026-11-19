"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiForm } from "@/components/forms/api-form";
import { Button } from "@/components/ui/button";
import { useCart, useMounted } from "@/lib/cart/client";
import type { CartPricing } from "@/lib/cart/model";
import { formatUsd } from "@/lib/catalog";

type Option = { value: string; label: string };

/** Checkout for the whole cart. The browser sends product + package only; the server prices everything again and creates one order. */
export function CartCheckout({ options }: { options: Option[] }) {
  const cart = useCart();
  const mounted = useMounted();
  const key = JSON.stringify(cart);
  const [result, setResult] = useState<{ key: string; pricing: CartPricing | null; error: boolean } | null>(null);

  useEffect(() => {
    if (!mounted || cart.length === 0) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean; pricing: CartPricing }>) : Promise.reject(new Error("price"))))
      .then((j) => setResult({ key, pricing: j.pricing, error: false }))
      .catch((e: Error) => { if (e.name !== "AbortError") setResult({ key, pricing: null, error: true }); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);
  const current = result?.key === key ? result : null;
  const pricing = current?.pricing ?? null;
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
          {pricing.lines.map((l) => <li key={l.slug} className="flex justify-between gap-3"><span>{l.name} <span className="text-forest-500">· {l.packageName}, {l.records.toLocaleString("en-US")} records</span></span><span className="font-semibold text-forest-900">{formatUsd(l.priceCents)}</span></li>)}
        </ul>
        <p className="mt-4 flex items-end justify-between border-t border-sand-200 pt-4"><span className="font-bold text-forest-900">Total</span><span className="display text-4xl leading-none text-forest-900">{formatUsd(pricing.totalCents)}</span></p>
        <p className="mt-2 text-xs"><Link href="/cart" className="underline">Change your cart</Link></p>
      </section>
      <ApiForm
        endpoint="/api/checkout"
        submitLabel="Continue to payment"
        successTitle="Creating your order"
        successText="Taking you to the payment page."
        hidden={{ items: pricing.lines.map((l) => ({ product: l.slug, package: l.packageName })) }}
        fields={[
          { name: "email", label: "Email for your download links", type: "email", required: true },
          { name: "coin", label: "Pay with", type: "select", required: true, options: options },
        ]}
      />
      <p className="text-sm">One payment for the whole order. After the network confirms it, we email your download link for each list. No account needed.</p>
    </div>
  );
}
