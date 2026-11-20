"use client";
import { useMemo, useState } from "react";
import { parseCsv, tableFromGrid } from "@/lib/glossary/tabular";
import { MAX_SAMPLE_ROWS, maskRows, pickField } from "@/lib/product-samples";
import { saveSamplesBulkAction } from "../import/actions";

export function Bulk() {
  const [text, setText] = useState(""); const [file, setFile] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [unknown, setUnknown] = useState<string[]>([]);
  const groups = useMemo(() => {
    if (!text.trim()) return [];
    const m = new Map<string, Record<string, string>[]>();
    for (const r of tableFromGrid(parseCsv(text)).rows) { const slug = pickField(r, "slug").trim(); if (!slug) continue; m.set(slug, [...(m.get(slug) ?? []), r]); }
    return [...m.entries()].map(([slug, rows]) => ({ slug, raw: rows.slice(0, 60), masked: maskRows(rows) })).filter((g) => g.masked.length);
  }, [text]);
  const noSlug = text.trim() && !groups.length;

  async function run() {
    setBusy(true); setUnknown([]); let saved = 0; const miss: string[] = [];
    try {
      for (let i = 0; i < groups.length; i += 40) {
        setMsg(`Saving ${Math.min(i + 40, groups.length)} of ${groups.length}...`);
        const r = await saveSamplesBulkAction(groups.slice(i, i + 40).map((g) => ({ slug: g.slug, rows: g.raw })));
        if (!r.ok) { setMsg(r.message); setBusy(false); return; }
        saved += r.saved ?? 0; miss.push(...(r.unknown ?? []));
      }
      setUnknown(miss); setMsg(`Done: ${saved} products saved, ${miss.length} slugs not found.`);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div className="max-w-3xl space-y-4 text-sm">
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <p className="font-semibold text-forest-900">CSV columns</p>
        <p className="mt-1"><code>slug</code> (the product), <code>business</code> (or name / company), and any of <code>address, city, phone, email, website</code>. Up to {MAX_SAMPLE_ROWS} rows per product are kept (extra rows are ignored). Rows replace the product&rsquo;s saved sample.</p>
        <input type="file" accept=".csv,text/csv" aria-label="CSV file" className="mt-3" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5_000_000) { setMsg("That file is too large (5 MB max)."); return; } setFile(f.name); setText(await f.text()); setMsg(""); }} />
      </div>
      {groups.length > 0 && (
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p>{file}: {groups.length} products, {groups.reduce((n, g) => n + g.masked.length, 0)} masked rows. Example for <b>{groups[0].slug}</b>:</p>
          <div className="mt-2 overflow-x-auto rounded-lg border border-sand-200"><table className="w-full text-left text-xs"><tbody>{groups[0].masked.slice(0, 4).map((r) => <tr key={r.business} className="border-t border-sand-200 first:border-0"><td className="p-2">{r.business}</td><td>{r.city}</td><td className="font-mono">{r.phone}</td><td className="font-mono">{r.email}</td></tr>)}</tbody></table></div>
          <button type="button" disabled={busy} onClick={run} className="mt-4 rounded-full bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-40">Save samples for {groups.length} products</button>
        </div>
      )}
      {noSlug && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-900">No usable rows. The first line must be a header with a slug column and a business column.</p>}
      {msg && <p role="status" aria-live="polite" className="font-semibold">{msg}</p>}
      {unknown.length > 0 && <ul className="max-h-48 list-disc overflow-auto rounded-lg bg-sand-100 p-3 pl-7 text-xs">{unknown.slice(0, 80).map((s) => <li key={s}>{s}: no product with this slug</li>)}</ul>}
    </div>
  );
}
