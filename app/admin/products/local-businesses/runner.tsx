"use client";
import { useEffect, useMemo, useState } from "react";
import { applyLocalAction, createUsPagesAction, rollbackLocalAction, scanLocalAction } from "./actions";

type Item = NonNullable<Awaited<ReturnType<typeof scanLocalAction>>["items"]>[number];
type Data = Awaited<ReturnType<typeof scanLocalAction>>;

export function Runner() {
  const [d, setD] = useState<Data | null>(null); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"move" | "review" | "keep">("move"); const [q, setQ] = useState("");
  const [copy, setCopy] = useState(true); const [allowReview, setAllowReview] = useState(false); const [sel, setSel] = useState<Set<string>>(new Set()); const [confirm, setConfirm] = useState(false);

  async function load() { setBusy(true); const r = await scanLocalAction(); setD(r); if (!r.ok) setMsg(r.message ?? "Failed."); setBusy(false); }
  useEffect(() => { const t = setTimeout(() => { void load(); }, 0); return () => clearTimeout(t); }, []);

  const rows = useMemo(() => (d?.items ?? []).filter((i) => !i.alreadyMoved && i.decision === view && (!q || `${i.name} ${i.categoryName}`.toLowerCase().includes(q.toLowerCase()))), [d, view, q]);
  const movable = (d?.items ?? []).filter((i) => !i.alreadyMoved && (i.decision === "move" || (allowReview && i.decision === "review")));
  const chosen = movable.filter((i) => sel.has(i.slug));

  async function apply() {
    setBusy(true); setConfirm(false);
    const r = await applyLocalAction(chosen.map((i) => i.slug), copy, allowReview);
    setMsg(r.message); setSel(new Set()); await load();
  }
  async function undo(b: string) { setBusy(true); const r = await rollbackLocalAction(b); setMsg(r.message); await load(); }
  const toggle = (s: string) => setSel((p) => { const n = new Set(p); if (n.has(s)) n.delete(s); else n.add(s); return n; });
  const t = d?.totals;
  async function createPages() {
    setBusy(true); let off = 0, c = 0, e = 0, f = 0, total = 0;
    try {
      for (;;) {
        const r = await createUsPagesAction(off);
        if (!r.ok) { setMsg(`${r.message} (${c} created so far)`); setBusy(false); return; }
        c += r.created ?? 0; e += r.existing ?? 0; f += r.failed ?? 0; total = r.total ?? total;
        setMsg(`Working: ${Math.min(r.next ?? total, total)} of ${total} types checked, ${c} created...`);
        if (r.next === null) break; if (r.next === undefined) break; off = r.next;
      }
      setMsg(`Done: ${c} draft landing page(s) created, ${e} already existed${f ? `, ${f} failed` : ""}. Add counts, a delivery link and a sample in Products, then publish.`);
    } catch { setMsg(`Stopped early (${c} created). Press the button again; finished types are skipped.`); }
    await load();
  }

  return (
    <div className="space-y-5">
      {d && d.ready === false && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">Migration 0040 is not applied yet. You can preview, but moving is disabled until you run drizzle/0040_category_moves.sql in D1.</p>}
      {msg && <p className="rounded-xl border border-sand-200 bg-white p-3 text-sm" role="status">{msg}</p>}
      <div className="rounded-xl border border-sand-200 bg-white p-4">
        <h2 className="font-semibold">Create US local-business landing pages</h2>
        <p className="mt-1 text-sm text-forest-700">Creates one DRAFT list page per US local-business type (about 1,100: the curated types plus the 1,000 most popular categories from your sheet) in this category, each with the three packages and no record count. Types that already exist are skipped. Add counts, samples and delivery links in Products, then publish.</p>
        <button disabled={busy} onClick={createPages} className="mt-3 rounded-lg bg-forest-900 px-3 py-1.5 text-sm text-sand-50 disabled:opacity-50">Create the pages</button>
      </div>
      {t && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {([["Scanned", t.scanned], ["Will move", t.moves], ["Manual review", t.review], ["Stay unchanged", t.keep], ["Already moved", t.already]] as const).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-sand-200 bg-white p-3"><div className="text-2xl font-semibold">{v}</div><div className="text-xs text-forest-700">{k}</div></div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {(["move", "review", "keep"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-full border px-3 py-1 text-sm ${view === v ? "bg-forest-900 text-sand-50" : "bg-white"}`}>{v === "move" ? "Proposed moves" : v === "review" ? "Manual review" : "Unchanged"}</button>)}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="ml-auto rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand-100 text-xs"><tr><th className="p-2 w-8">
            {view !== "keep" && <input type="checkbox" aria-label="Select all shown" checked={rows.length > 0 && rows.every((r) => sel.has(r.slug))} onChange={(e) => setSel((p) => { const n = new Set(p); rows.forEach((r) => (e.target.checked ? n.add(r.slug) : n.delete(r.slug))); return n; })} />}
          </th><th className="p-2">Product</th><th className="p-2">Current category</th><th className="p-2">Proposed category</th><th className="p-2">Reason</th></tr></thead>
          <tbody>
            {rows.slice(0, 300).map((i: Item) => (
              <tr key={i.slug} className="border-t border-sand-100">
                <td className="p-2">{view !== "keep" && (view === "move" || allowReview) && <input type="checkbox" aria-label={`Select ${i.name}`} checked={sel.has(i.slug)} onChange={() => toggle(i.slug)} />}</td>
                <td className="p-2">{i.name}{!i.inDatabase && <span className="ml-1 text-xs text-forest-500">(built-in)</span>}</td>
                <td className="p-2">{i.categoryName}</td>
                <td className="p-2">{view === "keep" ? "Unchanged" : view === "review" ? "Unchanged until you decide" : "Local Businesses Database"}</td>
                <td className="p-2 text-forest-700">{i.reason}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-4 text-center text-forest-700">{busy ? "Scanning..." : "Nothing here."}</td></tr>}
          </tbody>
        </table>
      </div>
      {rows.length > 300 && <p className="text-xs text-forest-700">Showing the first 300 of {rows.length}. Use search to narrow.</p>}
      <div className="rounded-xl border border-sand-200 bg-white p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={copy} onChange={(e) => setCopy(e.target.checked)} /> Also move built-in products (they are copied into the database under the same slug, not duplicated)</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allowReview} onChange={(e) => setAllowReview(e.target.checked)} /> Allow selecting products from the manual review list</label>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg border px-3 py-1.5 text-sm" onClick={() => setSel(new Set(movable.filter((i) => i.decision === "move").map((i) => i.slug)))}>Select all proposed moves</button>
          {!confirm ? <button disabled={busy || !chosen.length || d?.ready === false} onClick={() => setConfirm(true)} className="rounded-lg bg-forest-900 px-3 py-1.5 text-sm text-sand-50 disabled:opacity-50">Move {chosen.length} selected</button>
            : <><span className="text-sm">Move {chosen.length} product(s) to Local Businesses Database?</span><button onClick={apply} className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm text-white">Yes, move them</button><button onClick={() => setConfirm(false)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button></>}
        </div>
      </div>
      {!!d?.batches?.length && (
        <div className="rounded-xl border border-sand-200 bg-white p-4">
          <h2 className="mb-2 font-semibold">Batches</h2>
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
