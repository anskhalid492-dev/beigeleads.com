"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, FileText, ShoppingBag } from "lucide-react";
import { DbBadge } from "@/components/shared/db-icon";
import { fmtDate, fmtNum } from "@/components/product/meta";
import { cartActions, useCart } from "@/lib/cart/client";
import type { Bundle, Card, DfyCardData } from "@/lib/beigepilot/tools";
import type { CartPricing } from "@/lib/cart/model";

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ERR = "I couldn't add that database to your cart. Please try again.";

/** Asks the server to price the cart WITH the new item(s). The browser never decides a price: the server checks product, package and sale status. */
async function checkWith(existing: { slug: string; pkg: string }[], add: { slug: string; pkg: string }[]): Promise<CartPricing | null> {
  const items = [...existing.filter((e) => !add.some((a) => a.slug === e.slug)), ...add];
  try {
    const r = await fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) });
    const j = (await r.json()) as { ok?: boolean; pricing?: CartPricing };
    if (!r.ok || !j.ok || !j.pricing) return null;
    const lines = j.pricing.lines;
    if (!add.every((a) => lines.some((l) => l.slug === a.slug && l.packageName === a.pkg && !l.placeholder))) return null;
    return j.pricing;
  } catch { return null; }
}

/** A real product from the catalog. The visitor picks a package and presses Add to Cart: the server re-checks it, then the normal cart is updated. Nothing is bought here. */
export function ChatProductCard({ c, onAdded, onPick }: { c: Card; onAdded?: () => void; onPick?: () => void }) {
  const cart = useCart();
  const sellable = c.forSale && c.packages.length > 0;
  const [pkg, setPkg] = useState(c.pick ?? (c.packages.length === 1 ? c.packages[0].name : ""));
  const [state, setState] = useState<"idle" | "adding" | "added" | "error" | "full">("idle");
  const [done, setDone] = useState<{ pkg: string; price: string; updated: boolean } | null>(null);
  const place = c.region ? `${c.region}, ${c.country}` : c.country;
  const date = fmtDate(c.lastUpdated);
  const chosen = c.packages.find((p) => p.name === pkg);

  async function add() {
    if (!chosen || state === "adding") return;
    setState("adding");
    const pricing = await checkWith(cart, [{ slug: c.slug, pkg: chosen.name }]);
    if (!pricing) { setState("error"); return; }
    const r = cartActions.add(c.slug, chosen.name);
    if (r === "full") { setState("full"); return; }
    const line = pricing.lines.find((l) => l.slug === c.slug);
    setDone({ pkg: chosen.name, price: usd(line?.priceCents ?? chosen.priceCents), updated: r === "updated" });
    setState("added"); onAdded?.();
  }

  return (
    <article onMouseEnter={onPick} onFocus={onPick} className="rounded-2xl border border-sand-300 bg-white p-3 text-sm shadow-sm transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-forest-500 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-start gap-2.5">
        <DbBadge category={c.category} country={c.countryCode} hint={c.name} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug text-forest-900"><Link href={c.url} className="hover:underline">{c.name}</Link></h3>
          <p className="mt-0.5 text-xs">{place}{c.records ? ` · ${fmtNum(c.records)} contacts` : ""}</p>
          <p className="text-xs">{date ? `Last updated ${date}` : "Last updated date not recorded"}{c.startingPrice ? ` · From ${c.startingPrice}` : ""}</p>
        </div>
      </div>
      {sellable ? (
        <div role="radiogroup" aria-label={`Package for ${c.name}`} className="mt-2.5 flex flex-wrap gap-1.5">
          {c.packages.map((p) => (
            <button key={p.name} type="button" role="radio" aria-checked={pkg === p.name} onClick={() => { setPkg(p.name); setState("idle"); setDone(null); onPick?.(); }}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${pkg === p.name ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900 hover:border-forest-900"}`}>
              {p.name} · {p.records ? `${fmtNum(p.records)} · ` : ""}{p.price}
            </button>
          ))}
        </div>
      ) : <p className="mt-2 rounded-lg bg-sand-100 px-2.5 py-1.5 text-xs">Not currently for sale. You can still view details or request a sample.</p>}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {sellable && <button type="button" disabled={!chosen || state === "adding"} onClick={add} className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
          {state === "adding" ? <span aria-hidden className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none" /> : <ShoppingBag className="size-3.5" aria-hidden />}
          {state === "adding" ? "Adding…" : chosen ? "Add to Cart" : "Choose a package"}</button>}
        <Link href={c.url} className="rounded-full border border-forest-900 px-3.5 py-1.5 text-xs font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">View Details</Link>
        <Link href={c.sampleUrl} className="inline-flex items-center gap-1 px-1.5 py-1.5 text-xs font-semibold text-purple-700 underline underline-offset-2"><FileText className="size-3.5" aria-hidden />Free sample</Link>
      </div>
      {state === "added" && done && <AddedNote name={c.name} pkg={done.pkg} price={done.price} updated={done.updated} count={cart.length} onContinue={() => { setState("idle"); setDone(null); }} />}
      {state === "error" && <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-forest-900 ring-1 ring-amber-300">{ERR}</p>}
      {state === "full" && <p role="alert" className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-forest-900 ring-1 ring-amber-300">Your cart is full (10 databases). <Link href="/cart" className="text-purple-700 underline">View cart</Link></p>}
    </article>
  );
}

function AddedNote({ name, pkg, price, updated, count, onContinue }: { name: string; pkg: string; price: string; updated: boolean; count: number; onContinue: () => void }) {
  return (
    <div role="status" className="mt-2 rounded-xl bg-forest-100 p-2.5 text-xs text-forest-900">
      <p className="flex items-start gap-1.5 font-semibold"><Check className="mt-0.5 size-3.5 shrink-0" aria-hidden /><span>{name} has been {updated ? "updated in" : "added to"} your cart.</span></p>
      <p className="mt-1 pl-5">{pkg} · {price} · {count} {count === 1 ? "item" : "items"} in your cart</p>
      <div className="mt-2 flex flex-wrap gap-1.5 pl-5">
        <Link href="/cart" className="rounded-full bg-forest-900 px-3 py-1 font-bold text-sand-50 hover:bg-forest-700">View Cart</Link>
        <button type="button" onClick={onContinue} className="rounded-full border border-forest-900 px-3 py-1 font-semibold hover:bg-forest-900 hover:text-sand-50">Continue Shopping</button>
      </div>
    </div>
  );
}

/** Budget plan for several databases. "Add all" re-checks every item on the server, adds them, then shows the total the real cart calculated. */
export function ChatBundle({ b, onAdded }: { b: Bundle; onAdded?: () => void }) {
  const cart = useCart();
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle");
  const [real, setReal] = useState<CartPricing | null>(null);
  async function addAll() {
    if (state === "adding") return;
    setState("adding");
    const add = b.lines.map((l) => ({ slug: l.slug, pkg: l.pkg }));
    const pricing = await checkWith(cart, add);
    if (!pricing) { setState("error"); return; }
    for (const a of add) if (cartActions.add(a.slug, a.pkg) === "full") { setState("error"); return; }
    setReal(pricing); setState("added"); onAdded?.();
  }
  return (
    <section aria-label="Budget plan" className="rounded-2xl border border-forest-900 bg-white p-3 text-xs">
      <p className="text-sm font-bold text-forest-900">Your plan</p>
      <ul className="mt-1.5 divide-y divide-sand-200">{b.lines.map((l) => <li key={l.slug} className="flex justify-between gap-2 py-1.5"><span>{l.name} · {l.pkg}</span><span className="font-semibold text-forest-900">{l.price}</span></li>)}</ul>
      <dl className="mt-1 space-y-0.5 border-t border-sand-200 pt-1.5">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{b.subtotal}</dd></div>
        {b.volumeApplied && <div className="flex justify-between"><dt>Buy More, Save More</dt><dd>&minus;{b.discount}</dd></div>}
        <div className="flex justify-between text-sm font-bold text-forest-900"><dt>Estimated total</dt><dd>{b.total}</dd></div>
      </dl>
      <p className="mt-1">An estimate: the cart checks the final total again.</p>
      {state !== "added" && <button type="button" onClick={addAll} disabled={state === "adding"} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 font-bold text-white hover:bg-purple-700 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"><ShoppingBag className="size-3.5" aria-hidden />{state === "adding" ? "Adding…" : "Add all to Cart"}</button>}
      {state === "error" && <p role="alert" className="mt-2 font-semibold text-forest-900">{ERR}</p>}
      {state === "added" && real && (
        <div role="status" className="mt-2 rounded-xl bg-forest-100 p-2.5 text-forest-900">
          <p className="font-semibold">Added to your cart. Cart total checked by the server: {usd(real.totalCents)}</p>
          <div className="mt-2 flex gap-1.5"><Link href="/cart" className="rounded-full bg-forest-900 px-3 py-1 font-bold text-sand-50 hover:bg-forest-700">View Cart</Link><button type="button" onClick={() => setState("idle")} className="rounded-full border border-forest-900 px-3 py-1 font-semibold hover:bg-forest-900 hover:text-sand-50">Continue Shopping</button></div>
        </div>
      )}
    </section>
  );
}

/** A DFY Outbound package. Add to Cart asks the server to price it first (it checks the package and availability), then updates the normal cart. Ownership is off unless ticked. */
export function ChatDfyCard({ c, onAdded }: { c: DfyCardData; onAdded?: () => void }) {
  const [own, setOwn] = useState(false);
  const [state, setState] = useState<"idle" | "adding" | "added" | "error">("idle");
  async function add() {
    if (state === "adding") return;
    setState("adding");
    try {
      const r = await fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: [], dfy: { pkg: c.name, ownership: own } }) });
      const j = (await r.json()) as { ok?: boolean; pricing?: CartPricing };
      if (!r.ok || !j.ok || !j.pricing?.dfy) { setState("error"); return; }
      cartActions.setDfy({ pkg: c.name, own: own && c.ownershipEnabled }); setState("added"); onAdded?.();
    } catch { setState("error"); }
  }
  const n = (x: number) => x.toLocaleString("en-US");
  return (
    <div className="rounded-2xl border border-sand-300 bg-white p-3 text-sm">
      <p className="flex items-baseline justify-between gap-2"><span className="font-bold text-forest-900">DFY Outbound · {c.name}</span><span className="font-bold text-forest-900">{usd(c.monthlyCents).replace(/\.00$/, "")}/mo</span></p>
      <p className="mt-1 text-forest-700">{n(c.leads)} leads · {n(c.initialSends)} initial sends · {c.followups} follow-ups</p>
      <p className="text-xs text-forest-700">Estimated {c.domains} domains, {c.inboxes} inboxes · {c.reporting} reports</p>
      {c.ownershipEnabled && <label className="mt-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={own} onChange={(e) => setOwn(e.target.checked)} className="accent-purple-600" />Own my infrastructure (+{usd(c.ownershipCents).replace(/\.00$/, "")} one-time)</label>}
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={add} disabled={state === "adding" || state === "added"} className="rounded-full bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-70">{state === "added" ? "Added" : state === "adding" ? "Adding…" : "Add to Cart"}</button>
        <Link href="/dfy-outbound" className="text-xs font-semibold text-forest-700 underline underline-offset-2">View Details</Link>
        {state === "added" && <Link href="/cart" className="text-xs font-semibold text-purple-700 underline underline-offset-2">View cart</Link>}
      </div>
      {state === "error" && <p role="alert" className="mt-2 text-xs text-red-800">I couldn&rsquo;t add that to your cart. Please try again.</p>}
    </div>
  );
}
