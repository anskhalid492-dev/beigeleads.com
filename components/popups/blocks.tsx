"use client";
import Link from "next/link";
import { useState } from "react";

export type CatalogLite = {
  categories: { slug: string; name: string }[];
  countries: { slug: string; name: string }[];
  products: { slug: string; title: string; category: string; country: string }[];
  samples: Record<string, [string, string, string, string][]>;
};
export type BlockCtx = { catalog: CatalogLite; productSlug: string; query: string; onNavigate: () => void };

const field = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm text-forest-900";
const li = "flex gap-2 text-sm text-forest-700";
const Tick = () => <span aria-hidden className="mt-0.5 inline-block size-4 shrink-0 rounded-full bg-forest-100 text-center text-[10px] leading-4 text-forest-700">✓</span>;

/** Industry + place picker. Goes to a real list page, or to the custom list builder with the choice carried over. */
function Picker({ ctx, matcher }: { ctx: BlockCtx; matcher?: boolean }) {
  const [cat, setCat] = useState("");
  const [place, setPlace] = useState("");
  const matches = cat ? ctx.catalog.products.filter((p) => p.category === cat) : [];
  const custom = `/custom-list?${new URLSearchParams({ ...(cat ? { category: cat } : {}), ...(place.trim() ? { countryText: place.trim() } : {}) })}`;
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-forest-900">Industry
        <select className={`${field} mt-1 font-normal`} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Choose an industry</option>
          {ctx.catalog.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      {!matcher && <label className="block text-xs font-semibold text-forest-900">Where do you want to reach them?
        <input className={`${field} mt-1 font-normal`} value={place} maxLength={60} onChange={(e) => setPlace(e.target.value)} placeholder="Country, state or city" />
      </label>}
      {cat && (matches.length
        ? <ul className="space-y-1 text-sm">{matches.map((p) => <li key={p.slug}><Link onClick={ctx.onNavigate} className="font-semibold text-forest-900 underline underline-offset-4" href={`/lists/${p.slug}`}>{p.title}</Link></li>)}</ul>
        : <p className="text-sm text-forest-700">No ready-made list for this yet. <Link onClick={ctx.onNavigate} className="font-semibold underline underline-offset-4" href={custom}>Request a custom list</Link>.</p>)}
      {!matcher && cat && matches.length > 0 && place.trim() && <p className="text-xs text-forest-700">Need a different place? <Link onClick={ctx.onNavigate} className="font-semibold underline underline-offset-4" href={custom}>Request it as a custom list</Link>.</p>}
    </div>
  );
}

export function Block({ kind, ctx }: { kind: string; ctx: BlockCtx }) {
  const { catalog } = ctx;
  switch (kind) {
    case "audience": return <Picker ctx={ctx} />;
    case "matcher": return <Picker ctx={ctx} matcher />;
    case "steps": return (
      <ul className="space-y-2">
        <li className={li}><Tick /><span><b>Ready-made lists:</b> pick a list, see the fields, pay once.</span></li>
        <li className={li}><Tick /><span><b>Free sample:</b> a masked preview first, no payment details.</span></li>
        <li className={li}><Tick /><span><b>Custom list:</b> tell us who you need and we check if we can source it.</span></li>
      </ul>
    );
    case "sample": {
      const slug = ctx.productSlug && catalog.samples[ctx.productSlug]?.length ? ctx.productSlug : Object.keys(catalog.samples).find((k) => catalog.samples[k]?.length);
      const rows = slug ? catalog.samples[slug] : [];
      if (!rows?.length) return null;
      return (
        <div>
          <div className="overflow-hidden rounded-xl border border-sand-200 bg-white text-xs">
            <table className="w-full text-left"><thead className="bg-sand-100 text-forest-900"><tr><th className="px-2 py-1.5">Business</th><th className="px-2 py-1.5">City</th><th className="px-2 py-1.5">Email</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r[0]} className="border-t border-sand-200"><td className="px-2 py-1.5">{r[0]}</td><td className="px-2 py-1.5">{r[1]}</td><td className="px-2 py-1.5 font-mono">{r[2]}</td></tr>)}</tbody></table>
          </div>
          <p className="mt-1.5 text-[11px] text-forest-700">Real rows with masked contacts.</p>
        </div>
      );
    }
    case "custom": return ctx.query ? <p className="rounded-xl bg-purple-100 px-3 py-2 text-sm text-forest-900">Your search: <b>{ctx.query}</b></p> : null;
    case "checkout": return (
      <ul className="space-y-2">
        <li className={li}><Tick /><span>One payment in crypto. No account, no subscription.</span></li>
        <li className={li}><Tick /><span>Payment is confirmed on the network before anything is delivered.</span></li>
        <li className={li}><Tick /><span>Your link is emailed to you, usually instantly and within 12 hours at most.</span></li>
      </ul>
    );
    case "help": return (
      <ul className="space-y-1.5 text-sm">
        {[["How payment confirmation works", "/help/payments/how-payment-confirmation-works"], ["How you receive your list", "/help/delivery/how-you-receive-your-list"], ["Refunds and replacements", "/help/payments/refunds-and-replacements"]].map(([t, h]) => <li key={h}><Link onClick={ctx.onNavigate} href={h!} className="font-semibold text-forest-900 underline underline-offset-4">{t}</Link></li>)}
      </ul>
    );
    case "after": return (
      <ul className="space-y-2">
        <li className={li}><Tick /><span>Check the inbox of the email address you used at checkout, and your spam folder.</span></li>
        <li className={li}><Tick /><span>Delivery is usually instant and can take up to 12 hours.</span></li>
        <li className={li}><Tick /><span>Nothing arrived? Contact us with your order number.</span></li>
      </ul>
    );
    case "guides": return (
      <ul className="space-y-1.5 text-sm">
        <li><Link onClick={ctx.onNavigate} href="/blog" className="font-semibold text-forest-900 underline underline-offset-4">Guides on the BeigeLeads Journal</Link></li>
        <li><Link onClick={ctx.onNavigate} href="/legal/lawful-use" className="font-semibold text-forest-900 underline underline-offset-4">Lawful use policy</Link></li>
        <li><Link onClick={ctx.onNavigate} href="/legal/can-spam" className="font-semibold text-forest-900 underline underline-offset-4">CAN-SPAM rules</Link></li>
      </ul>
    );
    case "related": {
      const here = catalog.products.find((p) => p.slug === ctx.productSlug);
      const list = catalog.products.filter((p) => p.slug !== ctx.productSlug && (!here || p.category !== here.category)).slice(0, 3);
      if (!list.length) return null;
      return <ul className="space-y-1.5 text-sm">{list.map((p) => <li key={p.slug}><Link onClick={ctx.onNavigate} href={`/lists/${p.slug}`} className="font-semibold text-forest-900 underline underline-offset-4">{p.title}</Link></li>)}</ul>;
    }
    default: return null;
  }
}
