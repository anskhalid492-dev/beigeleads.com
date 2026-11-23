"use client";
import Link from "next/link";
import { useState } from "react";
import { bulkLastUpdatedAction, bulkStatusAction, bulkStatusByFilterAction, deleteProductsAction, deleteProductsByFilterAction } from "../import/actions";

type R = { id: number; slug: string; name: string; status: string; category: string; country: string; channel: string; packages: string; restricted: string[]; flags: number };

export type F = { q?: string; status?: string; channel?: string; restricted?: "yes" | "no"; flag?: string; category?: string; importId?: number };
export function Table({ rows, total, filters }: { rows: R[]; total: number; filters: F }) {
  const [all, setAll] = useState(false); const [date, setDate] = useState(""); const [dateAsk, setDateAsk] = useState(false);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState(""); const [refused, setRefused] = useState<{ slug: string; reasons: string[] }[]>([]); const [busy, setBusy] = useState(false); const [askDel, setAskDel] = useState(false); const [askPub, setAskPub] = useState(false); const [override, setOverride] = useState(false);
  const toggle = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  async function go(to: "draft" | "published" | "archived") {
    if (!sel.size && !all) return;
    setAskPub(false); setMsg("Working..."); setRefused([]); setBusy(true);
    try {
      const r = all ? await bulkStatusByFilterAction(filters, to, to === "published" && override) : await bulkStatusAction([...sel], to, to === "published" && override); setMsg(r.message); setRefused(r.refused ?? []); setSel(new Set()); setAll(false);
      if (r.ok) setTimeout(() => location.reload(), r.refused?.length ? 4000 : 900);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  async function del() {
    setAskDel(false); setMsg("Deleting..."); setRefused([]); setBusy(true);
    try {
      const r = all ? await deleteProductsByFilterAction(filters) : await deleteProductsAction([...sel]);
      setMsg(r.message); if (r.ok) { setSel(new Set()); setAll(false); setTimeout(() => location.reload(), 2500); }
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  async function setDates() {
    setDateAsk(false); setMsg("Working..."); setRefused([]); setBusy(true);
    try {
      const r = await bulkLastUpdatedAction(all ? { filters } : { ids: [...sel] }, date);
      setMsg(r.message); if (r.ok) { setSel(new Set()); setAll(false); setTimeout(() => location.reload(), 1200); }
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-sand-200 bg-sand-50 p-3 text-sm">
        <label className="flex items-center gap-2 font-semibold">Last updated <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setDateAsk(false); }} className="rounded-lg border border-sand-300 px-2 py-1 font-normal" /></label>
        <button type="button" disabled={busy || !date || (!sel.size && !all)} onClick={() => setDateAsk(true)} className="rounded-full border border-forest-900 px-3 py-1 font-semibold disabled:opacity-40">Set for {all ? `all ${total} matching` : `${sel.size} selected`}</button>
        {total > 0 && !all && <button type="button" className="underline" onClick={() => setAll(true)}>Select all {total} (every page)</button>}
        {dateAsk && <span className="flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-1">Set last updated to {date} on {all ? total : sel.size} product(s)? <button type="button" onClick={setDates} className="rounded-full bg-forest-900 px-3 py-1 font-semibold text-sand-50">Yes, set it</button><button type="button" onClick={() => setDateAsk(false)} className="underline">Cancel</button></span>}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-sand-200 p-3 text-sm">
        <span>{all ? `All ${total} matching selected` : `${sel.size} selected`}</span>
        {!all && total > rows.length && <button onClick={() => setAll(true)} className="underline">Select all {total} matching the filter (all pages)</button>}
        {all && <button onClick={() => setAll(false)} className="underline">Clear</button>}
        {(["published", "draft", "archived"] as const).map((s) => <button key={s} disabled={busy || (!sel.size && !all)} onClick={() => (s === "published" ? setAskPub(true) : go(s))} className="rounded-full border border-forest-900 px-3 py-1 font-semibold disabled:opacity-40">{s === "published" ? "Publish" : s === "draft" ? "Back to draft" : "Archive"}</button>)}
        <button type="button" disabled={busy || (!sel.size && !all)} onClick={() => setAskDel(true)} className="rounded-full border border-red-700 px-3 py-1 font-semibold text-red-800 disabled:opacity-40">Delete</button>
        {askDel && <span className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1">Delete {all ? total : sel.size} product(s) for good? They are removed from the site. Products with orders or built in are archived instead.
          <button type="button" onClick={del} className="rounded-full bg-red-700 px-3 py-1 font-semibold text-white">Yes, delete</button>
          <button type="button" onClick={() => setAskDel(false)} className="underline">Cancel</button></span>}
        {askPub && <span className="flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-1">Publish {all ? total : sel.size} product(s)? They become visible and buyable.
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /> Also publish restricted products (phone, consumer, sensitive). I confirm I may lawfully sell this data.</label>
          <button onClick={() => go("published")} className="rounded-full bg-forest-900 px-3 py-1 font-semibold text-sand-50">Yes, publish</button>
          <button onClick={() => setAskPub(false)} className="underline">Cancel</button></span>}
        {msg && <span role="status" aria-live="polite" className="font-semibold">{msg}</span>}
      </div>
      {refused.length > 0 && <ul className="m-3 list-disc rounded-lg bg-red-50 p-3 pl-7 text-xs text-red-900">{refused.map((r) => <li key={r.slug}>{r.slug}: {r.reasons.join("; ")}</li>)}</ul>}
      <div className="overflow-x-auto"><table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="bg-sand-100 text-xs font-bold text-forest-900"><tr><th className="px-3 py-2"><input type="checkbox" aria-label="Select all" onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th><th>Product</th><th>Category</th><th>Country</th><th>Packages</th><th>Status</th><th>Flags</th></tr></thead>
        <tbody className="divide-y divide-sand-200">{rows.map((r) => (
          <tr key={r.id}><td className="px-3 py-2"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} /></td>
            <td className="py-2 pr-2"><Link href={`/admin/products/imported/${r.id}`} className="font-semibold text-forest-900 underline-offset-2 hover:underline">{r.name}</Link><br /><span className="text-xs">{r.slug}</span></td><td>{r.category}</td><td>{r.country}</td><td>{r.packages}</td>
            <td>{r.status}</td><td>{r.restricted.length ? <span className="rounded bg-red-100 px-1.5 text-xs text-red-900">restricted: {r.restricted.join(", ")}</span> : null}{r.flags ? <span className="ml-1 text-xs text-forest-700">{r.flags} {r.flags === 1 ? "flag" : "flags"}</span> : null}</td></tr>))}</tbody></table></div>
    </div>
  );
}
