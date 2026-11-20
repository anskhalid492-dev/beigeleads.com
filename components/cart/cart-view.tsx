"use client";
import Link from "next/link";
import { Mail, FileText, Clock, ArrowRight, ChevronDown, Lock, PackageCheck, Eye, Trash2, TriangleAlert, Check, RefreshCw, Repeat2, Plus, TicketPercent } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyCart } from "@/components/cart/empty-cart";
import { Flag, IndustryIcon } from "@/components/shared/db-icon";
import { Button } from "@/components/ui/button";
import { cartActions, useCart, useMounted } from "@/lib/cart/client";
import type { CartPricing, PricedLine, Suggestion } from "@/lib/cart/model";
import { readPartner, writePartner } from "@/lib/cart/partner";
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
  // A partner code applied here (or earlier in this tab). The server validates it on every price; the browser never sets a price.
  const [applied, setApplied] = useState<{ code: string; email: string } | null>(null);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  // The result is tied to the cart it was fetched for, so "loading" is derived (no state is set synchronously in an effect).
  const key = `${JSON.stringify(cart)}#${attempt}#${JSON.stringify(applied)}`;

  useEffect(() => {
    const saved = readPartner();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of sessionStorage after mount
    if (saved) setApplied(saved);
  }, []);
  const [result, setResult] = useState<{ key: string; data: Loaded | null; error: boolean } | null>(null);
  const [last, setLast] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!mounted || cart.length === 0) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: cart, ...(applied ? { code: applied.code, email: applied.email } : {}) }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean; discountError?: string } & Loaded>) : Promise.reject(new Error(r.status === 429 ? "limit" : String(r.status)))))
      .then((j) => {
        if (!j.ok) throw new Error("bad");
        const loaded = { pricing: j.pricing, suggestions: j.suggestions };
        setResult({ key, data: loaded, error: false });
        setLast(loaded);
        if (applied) {
          if (j.discountError) { setCodeMsg({ ok: false, text: j.discountError }); setApplied(null); writePartner(null); }
          else { setCodeMsg({ ok: true, text: appliedMessage(j.pricing) }); writePartner(applied); }
        }
        if (j.pricing.dropped.length > 0) {
          // Something in this browser's cart no longer exists in the catalog: remove it and say so.
          const n = j.pricing.dropped.length;
          setNotice(`${n === 1 ? "One item was" : `${n} items were`} no longer available and ${n === 1 ? "was" : "were"} removed from your cart.`);
          cartActions.replaceAll(j.pricing.lines.map((l) => ({ slug: l.slug, pkg: l.packageName })));
        }
      })
      .catch((e: Error) => {
        if (e.name === "AbortError") return;
        if (e.message === "limit" && applied) { setCodeMsg({ ok: false, text: "Too many code attempts. Try again in an hour." }); setApplied(null); writePartner(null); return; }
        setResult({ key, data: null, error: true });
      });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, key]);
  const count = cart.length;
  useEffect(() => { if (mounted) trackCartViewOnce(count); }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps -- once per session

  const current = result?.key === key ? result : null;
  const state: "loading" | "ready" | "error" = cart.length === 0 ? "ready" : !current ? "loading" : current.error ? "error" : "ready";
  const data = cart.length === 0 ? null : (current?.data ?? last);

  if (!mounted || (state === "loading" && !data && cart.length > 0)) return <Skeleton />;
  if (cart.length === 0) return <EmptyCart notice={notice} />;
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
  if (pricing.lines.length === 0) return <EmptyCart notice={notice} />;

  return (
    <div className="cart-in pb-28 lg:pb-0">
      {notice && <p role="status" className="mb-6 rounded-2xl bg-forest-100 px-5 py-3 text-sm font-medium text-forest-900">{notice}</p>}
      {state === "error" && <p role="alert" className="mb-6 rounded-2xl border border-sand-300 bg-white px-5 py-3 text-sm">We could not refresh your prices just now. What you see may be out of date. <button className="font-semibold underline" onClick={() => setAttempt(attempt + 1)}>Try again</button></p>}
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <section aria-labelledby="sel" className={`transition-opacity duration-200 ${state === "loading" ? "opacity-60" : ""}`} aria-busy={state === "loading"}>
          <h2 id="sel" className="text-xl font-bold text-forest-900">Your Selected Databases <span className="font-normal text-forest-500">({pricing.lines.length})</span></h2>
          <ul className="mt-4">
            {pricing.lines.map((l, i) => <Line key={l.slug} l={l} i={i} onRemove={() => { cartActions.remove(l.slug); trackCart("remove_from_cart", cart.length - 1); }} />)}
          </ul>
          {data && data.suggestions.length > 0 && <Reach items={data.suggestions} count={cart.length} />}
        </section>

        <aside className="lg:sticky lg:top-28" aria-label="Order summary">
          <Summary
            pricing={pricing} open={open} setOpen={setOpen} applied={applied} codeMsg={codeMsg} busy={state === "loading"}
            onApply={(code, email) => { setCodeMsg(null); setApplied({ code, email }); }}
            onRemoveCode={() => { setApplied(null); setCodeMsg(null); writePartner(null); }}
          />
          <Trust />
        </aside>
      </div>

      {/* Mobile: one sticky bar. It is the only fixed element on this page. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-sand-50/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-xs">Total</p><p className="display text-3xl leading-none text-forest-900"><Money cents={pricing.totalCents} /></p></div>
          <CheckoutCta pricing={pricing} count={cart.length} compact />
        </div>
      </div>
    </div>
  );
}

/** Counts a price up or down to its new value (about 320 ms). Jumps straight there under reduced motion. */
function useTween(target: number) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    if (cur.current === target) return;
    const from = cur.current;
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = dur === 0 ? 1 : Math.min(1, (t - t0) / dur);
      cur.current = p === 1 ? target : Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      setV(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
function Money({ cents }: { cents: number }) {
  const v = useTween(cents);
  return <span aria-label={formatUsd(cents)}><span aria-hidden>{formatUsd(v)}</span></span>;
}

function CheckoutCta({ pricing, count, compact = false }: { pricing: CartPricing; count: number; compact?: boolean }) {
  if (!pricing.canCheckout) return <Button size={compact ? "md" : "lg"} className={compact ? "" : "w-full"} disabled>{pricing.checkoutOpen ? "Review your cart" : "Checkout opens soon"}</Button>;
  return (
    <Button asChild size={compact ? "md" : "lg"} className={`group ${compact ? "" : "w-full"}`}>
      <Link href="/checkout/cart" onClick={() => trackCart("begin_checkout", count)}><Lock className="size-4" aria-hidden /> Secure My Databases <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden /></Link>
    </Button>
  );
}

function Summary({ pricing, open, setOpen, applied, codeMsg, busy, onApply, onRemoveCode }: {
  pricing: CartPricing; open: boolean; setOpen: (v: boolean) => void;
  applied: { code: string; email: string } | null; codeMsg: { ok: boolean; text: string } | null; busy: boolean;
  onApply: (code: string, email: string) => void; onRemoveCode: () => void;
}) {
  const blocked = pricing.lines.filter((l) => !l.purchasable);
  return (
    <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,42,29,0.35)]">
      <button type="button" className="flex w-full items-center justify-between text-left lg:pointer-events-none" aria-expanded={open} aria-controls="summary-body" onClick={() => setOpen(!open)}>
        <h2 className="text-xl font-bold text-forest-900">Order Summary</h2>
        <ChevronDown className={`size-5 transition-transform duration-200 lg:hidden ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <div id="summary-body" className={`${open ? "block" : "hidden"} lg:block`}>
        <ul className="mt-4 space-y-2 text-sm">
          {pricing.lines.map((l) => <li key={l.slug} className="flex justify-between gap-3"><span className="min-w-0 truncate">{l.name} <span className="text-forest-500">· {l.packageName}</span></span><span className="shrink-0 font-semibold text-forest-900">{formatUsd(l.payCents)}</span></li>)}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-sand-200 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-semibold text-forest-900">{formatUsd(pricing.subtotalCents)}</dd></div>
          {pricing.applied.map((a) => (
            <div key={`${a.source}-${a.code}-${a.title}`} className="cart-in flex justify-between gap-3 text-forest-700">
              <dt className="min-w-0">{a.title}{a.kind === "percent" && a.percent > 0 ? ` (${a.percent}%)` : ""}{a.source === "automatic" && <span className="block text-xs text-forest-500">Applied automatically</span>}{a.code && a.source !== "automatic" && <span className="block font-mono text-xs text-forest-500">{a.code}</span>}</dt>
              <dd className="shrink-0 font-semibold">&minus;{formatUsd(a.cents)}</dd>
            </div>
          ))}
          <div className="flex justify-between"><dt>BeigeLeads fees</dt><dd>None added</dd></div>
        </dl>
        <Code pricing={pricing} applied={applied} codeMsg={codeMsg} busy={busy} onApply={onApply} onRemove={onRemoveCode} />
        <div className={`mt-4 flex items-end justify-between border-t border-sand-200 pt-4 transition-opacity duration-200 ${busy ? "opacity-60" : ""}`}>
          <p className="font-bold text-forest-900">Total</p>
          <p className="display text-5xl leading-none text-forest-900"><Money cents={pricing.totalCents} /></p>
        </div>
        <p className="mt-2 text-xs">Priced in US dollars. You pay in crypto: the exact coin amount is shown at checkout and locked for 30 minutes.</p>
      </div>
      <div className="mt-5 hidden lg:block"><CheckoutCta pricing={pricing} count={pricing.lines.length} /></div>
      {blocked.length > 0 && (
        <p role="status" className="mt-4 rounded-xl bg-sand-100 px-4 py-3 text-sm">{blocked[0].reason}{pricing.checkoutOpen && blocked.length > 0 ? " Remove it from your cart to continue." : " Your cart is saved in this browser."}</p>
      )}
      {pricing.placeholderPrices && <p className="mt-3 text-xs">Prices and sizes shown are placeholders until launch.</p>}
      <p className="mt-4 text-center text-sm font-semibold text-forest-900">One-time payment. No recurring charges.</p>
      <p className="mt-1 text-center text-sm">Pay once. Own the list.</p>
    </div>
  );
}

const isPartnerLike = (c: string) => /^PARTNER-/i.test(c.trim());
const appliedMessage = (p: CartPricing) => {
  const typed = p.applied.find((a) => a.source !== "automatic");
  if (!typed) return "";
  return p.needsEmail ? `${typed.code || typed.title} applied. We confirm your eligibility with your email at checkout.` : `${typed.code || typed.title} applied: you save ${formatUsd(typed.cents)}.`;
};

/** One code box for every code: public promotion codes and personal partner codes (a partner code also needs the partner's email). */
function Code({ pricing, applied, codeMsg, busy, onApply, onRemove }: {
  pricing: CartPricing; applied: { code: string; email: string } | null; codeMsg: { ok: boolean; text: string } | null; busy: boolean;
  onApply: (code: string, email: string) => void; onRemove: () => void;
}) {
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState({ code: "", email: "" });
  const live = !!applied && pricing.applied.some((a) => a.source !== "automatic");
  const partner = isPartnerLike(draft.code);
  const ready = draft.code.trim().length > 0 && (!partner || draft.email.trim().length > 0);
  return (
    <div className="mt-4 border-t border-sand-200 pt-4 text-sm">
      {live ? (
        <div className="cart-in" role="status">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-forest-100 px-3 py-2.5 text-forest-900">
            <span className="flex min-w-0 items-center gap-2"><Check className="size-4 shrink-0" aria-hidden /><span className="min-w-0 truncate"><strong className="font-mono">{applied.code.toUpperCase()}</strong> applied</span></span>
            <button type="button" onClick={onRemove} className="shrink-0 font-semibold underline focus-visible:outline-2 focus-visible:outline-purple-600">Remove</button>
          </div>
          {codeMsg?.ok && codeMsg.text && <p className="mt-2 text-xs text-forest-700">{codeMsg.text}</p>}
        </div>
      ) : (
        <>
          <button type="button" aria-expanded={show || !!codeMsg} onClick={() => setShow(!show)} className="inline-flex items-center gap-2 font-semibold text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600">
            <TicketPercent className="size-4" aria-hidden /> Have a promo code?
            <ChevronDown className={`size-4 transition-transform duration-200 ${show || codeMsg ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {(show || codeMsg) && (
            <form className="cart-in mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); if (ready) onApply(draft.code.trim(), partner ? draft.email.trim().toLowerCase() : ""); }}>
              <label className="block text-xs font-semibold text-forest-900">Promo code
                <span className="mt-1 flex gap-2">
                  <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} autoComplete="off" spellCheck={false} maxLength={40} placeholder="Enter code" className="h-10 min-w-0 flex-1 rounded-xl border border-sand-300 bg-white px-3 font-mono text-sm uppercase text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600" />
                  <Button type="submit" size="sm" variant="secondary" disabled={busy || !ready}>{busy ? "Checking..." : "Apply"}</Button>
                </span>
              </label>
              {partner && <label className="block text-xs font-semibold text-forest-900">Email you applied with<input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} autoComplete="email" maxLength={254} className="mt-1 h-10 w-full rounded-xl border border-sand-300 bg-white px-3 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600" /></label>}
              <p className="text-xs">Approved data reseller partner? Use your personal partner code. <Link href="/partners" className="underline">About the partner program</Link></p>
            </form>
          )}
          {codeMsg && !codeMsg.ok && <p role="alert" className="cart-in mt-2 flex items-start gap-2 rounded-xl bg-sand-100 px-3 py-2 text-forest-900"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{codeMsg.text}</p>}
        </>
      )}
    </div>
  );
}

