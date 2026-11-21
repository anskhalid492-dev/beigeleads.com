"use client";
import { useEffect, useMemo, useState } from "react";
import { rollbackLocalAction } from "../local-businesses/actions";
import { applyGeneralAction, scanGeneralAction } from "./actions";

type Data = Awaited<ReturnType<typeof scanGeneralAction>>;
type View = "high" | "review" | "keep";

export function Runner() {
  const [d, setD] = useState<Data | null>(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>("high"); const [q, setQ] = useState(""); const [dest, setDest] = useState("all");
  const [includeReview, setIncludeReview] = useState(false); const [sel, setSel] = useState<Set<string>>(new Set()); const [confirm, setConfirm] = useState(false);

  async function load() { setBusy(true); const r = await scanGeneralAction(); setD(r); if (!r.ok) setMsg(r.message ?? "Failed."); setBusy(false); }
  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, []);

  const rows = useMemo(() => (d?.scan?.rows ?? []).filter((r) => (view === "high" ? r.confidence === "high" : view === "review" ? r.confidence === "review" : r.confidence === "none") && (dest === "all" || r.dest === dest) && (!q || r.name.toLowerCase().includes(q.toLowerCase()))), [d, view, q, dest]);
  const movable = (d?.scan?.rows ?? []).filter((r) => r.own || r.dest && (r.confidence === "high" || (includeReview && r.confidence === "review")));
  const chosen = movable.filter((r) => sel.has(r.slug));
  const s = d?.scan;

  function download() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ["Product ID", "Title", "Current category", "Proposed category", "Reason", "Confidence"];
    const body = (s?.rows ?? []).map((r) => [r.id, r.name, r.currentCategory, r.destName, r.reason, r.confidence === "none" ? "keep" : r.confidence].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([[head.join(","), ...body].join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "general-targeted-lists-audit.csv"; a.click(); URL.revokeObjectURL(url);
  }
  async function apply() { setBusy(true); setConfirm(false); const r = await applyGeneralAction(chosen.map((c) => c.slug), includeReview); setMsg(r.message); setSel(new Set()); await load(); }
  async function undo(b: string) { setBusy(true); const r = await rollbackLocalAction(b); setMsg(r.message); await load(); }
  const toggle = (k: string) => setSel((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  return (
    <div className="space-y-5">
      {d && d.ready === false && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">Migration 0040 is not applied yet. You can preview and download the audit, but moving is disabled until you run drizzle/0040_category_moves.sql in D1.</p>}
      {msg && <p role="status" className="rounded-xl border border-sand-200 bg-white p-3 text-sm">{msg}</p>}
      {s && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {([["All products", s.scanned], ["In General Targeted", s.inGeneral], ["Local", s.high.local], ["Healthcare", s.high.healthcare], ["Webmail", s.high.webmail], ["Crypto", s.high.crypto], ["Exhibitors", s.high.exhibitors], ["Own category", s.own], ["Manual review", s.review], ["Stay", s.keep]] as const).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-sand-200 bg-white p-3"><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-forest-700">{k}</div></div>
          ))}
        </div>
      )}
      {s && s.reused.length > 0 && <p className="text-sm text-forest-700">Existing categories reused: {s.reused.map((k) => s.dests[k].name).join(", ")}. Others are created by the move (no duplicates).</p>}
      <div className="flex flex-wrap items-center gap-2">
        {([["high", "Proposed moves"], ["review", "Manual review"], ["keep", "Stay"]] as const).map(([v, l]) => <button key={v} onClick={() => setView(v)} className={`rounded-full border px-3 py-1 text-sm ${view === v ? "bg-forest-900 text-sand-50" : "bg-white"}`}>{l}</button>)}
        <select value={dest} onChange={(e) => setDest(e.target.value)} className="rounded-lg border border-sand-200 bg-white px-2 py-1.5 text-sm"><option value="all">All destinations</option><option value="local">Local</option><option value="healthcare">Healthcare</option><option value="webmail">Webmail</option><option value="crypto">Crypto</option><option value="exhibitors">Exhibitors</option></select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm" />
        <button onClick={download} className="ml-auto rounded-lg border px-3 py-1.5 text-sm">Download audit report (CSV)</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs"><tr><th className="w-8 p-2">
            {<input type="checkbox" aria-label="Select all shown" checked={rows.length > 0 && rows.every((r) => sel.has(r.slug))} onChange={(e) => setSel((p) => { const n = new Set(p); rows.forEach((r) => (e.target.checked ? n.add(r.slug) : n.delete(r.slug))); return n; })} />}
          </th><th className="p-2">ID</th><th className="p-2">Product</th><th className="p-2">Current</th><th className="p-2">Proposed</th><th className="p-2">Reason</th><th className="p-2">Confidence</th></tr></thead>
          <tbody>
            {rows.slice(0, 300).map((r) => (
              <tr key={r.slug} className="border-t border-sand-100">
                <td className="p-2">{(view === "keep" ? !!r.own : view === "high" || includeReview) && <input type="checkbox" aria-label={`Select ${r.name}`} checked={sel.has(r.slug)} onChange={() => toggle(r.slug)} />}</td>
                <td className="p-2">{r.id}</td><td className="p-2">{r.name}</td><td className="p-2">{r.currentCategory}</td><td className="p-2">{r.destName}</td><td className="p-2 text-forest-700">{r.reason}</td><td className="p-2">{r.confidence === "none" ? "-" : r.confidence}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="p-4 text-center text-forest-700">{busy ? "Scanning..." : "Nothing here."}</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && <p className="text-xs text-forest-700">Showing the first 300 of {rows.length}. The CSV has every row.</p>}
      <div className="space-y-3 rounded-xl border border-sand-200 bg-white p-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeReview} onChange={(e) => setIncludeReview(e.target.checked)} /> Allow selecting products from the manual review list</label>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setSel(new Set(movable.filter((r) => r.confidence === "high").map((r) => r.slug)))}>Select all high-confidence moves</button>
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setSel((p) => { const n = new Set(p); (d?.scan?.rows ?? []).filter((r) => r.own).forEach((r) => n.add(r.slug)); return n; })}>Select all Stay products (own category)</button>
          {!confirm ? <button disabled={busy || !chosen.length || d?.ready === false} onClick={() => setConfirm(true)} className="rounded-lg bg-forest-900 px-3 py-1.5 text-sm text-sand-50 disabled:opacity-50">Move {chosen.length} selected</button>
            : <><span className="text-sm">Move {chosen.length} product(s) out of General Targeted Lists?</span><button onClick={apply} className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white">Yes, move them</button><button onClick={() => setConfirm(false)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button></>}
        </div>
      </div>
      {!!d?.batches?.length && (
        <div className="rounded-xl border border-sand-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Batches (reversible)</h2>
          {d.batches.map((b) => (
            <div key={b.batch} className="flex items-center gap-3 border-t border-sand-100 py-2 text-sm first:border-0">
              <span className="font-mono">{b.batch}</span><span>{new Date(b.movedAt * 1000).toLocaleString()}</span><span>{b.active} of {b.total} active</span>
              {b.active > 0 && <button disabled={busy} onClick={() => undo(b.batch)} className="ml-auto rounded-lg border px-3 py-1 text-xs">Roll back</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
