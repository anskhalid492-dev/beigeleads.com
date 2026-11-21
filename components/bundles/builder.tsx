"use client";
import Link from "next/link";
import { Check, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { VolumeLadder } from "@/components/cart/volume-ladder";
import { Flag } from "@/components/shared/db-icon";
import { Button } from "@/components/ui/button";
import { cartActions } from "@/lib/cart/client";
import { MAX_CART_ITEMS, type CartPricing } from "@/lib/cart/model";
import { trackCart } from "@/lib/cart/track";
import { formatUsd } from "@/lib/catalog";
import type { BuilderProduct } from "@/lib/bundles/builder";

type Facet = { slug: string; name: string };
const MIN_PICK = 2;
const field = "h-11 w-full rounded-xl border border-sand-300 bg-white px-3 text-base text-forest-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600";

/** Build Your Own Bundle. The browser keeps only product + package; the price shown is the server's price of that cart (same Buy More, Save More rules as the cart and checkout). */
export function BundleBuilder({ countries, categories }: { countries: Facet[]; categories: Facet[] }) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<BuilderProduct[]>([]);
  const [more, setMore] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error" | "off">("loading");
  const [pick, setPick] = useState<Record<string, string>>({}); // slug -> chosen package, for cards not yet added
  const [sel, setSel] = useState<{ p: BuilderProduct; pkg: string }[]>([]);
  const [price, setPrice] = useState<{ key: string; data: CartPricing | null } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const seq = useRef(0);

  const load = useCallback(async (offset: number) => {
    const id = ++seq.current;
    if (offset === 0) setState("loading");
    try {
      const u = new URLSearchParams({ q, country, category, offset: String(offset) });
      const r = await fetch(`/api/bundles/search?${u}`);
      const j = (await r.json()) as { ok: boolean; items: BuilderProduct[]; hasMore: boolean; disabled?: boolean };
      if (id !== seq.current) return;
      if (!r.ok || !j.ok) throw new Error("bad");
      setItems((cur) => (offset === 0 ? j.items : [...cur, ...j.items]));
      setMore(j.hasMore);
      setState(j.disabled ? "off" : "ready");
    } catch { if (id === seq.current) setState("error"); }
  }, [q, country, category]);

  useEffect(() => {
    const t = setTimeout(() => { void load(0); }, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const selKey = JSON.stringify(sel.map((s) => [s.p.slug, s.pkg]));
  useEffect(() => {
    if (sel.length === 0) return;
    const ac = new AbortController();
    fetch("/api/cart/price", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: sel.map((s) => ({ slug: s.p.slug, pkg: s.pkg })) }), signal: ac.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ ok: boolean; pricing: CartPricing }>) : Promise.reject(new Error("price"))))
      .then((j) => setPrice({ key: selKey, data: j.ok ? j.pricing : null }))
      .catch((e: Error) => { if (e.name !== "AbortError") setPrice({ key: selKey, data: null }); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selKey]);
  const pricing = sel.length > 0 && price?.key === selKey ? price.data : null;
  const loadingPrice = sel.length > 0 && price?.key !== selKey;

  const chosen = (p: BuilderProduct) => sel.find((s) => s.p.slug === p.slug)?.pkg ?? pick[p.slug] ?? (p.packages.find((k) => k.name === "Starter") ?? p.packages[0]).name;
  function toggle(p: BuilderProduct) {
    setMsg(null);
    if (sel.some((s) => s.p.slug === p.slug)) { setSel(sel.filter((s) => s.p.slug !== p.slug)); return; }
    if (sel.length >= MAX_CART_ITEMS) { setMsg({ ok: false, text: `A bundle can hold up to ${MAX_CART_ITEMS} databases.` }); return; }
    setSel([...sel, { p, pkg: chosen(p) }]);
  }
  function setPkg(p: BuilderProduct, pkg: string) {
    if (sel.some((s) => s.p.slug === p.slug)) setSel(sel.map((s) => (s.p.slug === p.slug ? { ...s, pkg } : s)));
    else setPick({ ...pick, [p.slug]: pkg });
  }
  function addToCart() {
    const r = cartActions.addMany(sel.map((s) => ({ slug: s.p.slug, pkg: s.pkg })));
    if (r === "full") { setMsg({ ok: false, text: `Your cart holds up to ${MAX_CART_ITEMS} lists. Check out or remove some first.` }); return; }
    trackCart("add_to_cart", sel.length);
    setMsg({ ok: true, text: `${sel.length} databases added to your cart.` });
    setSel([]);
  }
  const ready = sel.length >= MIN_PICK;
  const total = pricing?.totalCents ?? 0;

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="pb-24 lg:pb-0">
        <div className="grid gap-3 sm:grid-cols-[1fr_11rem_11rem]">
          <label className="relative block">
            <span className="sr-only">Search databases</span>
            <Search className="pointer-events-none absolute left-3 top-3.5 size-5 text-forest-500" aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search databases, e.g. dentists" className={`${field} pl-10`} />
          </label>
          <label><span className="sr-only">Country</span>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={field}><option value="">All countries</option>{countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          </label>
          <label><span className="sr-only">Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={field}><option value="">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
          </label>
        </div>

        <div aria-busy={state === "loading"} className={`mt-5 transition-opacity duration-150 ${state === "loading" ? "opacity-60" : ""}`}>
          {state === "off" && <p role="status" className="rounded-2xl border border-sand-200 bg-white p-5 text-sm">The bundle builder is switched off right now. You can still buy single databases from <Link href="/lists" className="font-semibold underline">All lists</Link>.</p>}
          {state === "error" && <p role="alert" className="rounded-2xl border border-sand-300 bg-white p-5 text-sm">We could not load the databases. <button type="button" className="font-semibold underline" onClick={() => void load(0)}>Try again</button></p>}
          {state === "ready" && items.length === 0 && <p role="status" className="rounded-2xl border border-sand-200 bg-white p-5 text-sm">No databases match this search. Try fewer words or clear a filter. Need something that is not listed? <Link href="/custom-list" className="font-semibold underline">Request a custom list</Link>.</p>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => {
              const on = sel.some((s) => s.p.slug === p.slug);
              const cur = chosen(p);
              return (
                <li key={p.slug} className={`rounded-2xl border bg-white p-4 transition-colors ${on ? "border-forest-900 shadow-[inset_0_0_0_1px_#0F2A1D]" : "border-sand-200"}`}>
                  <h3 className="font-bold leading-snug text-forest-900"><Link href={`/lists/${p.slug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-purple-600">{p.name}</Link></h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs">{p.countryCode && <Flag code={p.countryCode} className="h-3 w-4" />}{p.categoryName}{p.coverage ? ` · ${p.coverage}` : ""}</p>
                  <fieldset className="mt-3">
                    <legend className="sr-only">Package for {p.name}</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {p.packages.map((k) => (
                        <label key={k.name} className="cursor-pointer">
                          <input type="radio" name={`pk-${p.slug}`} value={k.name} checked={k.name === cur} onChange={() => setPkg(p, k.name)} className="peer sr-only" />
                          <span className="block rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs transition-colors peer-checked:border-forest-900 peer-checked:bg-forest-100 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-purple-600">
                            <span className="font-bold text-forest-900">{k.name}</span> {formatUsd(k.priceCents)}{k.records > 0 ? <span className="block text-forest-500">{k.records.toLocaleString("en-US")} contacts</span> : null}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <Button type="button" size="sm" variant={on ? "secondary" : "primary"} className="mt-3 w-full" onClick={() => toggle(p)} aria-pressed={on}>
                    {on ? <><Check className="size-4" aria-hidden /> In your bundle. Remove</> : <><Plus className="size-4" aria-hidden /> Add to bundle</>}
                  </Button>
                </li>
              );
            })}
          </ul>
          {state === "ready" && more && <div className="mt-5 text-center"><Button type="button" variant="secondary" onClick={() => void load(items.length)}>Show more databases</Button></div>}
        </div>
      </div>

      <aside id="your-bundle" aria-label="Your bundle" className="lg:sticky lg:top-28">
        <div className="rounded-3xl border border-sand-200 bg-white p-6 shadow-[0_20px_50px_-30px_rgba(15,42,29,0.35)]">
          <h3 className="text-xl font-bold text-forest-900">Your Bundle</h3>
          {sel.length === 0 ? (
            <p className="mt-3 text-sm">Pick at least {MIN_PICK} databases on the left. Your total and any multi-database savings appear here.</p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-sand-200 text-sm">
                {sel.map((s) => {
                  const line = pricing?.lines.find((l) => l.slug === s.p.slug);
                  const cents = line?.priceCents ?? s.p.packages.find((k) => k.name === s.pkg)?.priceCents ?? 0;
                  return (
                    <li key={s.p.slug} className="flex items-start justify-between gap-3 py-2.5">
                      <span className="min-w-0"><span className="block font-semibold text-forest-900">{s.p.name}</span><span className="text-xs text-forest-500">{s.pkg} package</span></span>
                      <span className="flex shrink-0 items-center gap-2"><span className="font-semibold text-forest-900">{formatUsd(cents)}</span>
                        <button type="button" onClick={() => toggle(s.p)} aria-label={`Remove ${s.p.name} from your bundle`} className="grid size-7 place-items-center rounded-full hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600"><X className="size-4" aria-hidden /></button></span>
                    </li>
                  );
                })}
              </ul>
              <dl className={`mt-3 space-y-1.5 border-t border-sand-200 pt-3 text-sm transition-opacity ${loadingPrice ? "opacity-60" : ""}`} aria-busy={loadingPrice}>
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{pricing ? formatUsd(pricing.subtotalCents) : "..."}</dd></div>
                {pricing?.applied.map((a) => <div key={`${a.source}-${a.title}`} className="flex justify-between gap-3 text-forest-700"><dt>{a.title}{a.kind === "percent" && a.percent > 0 ? ` (${a.percent}%)` : ""}</dt><dd className="font-semibold">&minus;{formatUsd(a.cents)}</dd></div>)}
                <div className="flex items-end justify-between border-t border-sand-200 pt-3"><dt className="font-bold text-forest-900">Total</dt><dd className="display text-4xl leading-none text-forest-900">{pricing ? formatUsd(total) : "..."}</dd></div>
              </dl>
              {pricing && <VolumeLadder volume={pricing.volume} />}
              {!pricing && !loadingPrice && <p role="alert" className="mt-3 text-sm">We could not price your bundle. Check your connection and change a package to try again.</p>}
              <p className="mt-3 text-xs">Savings are the same Buy More, Save More discount your cart and checkout apply. Codes are entered in the cart.</p>
            </>
          )}
          <Button type="button" size="lg" className="mt-5 w-full" disabled={!ready || !pricing} onClick={addToCart}><ShoppingCart className="size-4" aria-hidden /> Add Bundle to Cart</Button>
          {sel.length > 0 && !ready && <p className="mt-2 text-center text-xs">Add {MIN_PICK - sel.length} more to build a bundle.</p>}
          {msg && (
            <p role={msg.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${msg.ok ? "bg-forest-100 text-forest-900" : "bg-sand-100 text-forest-900"}`}>
              {msg.text} {msg.ok && <Link href="/cart" className="font-semibold underline">View cart</Link>}
            </p>
          )}
        </div>
      </aside>

      {sel.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-sand-50/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <div className="min-w-0 flex-1"><p className="text-xs">{sel.length} selected</p><p className="display text-2xl leading-none text-forest-900">{pricing ? formatUsd(total) : "..."}</p></div>
            <Button asChild size="md"><a href="#your-bundle">Review bundle</a></Button>
          </div>
        </div>
      )}
    </div>
  );
}
