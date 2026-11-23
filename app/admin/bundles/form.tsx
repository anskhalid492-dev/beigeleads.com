"use client";
import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { saveBundleAction, searchProductsAction, type PickProduct } from "./actions";

export type BundleFormState = {
  id?: number; name: string; slug: string; shortDescription: string; description: string; categorySlug: string; label: string; image: string;
  items: { slug: string; pkg: string; name: string; priceCents: number }[]; priceMode: "percent" | "fixed"; discountPercent: string; fixedPrice: string;
  featured: boolean; status: "draft" | "published"; excluded: string[]; seoTitle: string; metaDescription: string; sortOrder: string;
};
export const EMPTY_BUNDLE: BundleFormState = { name: "", slug: "", shortDescription: "", description: "", categorySlug: "", label: "", image: "", items: [], priceMode: "percent", discountPercent: "15", fixedPrice: "", featured: false, status: "draft", excluded: [], seoTitle: "", metaDescription: "", sortOrder: "0" };
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inp = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900 focus-visible:outline-2 focus-visible:outline-purple-600";
const L = ({ t, children, hint }: { t: string; children: React.ReactNode; hint?: string }) => <label className="block text-sm font-semibold text-forest-900">{t}{children}{hint && <span className="mt-1 block text-xs font-normal text-forest-700">{hint}</span>}</label>;