function Trust() {
  const items = [
    { Icon: Lock, label: "Secure checkout" },
    { Icon: PackageCheck, label: "Digital delivery" },
    { Icon: Repeat2, label: "No subscription" },
  ];
  return (
    <div className="mt-4">
      <ul className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-forest-900">
        {items.map(({ Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-sand-200 bg-sand-50 px-2 py-3"><Icon className="size-4 text-forest-500" aria-hidden />{label}</li>
        ))}
      </ul>
      <section aria-labelledby="cart-delivery-h" className="mt-3 rounded-2xl border border-sand-200 bg-sand-100/60 p-4 text-left">
        <div className="flex items-center gap-2">
          <Mail className="size-4 shrink-0 text-forest-500" aria-hidden />
          <h3 id="cart-delivery-h" className="text-sm font-bold leading-snug text-forest-900">How You&apos;ll Receive Your Lists</h3>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-forest-700/80">
          Once your payment is confirmed, we&apos;ll email you a secure download link for each purchased database.
        </p>
        <dl className="mt-3 space-y-2 text-[13px] leading-snug">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />
            <div><dt className="text-forest-700/70">File formats</dt><dd className="font-semibold text-forest-900">CSV, Excel or TXT</dd></div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />
            <div><dt className="text-forest-700/70">Delivery time</dt><dd className="font-semibold text-forest-900">Usually instant, up to 12 hours</dd></div>
          </div>
        </dl>
        <div className="mt-3 flex flex-col gap-2 border-t border-sand-200 pt-3 text-[13px] font-semibold sm:flex-row sm:flex-wrap sm:gap-x-5">
          <Link href="/help/delivery/how-you-receive-your-list" className="group inline-flex items-center gap-1.5 rounded text-forest-900 transition-colors hover:text-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            How delivery works <ArrowRight className="size-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <Link href="/sample" className="group inline-flex items-center gap-1.5 rounded text-forest-900 transition-colors hover:text-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            Preview before buying <Eye className="size-3.5" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}

/** One cart line: enters with a soft rise, leaves by fading and collapsing (instant under reduced motion). */
function Line({ l, i, onRemove }: { l: PricedLine; i: number; onRemove: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  function remove() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onRemove(); return; }
    setLeaving(true);
    timer.current = window.setTimeout(onRemove, 260);
  }
  return (
    <li className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-out motion-reduce:transition-none ${leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
      <div className="min-h-0 overflow-hidden">
        <div className="cart-in pb-4" style={{ "--i": i } as React.CSSProperties}><LineCard l={l} onRemove={remove} /></div>
      </div>
    </li>
  );
}

function LineCard({ l, onRemove }: { l: PricedLine; onRemove: () => void }) {
  const [sample, setSample] = useState(false);
  const rows = (productSamples[l.categorySlug] ?? []).slice(0, 3);
  const grp = `pkg-${l.slug}`;
  return (
    <article className="rounded-3xl border border-sand-200 bg-white p-5 transition-shadow duration-200 hover:shadow-[0_18px_40px_-30px_rgba(15,42,29,0.5)] sm:p-6">
      <div className="flex gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-forest-900 text-forest-300"><IndustryIcon slug={l.categorySlug} className="size-7" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h3 className="text-lg font-bold leading-snug text-forest-900"><Link href={`/lists/${l.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{l.name}</Link></h3>
            <p className="display text-3xl leading-none text-forest-900" aria-label={`Price ${formatUsd(l.payCents)}`}>{l.payCents !== l.priceCents && <span className="mr-2 text-lg font-normal text-forest-500 line-through">{formatUsd(l.priceCents)}</span>}<Money cents={l.payCents} /></p>
          </div>
          <p className="mt-1 text-sm">{l.categoryName} · {l.coverage}</p>
          <p className="mt-2 text-sm"><strong className="text-forest-900">{l.records > 0 ? `${l.records.toLocaleString("en-US")} contacts` : "Full list"}</strong> in the {l.packageName} package{l.placeholder ? " (placeholder size)" : ""}</p>
        </div>
      </div>

      <ul aria-label="Included data fields" className="mt-4 flex flex-wrap gap-1.5">
        {l.fields.map((f) => <li key={f} className="rounded-full bg-sand-100 px-2.5 py-1 text-xs text-forest-900">{f}</li>)}
      </ul>

      {l.packages.length > 1 && (
        <fieldset className="mt-4 border-t border-sand-200 pt-4">
          <legend className="mb-2 text-xs font-semibold text-forest-900">Package</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {l.packages.map((p) => (
              <label key={p.name} className="relative cursor-pointer">
                <input type="radio" name={grp} value={p.name} checked={p.name === l.packageName} onChange={() => cartActions.setPackage(l.slug, p.name)} className="peer sr-only" />
                <span className="block rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm transition-[border-color,background-color,box-shadow] duration-150 hover:border-forest-500 peer-checked:border-forest-900 peer-checked:bg-forest-100 peer-checked:shadow-[inset_0_0_0_1px_#0F2A1D] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-purple-600 motion-reduce:transition-none">
                  <span className="block font-bold text-forest-900">{p.name}</span>
                  <span className="block text-xs">{p.records > 0 ? `${p.records.toLocaleString("en-US")} contacts` : "Full list"}</span>
                  <span className="block text-sm font-semibold text-forest-900">{formatUsd(p.priceCents)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 pt-3 text-sm">
        <p className="min-w-0 text-xs sm:text-sm">One-time license. CSV, Excel or TXT. Unlimited downloads.</p>
        <div className="flex items-center gap-1">
          {rows.length > 0 && <button type="button" onClick={() => setSample(!sample)} aria-expanded={sample} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><Eye className="size-4" aria-hidden /> {sample ? "Hide sample" : "Masked sample"}</button>}
          <Link href={`/lists/${l.slug}`} className="inline-flex h-10 items-center rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">Details</Link>
          <button type="button" onClick={onRemove} aria-label={`Remove ${l.name} from cart`} className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><Trash2 className="size-4" aria-hidden /> Remove</button>
        </div>
      </div>

      {sample && rows.length > 0 && (
        <div className="cart-in mt-4 overflow-x-auto rounded-2xl border border-sand-200">
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

/** "Expand Your Reach": real, on-sale lists related to the cart, added with one click. Sits below the lines so checkout is never interrupted. */
function Reach({ items, count }: { items: Suggestion[]; count: number }) {
  return (
    <section aria-labelledby="reach" className="mt-8">
      <h2 id="reach" className="text-xl font-bold text-forest-900">Expand Your Reach</h2>
      <ul className="mt-4 space-y-3">
        {items.map((s, i) => (
          <li key={s.slug} className="cart-in flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-sand-200 bg-sand-50 p-4 transition-colors duration-200 hover:bg-white" style={{ "--i": i } as React.CSSProperties}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest-900 text-forest-300"><IndustryIcon slug={s.categorySlug} className="size-5" /></span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="font-bold leading-snug text-forest-900"><Link href={`/lists/${s.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{s.name}</Link></p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs">{s.countryCode && <Flag code={s.countryCode} className="h-3 w-4" />}{s.coverage}{s.reason && <> · {s.reason}</>}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">{s.packageName} <strong className="text-forest-900">{formatUsd(s.priceCents)}</strong></span>
              <Button size="sm" variant="secondary" onClick={() => { cartActions.add(s.slug, s.packageName); trackCart("add_to_cart", count + 1); }} aria-label={`Add ${s.name} to cart`}><Plus className="size-4" aria-hidden /> Add</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_25rem]" aria-busy="true" role="status">
      <span className="sr-only">Loading your cart</span>
      <div className="space-y-4">{[0, 1].map((i) => <div key={i} className="cart-skel h-56 rounded-3xl" />)}</div>
      <div className="cart-skel h-80 rounded-3xl" />
    </div>
  );
}
