"use client";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { STACKING_RULES, promoCents, type Promo } from "@/lib/promos/engine";
import { savePromoAction } from "./actions";

export type CatalogLite = { products: { slug: string; name: string; categorySlug: string; packages: { name: string; priceCents: number }[] }[]; categories: { slug: string; name: string }[] };
export type FormState = {
  name: string; title: string; description: string; kind: "percent" | "fixed"; value: string; mode: "code" | "automatic"; code: string;
  productSlugs: string[]; categorySlugs: string[]; packageNames: string[]; minCart: string; maxDiscount: string;
  startsLocal: string; endsLocal: string; timezone: string; usageLimit: string; perCustomerLimit: string;
  eligibility: "everyone" | "first" | "partners"; combinable: boolean; bannerPlaces: string[]; status: "draft" | "active" | "paused";
};
export const EMPTY: FormState = {
  name: "", title: "", description: "", kind: "percent", value: "20", mode: "code", code: "", productSlugs: [], categorySlugs: [], packageNames: [],
  minCart: "", maxDiscount: "", startsLocal: "", endsLocal: "", timezone: "UTC", usageLimit: "", perCustomerLimit: "", eligibility: "everyone", combinable: false, bannerPlaces: [], status: "draft",
};
const TZ = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Singapore", "Australia/Sydney"];
const TIERS = ["Starter", "Professional", "Complete"];
const PLACES: [string, string][] = [["home", "Homepage"], ["lists", "Lists directory"], ["product", "Eligible product pages"], ["cart", "Cart page"]];
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRESETS: { label: string; hint: string; set: Partial<FormState>; focus?: "products" | "categories" | "packages" }[] = [
  { label: "Percentage discount", hint: "A percent off, such as 20%", set: { kind: "percent", value: "20", mode: "code" } },
  { label: "Fixed amount", hint: "A dollar amount off, such as $25", set: { kind: "fixed", value: "25", mode: "code" } },
  { label: "Specific lists", hint: "Choose one or more databases", set: { productSlugs: [] }, focus: "products" },
  { label: "Industry category", hint: "All lists in chosen industries", set: { categorySlugs: [] }, focus: "categories" },
  { label: "Package tiers", hint: "Starter, Professional or Complete", set: { packageNames: [] }, focus: "packages" },
  { label: "Whole cart", hint: "Every list in the cart", set: { productSlugs: [], categorySlugs: [], packageNames: [] } },
  { label: "Minimum order", hint: "Spend $200, get $30 off", set: { kind: "fixed", value: "30", minCart: "200", mode: "code" } },
  { label: "Automatic", hint: "Applies by itself, no code", set: { mode: "automatic", code: "", eligibility: "everyone" } },
  { label: "Promo code", hint: "Customer enters a code", set: { mode: "code" } },
  { label: "First purchase", hint: "Only buyers with no paid order", set: { eligibility: "first", mode: "code" } },
  { label: "Partner offer", hint: "Verified Data Reseller Partners", set: { eligibility: "partners", mode: "code", kind: "percent", value: "50" } },
];

const field = "mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-base font-normal text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const lab = "block text-sm font-semibold text-forest-900";
const card = "rounded-2xl border border-sand-200 bg-white p-5";

function toPromo(s: FormState): Promo {
  const v = Number(s.value) || 0;
  return {
    id: 0, name: s.name, title: s.title, code: s.mode === "code" ? s.code.trim().toUpperCase() : null, description: s.description, kind: s.kind, value: s.kind === "fixed" ? Math.round(v * 100) : Math.round(v),
    productSlugs: s.productSlugs, categorySlugs: s.categorySlugs, packageNames: s.packageNames, minCartCents: Math.round((Number(s.minCart) || 0) * 100), maxDiscountCents: s.maxDiscount ? Math.round(Number(s.maxDiscount) * 100) : null,
    startsAt: null, endsAt: null, usageLimit: null, perCustomerLimit: null, firstPurchaseOnly: s.eligibility === "first", partnerOnly: s.eligibility === "partners", automatic: s.mode === "automatic", combinable: s.combinable, status: "active", bannerPlaces: s.bannerPlaces,
  };
}

