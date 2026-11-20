"use client";
import Link from "next/link";
import { ChevronDown, Lock, PackageCheck, Eye, Trash2, TriangleAlert, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { IndustryIcon } from "@/components/shared/db-icon";
import { Button } from "@/components/ui/button";
import { cartActions, useCart, useMounted } from "@/lib/cart/client";
import type { CartPricing, PricedLine, Suggestion } from "@/lib/cart/model";
import { trackCart, trackCartViewOnce } from "@/lib/cart/track";
import { formatUsd } from "@/lib/catalog";
import { productSamples } from "@/lib/sample-data";

type Loaded = { pricing: CartPricing; suggestions: Suggestion[] };

export function CartView() {
  const cart = useCart();
  const mounted = useMounted();
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false); // mobile summary
  const [attempt, setAttempt] = useState(0); // bumped by "Try again"
  // The result is tied to the cart it was fetched for, so "loading" is derived (no state is set synchronously in an effect).
  const key = `${JSON.stringify(cart)}#${attempt}`;
  const [result, setResult] = useState<{ key: string; data: Loaded | null; error: boolean } | null>(null);
  const [last, setLast] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!mounted || cart.length === 0) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean } & Loaded>) : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!j.ok) throw new Error("bad");
        const loaded = { pricing: j.pricing, suggestions: j.suggestions };
        setResult({ key, data: loaded, error: false });
        setLast(loaded);
        if (j.pricing.dropped.length > 0) {
          // Something in this browser's cart no longer exists in the catalog: remove it and say so.
          const n = j.pricing.dropped.length;
          setNotice(`${n === 1 ? "One item was" : `${n} items were`} no longer available and ${n === 1 ? "was" : "were"} removed from your cart.`);
          cartActions.replaceAll(j.pricing.lines.map((l) => ({ slug: l.slug, pkg: l.packageName })));
        }
      })
      .catch((e: Error) => { if (e.name !== "AbortError") setResult({ key, data: null, error: true }); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);
  const count = cart.length;
  useEffect(() => { if (mounted) trackCartViewOnce(count); }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps -- once per session

  const current = result?.key === key ? result : null;
  const state: "loading" | "ready" | "error" = cart.length === 0 ? "ready" : !current ? "loading" : current.error ? "error" : "ready";
  const data = cart.length === 0 ? null : (current?.data ?? last);

  if (!mounted || (state === "loading" && !data && cart.length > 0)) return <Skeleton />;
  if (cart.length === 0) return <Empty notice={notice} />;
  if (state === "error" && !data) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-3xl border border-sand-300 bg-white p-8 text-center">
        <TriangleAlert className="mx-auto size-8 text-forest-500" aria-hidden />
        <h2 className="mt-3 text-xl font-bold text-forest-900">We could not load your cart</h2>
        <p className="mt-1">Your lists are still saved in this browser. Check your connection and try again.</p>
        <Button className="mt-5" onClick={() => setAttempt(attempt + 1)}><RefreshCw className="size-4" aria-hidden /> Try again</Button>
      </div>
    );
  }
  const pricing = data?.pricing;
  if (!pricing) return <Skeleton />;
  if (pricing.lines.length === 0) return <Empty notice={notice} />;

  return (
    <div className="pb-28 lg:pb-0">
      {notice && <p role="status" className="mb-6 rounded-2xl bg-forest-100 px-5 py-3 text-sm font-medium text-forest-900">{notice}</p>}
      {state === "error" && <p role="alert" className="mb-6 rounded-2xl border border-sand-300 bg-white px-5 py-3 text-sm">We could not refresh your prices just now. What you see may be out of date. <button className="font-semibold underline" onClick={() => setAttempt(attempt + 1)}>Try again</button></p>}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="sel" className={state === "loading" ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={state === "loading"}>
          <h2 id="sel" className="text-xl font-bold text-forest-900">Your Selected Lists <span className="font-normal text-forest-500">({pricing.lines.length})</span></h2>
          <ul className="mt-4 space-y-4">
            {pricing.lines.map((l) => <li key={l.slug}><LineCard l={l} onRemove={() => { cartActions.remove(l.slug); trackCart("remove_from_cart", cart.length - 1); }} /></li>)}
          </ul>
          {data && data.suggestions.length > 0 && <CrossSell items={data.suggestions} count={cart.length} />}
        </section>

        <aside className="lg:sticky lg:top-28" aria-label="Order summary">
          <Summary pricing={pricing} open={open} setOpen={setOpen} />
          <Reassurances />
        </aside>
      </div>

      {/* Mobile: one sticky bar. It is the only fixed element on this page. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-sand-50/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-xs">Total</p><p className="display text-3xl leading-none text-forest-900">{formatUsd(pricing.totalCents)}</p></div>
          <CheckoutCta pricing={pricing} count={cart.length} compact />
        </div>
      </div>
    </div>
  );
}

function CheckoutCta({ pricing, count, compact = false }: { pricing: CartPricing; count: number; compact?: boolean }) {
  if (!pricing.canCheckout) return <Button size={compact ? "md" : "lg"} className={compact ? "" : "w-full"} disabled>{pricing.checkoutOpen ? "Review your cart" : "Checkout opens soon"}</Button>;
  return (
    <Button asChild size={compact ? "md" : "lg"} className={compact ? "" : "w-full"}>
      <Link href="/checkout/cart" onClick={() => trackCart("begin_checkout", count)}><Lock className="size-4" aria-hidden /> Proceed to Checkout</Link>
    </Button>
  );
}

function Summary({ pricing, open, setOpen }: { pricing: CartPricing; open: boolean; setOpen: (v: boolean) => void }) {
  const blocked = pricing.lines.filter((l) => !l.purchasable);
  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,42,29,0.35)]">
      <button type="button" className="flex w-full items-center justify-between text-left lg:pointer-events-none" aria-expanded={open} aria-controls="summary-body" onClick={() => setOpen(!open)}>
        <h2 className="text-xl font-bold text-forest-900">Order Summary</h2>
        <ChevronDown className={`size-5 transition-transform lg:hidden ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="summary-body" className={`${open ? "block" : "hidden"} lg:block`}>
        <ul className="mt-4 space-y-2 text-sm">
          {pricing.lines.map((l) => <li key={l.slug} className="flex justify-between gap-3"><span className="min-w-0 truncate">{l.name} <span className="text-forest-500">· {l.packageName}</span></span><span className="shrink-0 font-semibold text-forest-900">{formatUsd(l.priceCents)}</span></li>)}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-sand-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold text-forest-900">{formatUsd(pricing.totalCents)}</dd></div>
          <div className="flex justify-between"><dt>BeigeLeads fees</dt><dd>None added</dd></div>
        </dl>
        <div className="mt-4 flex items-end justify-between border-t border-sand-200 pt-4">
          <p className="font-bold text-forest-900">Total</p>
          <p className="display text-5xl leading-none text-forest-900">{formatUsd(pricing.totalCents)}</p>
        </div>
        <p className="mt-2 text-xs">Priced in US dollars. You pay in crypto: the exact coin amount is shown at checkout and locked for 30 minutes.</p>
      </div>
      <div className="mt-5 hidden lg:block"><CheckoutCta pricing={pricing} count={pricing.lines.length} /></div>
      {blocked.length > 0 && (
        <p role="status" className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm">{blocked[0].reason}{pricing.checkoutOpen && blocked.length > 0 ? " Remove it from your cart to continue." : " Your cart is saved in this browser."}</p>
      )}
      {pricing.placeholderPrices && <p className="mt-3 text-xs">Prices and sizes shown are placeholders until launch.</p>}
      <p className="mt-4 text-center text-sm font-semibold text-forest-900">One-time purchase. No subscription. No account.</p>
      <p className="mt-2 text-center text-xs">Crypto only. The coins you can choose from are shown at checkout.</p>
    </div>
  );
}

function Reassurances() {
  const items = [
    { Icon: Check, title: "One-Time Purchase", text: "No recurring subscription.", href: "/help/pricing/no-subscription" },
    { Icon: Eye, title: "Review Before Buying", text: "Explore available masked samples.", href: "/sample" },
    { Icon: PackageCheck, title: "Clear Delivery Process", text: "Understand how purchased data is delivered.", href: "/help/delivery/how-you-receive-your-list" },
  ];
  return (
    <ul className="mt-5 space-y-3">
      {items.map(({ Icon, title, text, href }) => (
        <li key={title}>
          <Link href={href} className="flex gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-purple-600">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-100 text-forest-700"><Icon className="size-4" aria-hidden /></span>
            <span><span className="block font-bold text-forest-900">{title}</span><span className="block text-sm">{text}</span></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LineCard({ l, onRemove }: { l: PricedLine; onRemove: () => void }) {
  const [sample, setSample] = useState(false);
  const rows = (productSamples[l.categorySlug] ?? []).slice(0, 3);
  const sel = `pkg-${l.slug}`;
  return (
    <article className="rounded-3xl border border-sand-200 bg-white p-5 sm:p-6">
      <div className="flex gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><IndustryIcon slug={l.categorySlug} className="size-7" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h3 className="text-lg font-bold leading-snug text-forest-900"><Link href={`/product/${l.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{l.name}</Link></h3>
            <p className="display text-3xl leading-none text-forest-900" aria-label={`Price ${formatUsd(l.priceCents)}`}>{formatUsd(l.priceCents)}</p>
          </div>
          <p className="mt-1 text-sm">{l.categoryName} · {l.coverage}</p>
          <p className="mt-2 text-sm"><strong className="text-forest-900">{l.records.toLocaleString("en-US")} records</strong> in the {l.packageName} package{l.placeholder ? " (placeholder size)" : ""}</p>
        </div>
      </div>

      <ul aria-label="Included data fields" className="mt-4 flex flex-wrap gap-1.5">
        {l.fields.map((f) => <li key={f} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-forest-900">{f}</li>)}
      </ul>
      <p className="mt-3 text-sm">One-time license: delivered as CSV, Excel or TXT, with unlimited downloads.</p>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-sand-200 pt-4">
        <div>
          <label htmlFor={sel} className="mb-1 block text-xs font-semibold text-forest-900">Package</label>
          <select id={sel} value={l.packageName} onChange={(e) => cartActions.setPackage(l.slug, e.target.value)} className="h-10 min-w-48 rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
            {l.packages.map((p) => <option key={p.name} value={p.name}>{p.name} · {p.records.toLocaleString("en-US")} records · {formatUsd(p.priceCents)}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 text-sm">
          {rows.length > 0 && <button type="button" onClick={() => setSample(!sample)} aria-expanded={sample} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><Eye className="size-4" aria-hidden /> {sample ? "Hide sample" : "Masked sample"}</button>}
          <Link href={`/product/${l.slug}`} className="inline-flex h-10 items-center rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">Details</Link>
          <button type="button" onClick={onRemove} aria-label={`Remove ${l.name} from cart`} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><Trash2 className="size-4" aria-hidden /> Remove</button>
        </div>
      </div>

      {sample && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200">
          <table className="w-full min-w-[30rem] text-left text-xs">
            <thead className="bg-sand-100 text-forest-900"><tr><th className="px-3 py-2">Business</th><th className="px-3 py-2">City</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Phone</th></tr></thead>
            <tbody className="divide-y divide-sand-200">{rows.map((r) => <tr key={r.business}><td className="px-3 py-2">{r.business}</td><td className="px-3 py-2">{r.city}</td><td className="px-3 py-2 font-mono">{r.email}</td><td className="px-3 py-2 font-mono">{r.phone}</td></tr>)}</tbody>
          </table>
          <p className="border-t border-sand-200 px-3 py-2 text-xs">Fictional example rows with masked details. <Link className="underline" href={`/sample?product=${l.slug}`}>Request a free sample</Link>.</p>
        </div>
      )}
      {!l.purchasable && <p role="status" className="mt-4 rounded-xl bg-sand-100 px-4 py-2.5 text-sm">{l.reason}</p>}
    </article>
  );
}

function CrossSell({ items, count }: { items: Suggestion[]; count: number }) {
  return (
    <section aria-labelledby="also" className="mt-10">
      <h2 id="also" className="text-xl font-bold text-forest-900">You Might Also Need</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s) => (
          <li key={s.slug} className="flex flex-col rounded-2xl border border-sand-200 bg-sand-50 p-4">
            <p className="font-bold text-forest-900"><Link href={`/product/${s.slug}`} className="hover:underline">{s.name}</Link></p>
            <p className="mt-0.5 text-xs">{s.categoryName} · {s.coverage}</p>
            <p className="mt-2 text-sm">{s.packageName} package · {s.records.toLocaleString("en-US")} records</p>
            <p className="mt-1 text-sm">{s.reason}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span className="font-bold text-forest-900">{formatUsd(s.priceCents)}</span>
              <Button size="sm" variant="secondary" onClick={() => { cartActions.add(s.slug, s.packageName); trackCart("add_to_cart", count + 1); }} aria-label={`Add ${s.name} to cart`}>Add to cart</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Empty({ notice }: { notice: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[2rem] border border-sand-200 bg-white px-6 py-14 text-center sm:px-12">
      <svg viewBox="0 0 120 90" className="mx-auto h-24 w-32" role="img" aria-label="An empty list">
        <rect x="14" y="14" width="92" height="62" rx="12" fill="#F4EEDF" stroke="#D8C9A3" />
        <rect x="26" y="28" width="30" height="6" rx="3" fill="#2D6A4F" /><rect x="26" y="42" width="68" height="5" rx="2.5" fill="#E8DEC6" /><rect x="26" y="54" width="52" height="5" rx="2.5" fill="#E8DEC6" />
        <circle cx="92" cy="30" r="5" fill="#D8EADF" />
      </svg>
      {notice && <p role="status" className="mt-4 rounded-xl bg-forest-100 px-4 py-2 text-sm font-medium text-forest-900">{notice}</p>}
      <h2 className="display mt-5 text-5xl text-forest-900 sm:text-6xl">Your Next Prospects Start Here.</h2>
      <p className="mx-auto mt-3 max-w-md text-lg">Explore business contact lists and add the ones that match your goals.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg"><Link href="/lists">Explore Lists</Link></Button>
        <Button asChild size="lg" variant="secondary"><Link href="/custom-list">Build My List</Link></Button>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]" aria-busy="true" role="status">
      <span className="sr-only">Loading your cart</span>
      <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="h-56 animate-pulse rounded-3xl bg-sand-100 motion-reduce:animate-none" />)}</div>
      <div className="h-80 animate-pulse rounded-3xl bg-sand-100 motion-reduce:animate-none" />
    </div>
  );
}