export function BundleForm({ initial, categories }: { initial: BundleFormState; categories: { slug: string; name: string }[] }) {
  const [s, setS] = useState(initial);
  const [r, run, pending] = useActionState(saveBundleAction, null as { ok: true; message: string } | { ok: false; error: string } | null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<PickProduct[] | null>(null);
  const [searching, start] = useTransition();
  const [ex, setEx] = useState("");
  const set = <K extends keyof BundleFormState>(k: K, v: BundleFormState[K]) => setS((p) => ({ ...p, [k]: v }));
  const list = s.items.reduce((n, i) => n + i.priceCents, 0);
  const price = s.priceMode === "percent" ? Math.round(list * (1 - (Number(s.discountPercent) || 0) / 100)) : Math.round((Number(s.fixedPrice) || 0) * 100);
  const valid = s.items.length >= 2 && price > 0 && price < list;
  useEffect(() => { start(async () => setFound(await searchProductsAction(""))); }, []);
  const search = () => start(async () => setFound(await searchProductsAction(q)));
  const add = (p: PickProduct, pkg: string) => {
    const k = p.packages.find((x) => x.name === pkg); if (!k) return;
    setS((x) => ({ ...x, items: [...x.items.filter((i) => i.slug !== p.slug), { slug: p.slug, pkg, name: p.name, priceCents: k.priceCents }] }));
  };

  return (
    <form action={run} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {s.id && <input type="hidden" name="id" value={s.id} />}
      <input type="hidden" name="items" value={JSON.stringify(s.items.map(({ slug, pkg }) => ({ slug, pkg })))} />
      <input type="hidden" name="excluded" value={JSON.stringify(s.excluded)} />
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Details</h2>
          <L t="Bundle name"><input name="name" required maxLength={80} value={s.name} onChange={(e) => set("name", e.target.value)} className={inp} /></L>
          <L t="URL name" hint="Letters, numbers and dashes. Empty = made from the name. The page is /bundles/<url name>."><input name="slug" maxLength={80} value={s.slug} onChange={(e) => set("slug", e.target.value)} className={inp} /></L>
          <L t="Short description" hint="Shown on cards (up to 200 characters)."><input name="shortDescription" maxLength={200} value={s.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className={inp} /></L>
          <L t="Description" hint="Blank line = new paragraph. Only describe what the databases really contain."><textarea name="description" rows={5} maxLength={4000} value={s.description} onChange={(e) => set("description", e.target.value)} className={inp} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L t="Bundle category"><select name="categorySlug" value={s.categorySlug} onChange={(e) => set("categorySlug", e.target.value)} className={inp}><option value="">No category</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></L>
            <L t="Label" hint="For example Popular or Best Value. Your choice, not a sales ranking."><input name="label" maxLength={24} value={s.label} onChange={(e) => set("label", e.target.value)} className={inp} /></L>
          </div>
          <L t="Image address" hint="Upload in Admin > Media and paste the /media/... address."><input name="image" value={s.image} onChange={(e) => set("image", e.target.value)} className={inp} /></L>
        </section>

        <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Included databases</h2>
          <p className="text-sm">Pick real catalog products and the package of each. Nothing is copied; the bundle only points to them. 2 to 12 databases.</p>
          {s.items.length > 0 ? (
            <ul className="divide-y divide-sand-200 rounded-xl border border-sand-200">
              {s.items.map((i) => (
                <li key={i.slug} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0"><span className="block truncate font-semibold text-forest-900">{i.name}</span><span className="text-xs">{i.pkg} · {usd(i.priceCents)}</span></span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setS((x) => ({ ...x, items: x.items.filter((y) => y.slug !== i.slug) }))}>Remove</Button>
                </li>
              ))}
            </ul>
          ) : <p className="rounded-xl bg-sand-100 p-3 text-sm">No databases yet. Search below.</p>}
          <div className="flex gap-2">
            <input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} placeholder="Search by name, category or country" className={inp} />
            <Button type="button" variant="secondary" onClick={search} disabled={searching}>{searching ? "…" : "Search"}</Button>
          </div>
          {found && (found.length === 0 ? <p className="text-sm">No product matches.</p> : (
            <ul className="space-y-2">
              {found.map((p) => (
                <li key={p.slug} className="rounded-xl border border-sand-200 p-3 text-sm">
                  <p className="font-semibold text-forest-900">{p.name} <span className="font-normal text-forest-700">· {p.category} · {p.status}</span></p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.packages.map((k) => <Button key={k.name} type="button" size="sm" variant={s.items.some((i) => i.slug === p.slug && i.pkg === k.name) ? "primary" : "secondary"} onClick={() => add(p, k.name)}>{k.name} · {usd(k.priceCents)}</Button>)}
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </section>

        <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Price</h2>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-forest-900">
            <label className="flex items-center gap-2"><input type="radio" name="priceMode" value="percent" checked={s.priceMode === "percent"} onChange={() => set("priceMode", "percent")} /> Percent off the total</label>
            <label className="flex items-center gap-2"><input type="radio" name="priceMode" value="fixed" checked={s.priceMode === "fixed"} onChange={() => set("priceMode", "fixed")} /> Fixed bundle price</label>
          </div>
          {s.priceMode === "percent"
            ? <L t="Discount %"><input name="discountPercent" type="number" min={0} max={90} value={s.discountPercent} onChange={(e) => set("discountPercent", e.target.value)} className={inp} /></L>
            : <L t="Bundle price (USD)" hint="Must be lower than the databases bought separately."><input name="fixedPrice" type="number" min={0} step="0.01" value={s.fixedPrice} onChange={(e) => set("fixedPrice", e.target.value)} className={inp} /></L>}
        </section>

        <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Exclusions</h2>
          <p className="text-sm">Product URL names that cannot be in the same order as this bundle (for example a list that overlaps it).</p>
          <div className="flex flex-wrap gap-2">{s.excluded.map((x) => <button key={x} type="button" onClick={() => set("excluded", s.excluded.filter((y) => y !== x))} className="rounded-full bg-sand-200 px-3 py-1 text-xs font-semibold text-forest-900">{x} ✕</button>)}</div>
          <div className="flex gap-2">
            <input aria-label="Product URL name" value={ex} onChange={(e) => setEx(e.target.value)} placeholder="product-url-name" className={inp} />
            <Button type="button" variant="secondary" onClick={() => { const v = ex.trim().toLowerCase(); if (v && !s.excluded.includes(v)) set("excluded", [...s.excluded, v]); setEx(""); }}>Add</Button>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-sand-200 bg-white p-5">
          <h2 className="text-base font-bold text-forest-900">Search results</h2>
          <L t="SEO title"><input name="seoTitle" maxLength={70} value={s.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={inp} /></L>
          <L t="Meta description"><textarea name="metaDescription" rows={2} maxLength={170} value={s.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} className={inp} /></L>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-sand-200 bg-white p-5 lg:sticky lg:top-20">
        <h2 className="text-base font-bold text-forest-900">Summary</h2>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Databases</dt><dd>{s.items.length}</dd></div>
          <div className="flex justify-between"><dt>Bought separately</dt><dd>{usd(list)}</dd></div>
          <div className="flex justify-between font-bold text-forest-900"><dt>Bundle price</dt><dd>{usd(Math.max(0, price))}</dd></div>
          <div className="flex justify-between"><dt>Savings</dt><dd>{valid ? `${usd(list - price)} (${Math.round(((list - price) / list) * 100)}%)` : "—"}</dd></div>
        </dl>
        {!valid && <p className="text-xs text-amber-900">A bundle needs 2+ databases and a price below the total.</p>}
        <label className="flex items-center gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" name="featured" checked={s.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured (shown first)</label>
        <L t="Order"><input name="sortOrder" type="number" min={0} value={s.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className={inp} /></L>
        <L t="Status"><select name="status" value={s.status} onChange={(e) => set("status", e.target.value as "draft" | "published")} className={inp}><option value="draft">Draft (hidden)</option><option value="published">Published (live)</option></select></L>
        <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving…" : "Save bundle"}</Button>
        {r && <p role={r.ok ? "status" : "alert"} className={`text-sm font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.ok ? r.message : r.error}</p>}
        {s.id && <Button asChild variant="secondary" className="w-full"><Link href={`/admin/bundles/${s.id}/preview`}>Preview</Link></Button>}
        <Button asChild variant="ghost" className="w-full"><Link href="/admin/bundles">Back to bundles</Link></Button>
      </aside>
    </form>
  );
}
