"use client";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { ALL_LEVELS, type NegPolicy } from "@/lib/beigepilot/v2/negotiate";
import { saveNegAction } from "./actions";

const inp = "mt-1 w-full rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
const lines = (a: string[]) => a.join("\n");
const parse = (t: string) => t.split(/[\n,]/).map((x) => x.trim().toLowerCase()).filter(Boolean);

export function NegotiationForm({ initial, categories, products }: { initial: NegPolicy; categories: { slug: string; name: string }[]; products: { slug: string; name: string }[] }) {
  const [r, act, pending] = useActionState(saveNegAction, null);
  const [s, setS] = useState(initial);
  const [elig, setElig] = useState(lines(initial.eligibleCategories));
  const [exCat, setExCat] = useState(lines(initial.excludedCategories));
  const [exProd, setExProd] = useState(lines(initial.excludedProducts));
  const payload = { ...s, eligibleCategories: parse(elig), excludedCategories: parse(exCat), excludedProducts: parse(exProd) };
  const over = s.maxPercent > 20;
  const levelsOver = s.levels.some((l) => l > s.maxPercent);
  const sw = "mt-0.5 size-4 accent-purple-600";
  const toggle = (l: number) => setS((x) => ({ ...x, levels: x.levels.includes(l) ? x.levels.filter((y) => y !== l) : [...x.levels, l].sort((a, b) => a - b) }));
  return (
    <form action={act} className="space-y-6">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Negotiation</h2>
        <p className="mt-1 text-sm text-forest-700">Pilo can make an automatic offer only when a visitor explicitly asks for a discount. It never brings up discounts on its own, and it never says a person approved the offer.</p>
        <label className="mt-4 flex items-start gap-2 text-sm font-semibold text-forest-900"><input type="checkbox" className={sw} checked={s.enabled} onChange={(e) => setS({ ...s, enabled: e.target.checked })} />Allow Pilo to make offers (off by default)</label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-forest-900">Maximum discount (%, never above 20)<input type="number" min={1} max={20} value={s.maxPercent} onChange={(e) => setS({ ...s, maxPercent: Number(e.target.value) })} className={inp} />
            {over && <span role="alert" className="mt-1 block text-xs font-semibold text-red-700">20% is the hard ceiling and is enforced in the pricing code.</span>}</label>
          <fieldset><legend className="text-sm font-semibold text-forest-900">Offer levels (ladder, lowest first)</legend>
            <div className="mt-2 flex flex-wrap gap-3">{ALL_LEVELS.map((l) => <label key={l} className="flex items-center gap-1.5 text-sm text-forest-900"><input type="checkbox" className="size-4 accent-purple-600" checked={s.levels.includes(l)} onChange={() => toggle(l)} />{l}%</label>)}</div>
            {levelsOver && <p role="alert" className="mt-1 text-xs font-semibold text-red-700">A level is above your maximum.</p>}</fieldset>
          <label className="flex items-start gap-2 text-sm font-semibold text-forest-900 sm:col-span-2"><input type="checkbox" className={sw} checked={s.allowDirect} onChange={(e) => setS({ ...s, allowDirect: e.target.checked })} />A visitor who asks for a specific percentage (for example 20%) may get the highest level up to that, if eligible. Off = always climb the ladder one step at a time.</label>
        </div>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Who and what is eligible</h2>
        <p className="mt-1 text-sm text-forest-700">Standard database lists only. Email list verification, custom quotes, bundles, gift cards and credits are always excluded.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-forest-900">Eligible categories (slugs, one per line; empty = all)<textarea rows={3} value={elig} onChange={(e) => setElig(e.target.value)} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900">Excluded categories<textarea rows={3} value={exCat} onChange={(e) => setExCat(e.target.value)} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900 sm:col-span-2">Excluded products (slugs, one per line)<textarea rows={3} value={exProd} onChange={(e) => setExProd(e.target.value)} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900">Minimum cart value (USD, optional)<input type="number" min={0} value={s.minCartCents / 100} onChange={(e) => setS({ ...s, minCartCents: Math.round(Number(e.target.value) * 100) || 0 })} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900">Maximum savings per offer (USD, optional)<input type="number" min={0} value={s.maxSavingCents === null ? "" : s.maxSavingCents / 100} onChange={(e) => setS({ ...s, maxSavingCents: e.target.value === "" ? null : Math.round(Number(e.target.value) * 100) })} className={inp} /></label>
        </div>
        <details className="mt-3 text-xs text-forest-700"><summary className="cursor-pointer font-semibold text-purple-700">Category and product slugs</summary>
          <p className="mt-1"><b>Categories:</b> {categories.map((c) => `${c.slug}`).join(", ")}</p><p className="mt-1"><b>Products:</b> {products.slice(0, 80).map((p) => p.slug).join(", ")}{products.length > 80 ? ", ..." : ""}</p></details>
      </section>

      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Limits and stacking</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-forest-900">Offer valid for (minutes)<input type="number" min={10} max={1440} value={s.expiryMinutes} onChange={(e) => setS({ ...s, expiryMinutes: Number(e.target.value) })} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900">Max offers per chat session<input type="number" min={1} max={5} value={s.maxPerSession} onChange={(e) => setS({ ...s, maxPerSession: Number(e.target.value) })} className={inp} /></label>
          <label className="text-sm font-semibold text-forest-900">Max offers per connection per day<input type="number" min={1} max={50} value={s.maxPerIpDay} onChange={(e) => setS({ ...s, maxPerIpDay: Number(e.target.value) })} className={inp} /></label>
        </div>
        <p className="mt-4 rounded-xl bg-sand-100 p-3 text-sm text-forest-900"><b>Stacking (fixed):</b> an offer never combines with Buy More, Save More, a bundle or a promo code. When the visitor already has a bigger saving, Pilo keeps it and says so. One offer = one use, a random code that only works for the chat session it was made in.</p>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || over || levelsOver}>{pending ? "Saving…" : "Save negotiation rules"}</Button>
        {r && <p role="status" className={`text-sm font-semibold ${r.ok ? "text-forest-700" : "text-red-700"}`}>{r.message}</p>}
      </div>
    </form>
  );
}
