"use client";
import { useMemo, useState } from "react";
import { parseCsv, tableFromGrid } from "@/lib/glossary/tabular";
import { MAX_SAMPLE_ROWS, maskRows } from "@/lib/product-samples";
import { saveDefaultSampleAction } from "../import/actions";

export function DefaultSample({ current }: { current: number }) {
  const [text, setText] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const masked = useMemo(() => (text.trim() ? maskRows(tableFromGrid(parseCsv(text)).rows) : []), [text]);
  async function save(clear = false) {
    setBusy(true);
    try { const r = await saveDefaultSampleAction(clear ? "" : text); setMsg(r.message); if (r.ok) setText(""); } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div className="max-w-3xl rounded-2xl border border-sand-200 bg-white p-5 text-sm">
      <p className="font-semibold text-forest-900">Default sample for every product</p>
      <p className="mt-1">Paste real rows from one of your lists (CSV with a header: <code>business</code>, <code>address</code>, <code>city</code>, <code>phone</code>, <code>email</code>, <code>website</code>). Emails, phone numbers and house numbers are masked before saving. Every product without its own sample, and the sample page, cart and home preview, use these rows. Up to {MAX_SAMPLE_ROWS} rows. {current ? `Currently saved: ${current} rows.` : "Nothing saved yet, so pages without a sample show a request-a-sample panel instead."}</p>
      <textarea aria-label="Default sample CSV" value={text} onChange={(e) => setText(e.target.value)} rows={6} className="mt-3 w-full rounded-lg border border-sand-300 p-2 font-mono text-xs" placeholder="business,address,city,phone,email,website" />
      {masked.length > 0 && <div className="mt-2 overflow-x-auto rounded-lg border border-sand-200"><table className="w-full text-left text-xs"><tbody>{masked.slice(0, 6).map((r) => <tr key={r.business} className="border-t border-sand-200 first:border-0"><td className="p-2">{r.business}</td><td>{r.city}</td><td className="font-mono">{r.phone}</td><td className="font-mono">{r.email}</td></tr>)}</tbody></table></div>}
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={busy || !masked.length} onClick={() => save()} className="rounded-full bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-40">Save default sample</button>
        {current > 0 && <button type="button" disabled={busy} onClick={() => save(true)} className="rounded-full border border-forest-700 px-5 py-2 font-semibold">Remove</button>}
      </div>
      {msg && <p role="status" className="mt-2 font-semibold">{msg}</p>}
    </div>
  );
}
