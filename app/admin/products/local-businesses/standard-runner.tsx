"use client";
import { useState } from "react";
import { standardApplyAction, standardFinishAction, standardIdsAction, standardPreviewAction } from "./actions";

type Row = Awaited<ReturnType<typeof standardPreviewAction>>["rows"][number];

export function StandardRunner() {
  const [prefix, setPrefix] = useState<"1M+" | "15k+">("1M+");
  const [rows, setRows] = useState<Row[]>([]); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);

  async function preview() {
    setBusy(true); setMsg("");
    const ids = await standardIdsAction();
    if (!ids.ok) { setMsg(ids.message ?? "Failed."); setBusy(false); return; }
    const r = await standardPreviewAction(ids.ids.slice(0, 20), prefix);
    setRows(r.rows);
    setMsg(`${ids.ids.length} of ${ids.total} products would change. ${ids.skipped} already have an SEO title and meta description and stay untouched. First ${r.rows.length} shown; nothing is saved.`);
    setBusy(false);
  }
  async function apply() {
    setBusy(true); setConfirm(false);
    try {
      const ids = await standardIdsAction();
      if (!ids.ok) { setMsg(ids.message ?? "Failed."); setBusy(false); return; }
      let changed = 0, kept = 0; const failed: string[] = []; const STEP = 5;
      for (let i = 0; i < ids.ids.length; i += STEP) {
        setMsg(`Working: ${Math.min(i + STEP, ids.ids.length)} of ${ids.ids.length}...`);
        let r: Awaited<ReturnType<typeof standardApplyAction>> | null = null;
        for (let a = 0; a < 3 && !r; a++) { try { r = await standardApplyAction(ids.ids.slice(i, i + STEP), prefix); } catch { await new Promise((res) => setTimeout(res, 1500 * (a + 1))); } }
        if (!r || !r.ok) { setMsg(`Stopped at ${i} of ${ids.ids.length}. ${r?.message ?? "The connection kept dropping."} Press Apply again: finished products already have SEO fields and are skipped.`); setBusy(false); return; }
        changed += r.changed; kept += r.slugKept; failed.push(...r.failed);
      }
      await standardFinishAction(`${changed} changed, ${kept} slugs kept, ${failed.length} failed, prefix ${prefix}`);
      setMsg(`Done: ${changed} products updated. ${kept ? `${kept} kept their old slug (no free name). ` : ""}${failed.length ? `Failed: ${failed.slice(0, 5).join(" | ")}` : ""} Live within about a minute.`);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }
  return (
    <div className="mt-8 max-w-4xl space-y-4 text-sm">
      <div className="rounded-2xl border border-sand-200 bg-white p-5 space-y-3">
        <h2 className="text-base font-semibold">Standardize Local Businesses products</h2>
        <p>Sets, for every product in this category: name “… Email Database”, title “List of … in the …”, a 300-character description, coverage = country, the three packages (5,000 / $39, 10,000 / $59, 15,000 / $99), the slug “…-business-email-database” (old links redirect), a 2027 SEO title and a different 155-character meta description. Removes the ten named fields from each list. Products that already have BOTH an SEO title and a meta description are not touched.</p>
        <label className="flex items-center gap-2">SEO title prefix
          <select value={prefix} onChange={(e) => setPrefix(e.target.value as "1M+" | "15k+")} className="rounded-lg border border-sand-200 px-2 py-1"><option value="1M+">1M+</option><option value="15k+">15k+</option></select>
          <span className="text-xs text-forest-500">Owner-declared claim: only use a figure the lists really support.</span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={preview} className="rounded-full border border-forest-700 px-4 py-2 font-semibold">Preview</button>
          {!confirm ? <button disabled={busy} onClick={() => setConfirm(true)} className="rounded-full bg-purple-600 px-4 py-2 font-semibold text-white">Apply</button>
            : <button disabled={busy} onClick={apply} className="rounded-full bg-forest-900 px-4 py-2 font-semibold text-white">Yes, apply to all not yet edited</button>}
        </div>
      </div>
      {msg && <p role="status" className="rounded-xl bg-sand-100 p-3">{msg}</p>}
      {rows.length > 0 && <div className="overflow-x-auto rounded-2xl border border-sand-200 bg-white"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Old slug</th><th>New slug</th><th>Name</th><th>Title</th><th>SEO title</th><th>Meta description</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-t border-sand-200"><td className="p-2 font-mono">{r.slug}</td><td className="font-mono">{r.newSlug}</td><td>{r.name}</td><td>{r.title}</td><td>{r.seoTitle}</td><td>{r.metaDescription}</td></tr>)}</tbody></table></div>}
    </div>
  );
}