function summary(s: FormState, cat: CatalogLite): string[] {
  const out: string[] = [];
  const amount = s.kind === "percent" ? `${s.value || "0"}% off` : `$${s.value || "0"} off`;
  const scope = [
    s.productSlugs.length ? `${s.productSlugs.length} chosen list${s.productSlugs.length === 1 ? "" : "s"}` : "",
    s.categorySlugs.length ? `industries: ${s.categorySlugs.map((c) => cat.categories.find((x) => x.slug === c)?.name ?? c).join(", ")}` : "",
    s.packageNames.length ? `packages: ${s.packageNames.join(", ")}` : "",
  ].filter(Boolean);
  out.push(`${amount} ${scope.length ? scope.join("; ") : "the whole cart"}.`);
  out.push(s.mode === "automatic" ? "Applies automatically when the conditions are met. No code needed." : `Customers enter code ${s.code.trim().toUpperCase() || "(not set yet)"}. Codes are not case-sensitive.`);
  if (s.minCart) out.push(`Cart must be at least $${s.minCart}.`);
  if (s.maxDiscount) out.push(`Never takes off more than $${s.maxDiscount}.`);
  out.push(s.eligibility === "first" ? "Only buyers who have no paid order yet." : s.eligibility === "partners" ? "Only verified Data Reseller Partners (their own email)." : "Open to every buyer.");
  if (s.usageLimit) out.push(`Limited to ${s.usageLimit} uses in total.`);
  if (s.perCustomerLimit) out.push(`${s.perCustomerLimit} use${s.perCustomerLimit === "1" ? "" : "s"} per customer (by email).`);
  out.push(s.combinable ? "Can be combined with other combinable promotions." : "Is never combined with another promotion.");
  return out;
}

