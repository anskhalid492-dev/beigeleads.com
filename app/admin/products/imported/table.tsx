"use client";
import { useState } from "react";
import { bulkStatusAction } from "../import/actions";

type R = { id: number; slug: string; name: string; status: string; category: string; country: string; channel: string; packages: string; restricted: string[]; flags: number };

export function Table({ rows }: { rows: R[] }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState(""); const [refused, setRefused] = useState<{ slug: string; reasons: string[] }[]>([]); const [busy, setBusy] = useState(false);
  const toggle = (id: number) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  async function go(to: "draft" | "published" | "archived") {
    if (!sel.size) return;
    if (to === "published" && !confirm(`Publish ${sel.size} product(s)? They become visible and buyable.`)) return;
    setBusy(true); const r = await bulkStatusAction([...sel], to); setMsg(r.message); setRefused(r.refused ?? []); setBusy(false); setSel(new Set());
    if (r.ok) setTimeout(() => location.reload(), 900);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-sand-200 p-3 text-sm">
        <span>{sel.size} selected</span>
        {(["published", "draft", "archived"] as const).map((s) => <button key={s} disabled={busy || !sel.size} onClick={() => go(s)} className="rounded-full border border-forest-900 px-3 py-1 font-semibold disabled:opacity-40">{s === "published" ? "Publish" : s === "draft" ? "Back to draft" : "Archive"}</button>)}
        {msg && <span role="status">{msg}</span>}
      </div>
      {refused.length > 0 && <ul className="m-3 list-disc rounded-lg bg-red-50 p-3 pl-7 text-xs text-red-900">{refused.map((r) => <li key={r.slug}>{r.slug}: {r.reasons.join("; ")}</li>)}</ul>}
      <div className="overflow-x-auto"><table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="bg-sand-100 text-xs font-bold text-forest-900"><tr><th className="px-3 py-2"><input type="checkbox" aria-label="Select all" onChange={(e) => setSel(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th><th>Product</th><th>Category</th><th>Country</th><th>Packages</th><th>Status</th><th>Flags</th></tr></thead>
        <tbody className="divide-y divide-sand-200">{rows.map((r) => (
          <tr key={r.id}><td className="px-3 py-2"><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name}`} /></td>
            <td className="py-2 pr-2"><span className="font-semibold text-forest-900">{r.name}</span><br /><span className="text-xs">{r.slug}</span></td><td>{r.category}</td><td>{r.country}</td><td>{r.packages}</td>
            <td>{r.status}</td><td>{r.flags}{r.restricted.length ? <span className="ml-1 rounded bg-red-100 px-1.5 text-xs text-red-900">restricted: {r.restricted.join(", ")}</span> : null}</td></tr>))}</tbody></table></div>
    </div>
  );
}
