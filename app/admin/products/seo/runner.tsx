"use client";
import { useState } from "react";
import { seoApplyAction, seoFinishAction, seoIdsAction, seoPreviewAction } from "../import/actions";

type Row = { id: number; from: string; to: string; name: string; seoTitle: string };

export function Runner() {
  const [o, setO] = useState({ slugs: true, names: true, titles: true });
  const [rows, setRows] = useState<Row[]>([]); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);

  async function preview() {
    setBusy(true); setMsg("");
    const ids = await seoIdsAction();
    if (!ids.ok) { setMsg(ids.message ?? "Failed."); setBusy(false); return; }
    const r = await seoPreviewAction(ids.ids.slice(0, 40), o);
    if (!r.ok) setMsg(r.message); else { setRows(r.sample); setMsg(`${ids.ids.length} products would be processed. First ${r.sample.length} shown. Nothing is saved yet.`); }
    setBusy(false);
  }
  async function apply() {
    setBusy(true); setConfirm(false);
    try {
      const ids = await seoIdsAction();
      if (!ids.ok) { setMsg(ids.message ?? "Failed."); setBusy(false); return; }
      let changed = 0, slugChanged = 0;
      for (let i = 0; i < ids.ids.length; i += 40) {
        setMsg(`Working: ${Math.min(i + 40, ids.ids.length)} of ${ids.ids.length}...`);
        const r = await seoApplyAction(ids.ids.slice(i, i + 40), o);
        if (!r.ok) { setMsg(r.message); setBusy(false); return; }
        changed += r.changed ?? 0; slugChanged += r.slugChanged ?? 0;
      }
      await seoFinishAction({ changed, slugChanged, ...o });
      setMsg(`Done: ${changed} products updated, ${slugChanged} slugs changed. Changes are live within about a minute.`);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  const box = (k: keyof typeof o, label: string) => <label className="flex items-center gap-2"><input type="checkbox" checked={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.checked })} />{label}</label>;
  return (
    <div className="max-w-4xl space-y-4 text-sm">
      <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-2">
        {box("slugs", "New slugs (old links redirect; delivery links, promotions and page SEO move along; built-in products keep their slug)")}
        {box("names", "New product names / H1 titles")}
        {box("titles", "New SEO titles and meta descriptions")}
        <div className="flex flex-wrap gap-2 pt-2">
          <button disabled={busy} onClick={preview} className="rounded-full border border-forest-700 px-4 py-2 font-semibold">Preview</button>
          {!confirm ? <button disabled={busy} onClick={() => setConfirm(true)} className="rounded-full bg-purple-600 px-4 py-2 font-semibold text-white">Apply to all products</button>
            : <button disabled={busy} onClick={apply} className="rounded-full bg-forest-900 px-4 py-2 font-semibold text-white">Yes, really apply to every product</button>}
        </div>
      </div>
      {msg && <p role="status" className="rounded-xl bg-sand-100 p-3">{msg}</p>}
      {rows.length > 0 && <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Old slug</th><th>New slug</th><th>Name / H1</th><th>SEO title</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-t border-sand-200"><td className="p-2 font-mono">{r.from}</td><td className="font-mono">{r.to}</td><td>{r.name}</td><td>{r.seoTitle}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