export function PromoForm({ catalog, initial, id }: { catalog: CatalogLite; initial?: FormState; id?: number }) {
  const [s, setS] = useState<FormState>(initial ?? EMPTY);
  const [focus, setFocus] = useState<string | null>(null);
  const [res, run, pending] = useActionState(savePromoAction, null as { ok: true; message: string } | { ok: false; error: string } | null);
  const set = (p: Partial<FormState>) => setS((x) => ({ ...x, ...p }));
  const toggle = (k: "productSlugs" | "categorySlugs" | "packageNames" | "bannerPlaces", v: string) => setS((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  const [sample, setSample] = useState(`${catalog.products[0]?.slug ?? ""}|${catalog.products[0]?.packages[catalog.products[0].packages.length - 1]?.name ?? ""}`);
  const preview = useMemo(() => {
    const [slug, pkg] = sample.split("|");
    const p = catalog.products.find((x) => x.slug === slug);
    const price = p?.packages.find((x) => x.name === pkg)?.priceCents ?? 0;
    if (!p || !price) return null;
    const line = [{ slug: p.slug, categorySlug: p.categorySlug, packageName: pkg, priceCents: price }];
    const off = promoCents(toPromo(s), line, [price], price)[0];
    return { name: p.name, pkg, price, off, total: price - off };
  }, [s, sample, catalog]);

  const ring = (k: string) => (focus === k ? "ring-2 ring-purple-600" : "");
  return (
    <form action={run} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <div className="space-y-5">
        <section className={card} aria-labelledby="p-start">
          <h2 id="p-start" className="text-lg font-bold text-forest-900">Start from a template</h2>
          <p className="mt-1 text-sm">Pick what you want to build. It only fills in sensible defaults; every field stays editable.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" title={p.hint} onClick={() => { set(p.set); setFocus(p.focus ?? null); }} className="rounded-full border border-sand-300 bg-sand-50 px-3 py-1.5 text-sm font-semibold text-forest-900 hover:border-purple-600 focus-visible:outline-2 focus-visible:outline-purple-600">{p.label}</button>
            ))}
          </div>
        </section>

        <section className={card} aria-labelledby="p-basic">
          <h2 id="p-basic" className="text-lg font-bold text-forest-900">Basics</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={lab}>Campaign name (internal)<input name="name" value={s.name} onChange={(e) => set({ name: e.target.value })} maxLength={80} placeholder="Black Friday 2026" className={field} required /></label>
            <label className={lab}>Customer-facing title<input name="title" value={s.title} onChange={(e) => set({ title: e.target.value })} maxLength={60} placeholder="Save 20% on selected databases" className={field} required /></label>
          </div>
          <label className={`${lab} mt-4`}>Description (optional)<textarea name="description" value={s.description} onChange={(e) => set({ description: e.target.value })} rows={2} maxLength={300} className={field} /></label>
        </section>

        <section className={card} aria-labelledby="p-disc">
          <h2 id="p-disc" className="text-lg font-bold text-forest-900">Discount</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={lab}>Type
              <select name="kind" value={s.kind} onChange={(e) => set({ kind: e.target.value as FormState["kind"] })} className={field}><option value="percent">Percentage off</option><option value="fixed">Fixed amount off</option></select>
            </label>
            <label className={lab}>{s.kind === "percent" ? "Percent off" : "Dollars off"}
              <input name="value" value={s.value} onChange={(e) => set({ value: e.target.value })} inputMode="decimal" className={field} required />
              {s.kind === "percent" && <span className="mt-2 flex gap-2">{[10, 20, 30, 50].map((n) => <button key={n} type="button" onClick={() => set({ value: String(n) })} className="rounded-lg border border-sand-300 px-2 py-0.5 text-xs font-semibold">{n}%</button>)}</span>}
              {s.kind === "fixed" && <span className="mt-2 flex gap-2">{[5, 10, 25, 50].map((n) => <button key={n} type="button" onClick={() => set({ value: String(n) })} className="rounded-lg border border-sand-300 px-2 py-0.5 text-xs font-semibold">${n}</button>)}</span>}
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className={lab}>How customers get it</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" name="mode" value="code" checked={s.mode === "code"} onChange={() => set({ mode: "code" })} /> Promo code</label>
              <label className="flex items-center gap-2"><input type="radio" name="mode" value="automatic" checked={s.mode === "automatic"} onChange={() => set({ mode: "automatic" })} /> Automatic (no code)</label>
            </div>
          </fieldset>
          {s.mode === "code" && (
            <label className={`${lab} mt-4`}>Promo code
              <span className="mt-1 flex gap-2">
                <input name="code" value={s.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} maxLength={30} placeholder="WELCOME20" className={`${field} mt-0 font-mono uppercase`} />
                <Button type="button" variant="secondary" size="sm" onClick={() => { const A = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; const b = crypto.getRandomValues(new Uint8Array(6)); set({ code: `SAVE${Array.from(b, (x) => A[x % A.length]).join("").slice(0, 5)}` }); }}>Generate</Button>
              </span>
              <span className="mt-1 block text-xs font-normal">Letters, numbers, - and _. Not case-sensitive. Examples: WELCOME20, BLACKFRIDAY30.</span>
            </label>
          )}
        </section>

        <section className={card} aria-labelledby="p-scope">
          <h2 id="p-scope" className="text-lg font-bold text-forest-900">Applies to</h2>
          <p className="mt-1 text-sm">Tick nothing to cover the whole cart. When you tick several groups, a list must match all of them.</p>
          <fieldset className={`mt-4 rounded-xl p-3 ${ring("products")}`}><legend className={lab}>Specific lists</legend>
            <div className="mt-1 grid gap-1 text-sm sm:grid-cols-2">{catalog.products.map((p) => <label key={p.slug} className="flex items-center gap-2"><input type="checkbox" name="productSlugs" value={p.slug} checked={s.productSlugs.includes(p.slug)} onChange={() => toggle("productSlugs", p.slug)} /> {p.name}</label>)}</div>
          </fieldset>
          <fieldset className={`mt-3 rounded-xl p-3 ${ring("categories")}`}><legend className={lab}>Industries</legend>
            <div className="mt-1 grid gap-1 text-sm sm:grid-cols-3">{catalog.categories.map((c) => <label key={c.slug} className="flex items-center gap-2"><input type="checkbox" name="categorySlugs" value={c.slug} checked={s.categorySlugs.includes(c.slug)} onChange={() => toggle("categorySlugs", c.slug)} /> {c.name}</label>)}</div>
          </fieldset>
          <fieldset className={`mt-3 rounded-xl p-3 ${ring("packages")}`}><legend className={lab}>Package tiers</legend>
            <div className="mt-1 flex flex-wrap gap-4 text-sm">{TIERS.map((t) => <label key={t} className="flex items-center gap-2"><input type="checkbox" name="packageNames" value={t} checked={s.packageNames.includes(t)} onChange={() => toggle("packageNames", t)} /> {t}</label>)}</div>
          </fieldset>
        </section>

        <section className={card} aria-labelledby="p-cond">
          <h2 id="p-cond" className="text-lg font-bold text-forest-900">Conditions and limits</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className={lab}>Minimum cart value ($)<input name="minCart" value={s.minCart} onChange={(e) => set({ minCart: e.target.value })} inputMode="decimal" placeholder="None" className={field} /></label>
            <label className={lab}>Maximum discount ($)<input name="maxDiscount" value={s.maxDiscount} onChange={(e) => set({ maxDiscount: e.target.value })} inputMode="decimal" placeholder="No cap" className={field} /></label>
            <label className={lab}>Total usage limit<input name="usageLimit" value={s.usageLimit} onChange={(e) => set({ usageLimit: e.target.value })} inputMode="numeric" placeholder="Unlimited" className={field} /></label>
            <label className={lab}>Uses per customer (by email)<input name="perCustomerLimit" value={s.perCustomerLimit} onChange={(e) => set({ perCustomerLimit: e.target.value })} inputMode="numeric" placeholder="Unlimited" className={field} /></label>
          </div>
          <fieldset className="mt-4"><legend className={lab}>Who can use it</legend>
            <div className="mt-2 flex flex-wrap gap-4 text-sm">
              {([["everyone", "Everyone"], ["first", "First purchase only"], ["partners", "Verified Data Reseller Partners only"]] as const).map(([v, l]) => <label key={v} className="flex items-center gap-2"><input type="radio" name="eligibility" value={v} checked={s.eligibility === v} onChange={() => set({ eligibility: v })} /> {l}</label>)}
            </div>
            <p className="mt-1 text-xs">First purchase = no paid order with that email. Partner = the email of an approved, active partner. Both are checked on the server at checkout.</p>
          </fieldset>
          <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" name="combinable" checked={s.combinable} onChange={(e) => set({ combinable: e.target.checked })} className="mt-1" /> <span><strong className="text-forest-900">Can be combined</strong> with other promotions that are also marked combinable. Off by default.</span></label>
        </section>

        <section className={card} aria-labelledby="p-sched">
          <h2 id="p-sched" className="text-lg font-bold text-forest-900">Schedule</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <label className={lab}>Time zone<select name="timezone" value={s.timezone} onChange={(e) => set({ timezone: e.target.value })} className={field}>{TZ.map((z) => <option key={z}>{z}</option>)}</select></label>
            <label className={lab}>Starts<input type="datetime-local" name="startsLocal" value={s.startsLocal} onChange={(e) => set({ startsLocal: e.target.value })} className={field} /></label>
            <label className={lab}>Ends<input type="datetime-local" name="endsLocal" value={s.endsLocal} onChange={(e) => set({ endsLocal: e.target.value })} className={field} /></label>
          </div>
          <p className="mt-2 text-xs">Leave empty for no start or end. Times are in the chosen time zone and stored in UTC. An active promotion with a future start date shows as Scheduled.</p>
        </section>

        <section className={card} aria-labelledby="p-banner">
          <h2 id="p-banner" className="text-lg font-bold text-forest-900">Show a banner (optional)</h2>
          <div className="mt-2 flex flex-wrap gap-4 text-sm">{PLACES.map(([v, l]) => <label key={v} className="flex items-center gap-2"><input type="checkbox" name="bannerPlaces" value={v} checked={s.bannerPlaces.includes(v)} onChange={() => toggle("bannerPlaces", v)} /> {l}</label>)}</div>
          <p className="mt-2 text-xs">A banner shows only while the promotion is really active and, on product pages, only on lists it covers. There are no countdowns or fake scarcity messages.</p>
        </section>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24" aria-label="Preview">
        <section className={card}>
          <h2 className="text-lg font-bold text-forest-900">Live preview</h2>
          <label className={`${lab} mt-2`}>Try it on
            <select value={sample} onChange={(e) => setSample(e.target.value)} className={field}>
              {catalog.products.flatMap((p) => p.packages.map((k) => <option key={`${p.slug}|${k.name}`} value={`${p.slug}|${k.name}`}>{p.name} · {k.name} ({usd(k.priceCents)})</option>))}
            </select>
          </label>
          {preview && (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Original</dt><dd>{usd(preview.price)}</dd></div>
              <div className="flex justify-between text-forest-700"><dt>{s.title || "Discount"}</dt><dd className="font-semibold">{preview.off > 0 ? `−${usd(preview.off)}` : "$0.00"}</dd></div>
              <div className="flex justify-between border-t border-sand-200 pt-2 text-base font-bold text-forest-900"><dt>Customer pays</dt><dd>{usd(preview.total)}</dd></div>
              {preview.off === 0 && <p className="pt-1 text-xs">Not applied to this list (check the scope and minimum cart value).</p>}
            </dl>
          )}
        </section>
        <section className={card}>
          <h2 className="text-lg font-bold text-forest-900">Who gets what</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{summary(s, catalog).map((l) => <li key={l}>{l}</li>)}</ul>
        </section>
        <section className={card}>
          <h2 className="text-lg font-bold text-forest-900">Status</h2>
          <select name="status" value={s.status} onChange={(e) => set({ status: e.target.value as FormState["status"] })} className={field}>
            <option value="draft">Draft (not live)</option><option value="active">Active</option><option value="paused">Paused</option>
          </select>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save changes" : "Create promotion"}</Button>
            <Button asChild variant="secondary"><Link href="/admin/promotions">Cancel</Link></Button>
          </div>
          {res && <p role={res.ok ? "status" : "alert"} className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${res.ok ? "bg-forest-100 text-forest-900" : "bg-red-100 text-red-900"}`}>{res.ok ? res.message : res.error}</p>}
        </section>
        <details className={card}>
          <summary className="cursor-pointer text-sm font-bold text-forest-900">How discounts combine</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{STACKING_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        </details>
      </aside>
    </form>
  );
}
