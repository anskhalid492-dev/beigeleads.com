"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/admin/ui";
import { COLUMN_LABELS, buildProduct, detectMapping, parseWoo, REQUIRED, type Column, type Mapping } from "@/lib/import/woo";
import type { ImportRow, PlanItem } from "@/lib/import/store";
import { finishImportAction, importBatchAction, planAction, startImportAction } from "./actions";

const BATCH = 25;
const sel = "rounded-lg border border-sand-300 bg-white px-2 py-1 text-sm";
const count = <T,>(xs: T[], f: (x: T) => string) => { const m = new Map<string, number>(); for (const x of xs) m.set(f(x), (m.get(f(x)) ?? 0) + 1); return [...m].sort((a, b) => b[1] - a[1]); };

/** Pilot = a spread of products (channels, countries, simple + variable) so problems show early. */
function pilotPick(rows: ImportRow[], n: number): ImportRow[] {
  const groups = new Map<string, ImportRow[]>();
  for (const r of rows) { const k = `${r.channel}|${r.group}|${r.sourceVariations > 0 ? "v" : "s"}`; (groups.get(k) ?? groups.set(k, []).get(k)!).push(r); }
  const out: ImportRow[] = []; const lists = [...groups.values()];
  for (let i = 0; out.length < n && lists.some((l) => l[i]); i++) for (const l of lists) if (l[i] && out.length < n) out.push(l[i]);
  return out;
}

export function Wizard() {
  const [text, setText] = useState<string | null>(null);
  const [file, setFile] = useState("");
  const [map, setMap] = useState<Mapping>({});
  const [policy, setPolicy] = useState<"skip" | "update" | "separate">("skip");
  const [pilot, setPilot] = useState(true);
  const [plan, setPlan] = useState<PlanItem[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [prog, setProg] = useState<{ done: number; total: number; created: number; updated: number; skipped: number; failed: number } | null>(null);
  const [errs, setErrs] = useState<{ sourceId: string; message: string }[]>([]);

  const parsed = useMemo(() => (text ? parseWoo(text, Object.keys(map).length ? map : undefined) : null), [text, map]);
  const all = useMemo(() => (parsed ? parsed.products.map((p) => buildProduct(p) as unknown as ImportRow) : []), [parsed]);
  const rows = useMemo(() => (pilot ? pilotPick(all, 30) : all), [all, pilot]);
  const withFlag = (f: string) => rows.filter((r) => r.flags.some((x) => x.toLowerCase().includes(f))).length;
  const dupes = useMemo(() => { const s = new Set<string>(); let d = 0; for (const r of all) { if (s.has(r.slug)) d++; s.add(r.slug); } return d; }, [all]);

  async function load(f: File) {
    setMsg(""); setPlan(null); setProg(null); setErrs([]); setMap({}); setFile(f.name);
    const t = await f.text(); setText(t);
    setMap(detectMapping(parseWoo(t).headers));
  }
  async function check() {
    setBusy(true); setMsg(""); const items: PlanItem[] = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const r = await planAction(rows.slice(i, i + BATCH), policy);
      if (!r.ok) { setMsg(r.message ?? "Check failed."); setBusy(false); return; }
      items.push(...(r.items ?? []));
    }
    setPlan(items); setBusy(false);
  }
  async function run() {
    setBusy(true); setMsg(""); setErrs([]);
    const s = await startImportAction(file, rows.length);
    if (!s.ok || !s.importId) { setMsg(s.message ?? "Could not start."); setBusy(false); return; }
    const p = { done: 0, total: rows.length, created: 0, updated: 0, skipped: 0, failed: 0 }; setProg({ ...p });
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      const r = await importBatchAction(s.importId, chunk, policy);
      if (!r.ok) { setMsg(`${r.message} Stopped after ${p.done} of ${p.total}.`); setBusy(false); await finishImportAction(s.importId); return; }
      p.done += chunk.length; p.created += r.created ?? 0; p.updated += r.updated ?? 0; p.skipped += r.skipped ?? 0; p.failed += r.failed ?? 0;
      setErrs((e) => [...e, ...(r.errors ?? [])]); setProg({ ...p });
    }
    await finishImportAction(s.importId);
    setMsg("Finished. Review the products under Imported products."); setBusy(false);
  }
  const counts = plan ? { create: plan.filter((x) => x.action === "create").length, update: plan.filter((x) => x.action === "update").length, skip: plan.filter((x) => x.action === "skip").length, error: plan.filter((x) => x.action === "error").length } : null;

  return (
    <div className="space-y-6">
      <Panel title="1. Upload the export">
        <div className="space-y-3 p-5 text-sm">
          <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
          <p>The file is read in your browser. Nothing is saved until you press Import.</p>
        </div>
      </Panel>

      {parsed && (
        <>
          <Panel title="2. Column mapping">
            <div className="space-y-3 p-5 text-sm">
              {parsed.missingRequired.length > 0 && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-900">Required columns not found: {parsed.missingRequired.map((c) => COLUMN_LABELS[c]).join(", ")}. Pick them below.</p>}
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(COLUMN_LABELS) as Column[]).map((c) => (
                  <label key={c} className="flex items-center justify-between gap-2"><span>{COLUMN_LABELS[c]}{REQUIRED.includes(c) && " *"}</span>
                    <select className={sel} value={map[c] ?? ""} onChange={(e) => setMap({ ...map, [c]: e.target.value || undefined })}>
                      <option value="">Not used</option>{parsed.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select></label>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="3. Preview">
            <div className="space-y-4 p-5 text-sm">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Rows in file", parsed.rows], ["Products found", all.length], ["Same name or slug twice in the file", dupes], ["Restricted (kept draft)", all.filter((r) => r.restricted.length).length], ["No download link", all.filter((r) => r.packages.some((p) => !p.link)).length], ["Missing price", all.filter((r) => r.packages.some((p) => !p.priceUsdCents)).length], ["Country not detected", all.filter((r) => r.flags.some((f) => /country/i.test(f))).length], ["More than 3 variations", all.filter((r) => r.droppedVariations > 0).length]].map(([k, v]) => <div key={String(k)} className="rounded-xl border border-sand-300 p-3"><dd className="display text-2xl text-forest-900">{v}</dd><dt className="text-xs">{k}</dt></div>)}
              </dl>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><p className="font-semibold">By channel</p><ul>{count(all, (r) => r.channel).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul></div>
                <div><p className="font-semibold">Top countries</p><ul>{count(all, (r) => r.countryName).slice(0, 8).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul></div>
              </div>
              <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-xs"><thead><tr className="border-b"><th className="py-1 pr-2">Name</th><th>Slug</th><th>Category</th><th>Country</th><th>Packages</th><th>Flags</th></tr></thead>
                <tbody>{rows.slice(0, 12).map((r) => <tr key={r.sourceId} className="border-b align-top"><td className="py-1 pr-2">{r.name}</td><td>{r.slug}</td><td>{r.categoryName}</td><td>{r.countryName}</td><td>{r.packages.map((p) => `${p.name} $${(p.priceUsdCents / 100).toFixed(0)}`).join(", ")}</td><td>{r.flags.length}{r.restricted.length ? " · restricted" : ""}</td></tr>)}</tbody></table></div>
            </div>
          </Panel>

          <Panel title="4. Options and import">
            <div className="space-y-4 p-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={pilot} onChange={(e) => { setPilot(e.target.checked); setPlan(null); }} /> Pilot: import only 30 products chosen across channels and countries ({rows.length} selected)</label>
              <label className="flex items-center gap-2">If a product already exists:
                <select className={sel} value={policy} onChange={(e) => { setPolicy(e.target.value as typeof policy); setPlan(null); }}>
                  <option value="skip">Skip it</option><option value="update">Update it (drafts only)</option><option value="separate">Create a separate product</option></select></label>
              <div className="flex flex-wrap gap-3"><Button type="button" variant="secondary" disabled={busy || !rows.length || parsed.missingRequired.length > 0} onClick={check}>Check against the database</Button></div>
              {counts && <p className="rounded-lg bg-forest-100 p-3">Would create {counts.create}, update {counts.update}, skip {counts.skip}, errors {counts.error}.{plan?.filter((x) => x.action === "error").slice(0, 5).map((x) => <span key={x.sourceId} className="block text-xs">{x.sourceId}: {x.reason}</span>)}</p>}
              {plan && <label className="flex items-center gap-2"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} /> I checked the preview. Everything is imported as a draft and nothing is published.</label>}
              <Button type="button" disabled={busy || !plan || !ok} onClick={run}>{busy ? "Working…" : `Import ${rows.length} products`}</Button>
              {prog && <div role="status"><div className="h-2 rounded-full bg-sand-200"><div className="h-2 rounded-full bg-forest-500" style={{ width: `${Math.round((prog.done / Math.max(1, prog.total)) * 100)}%` }} /></div><p className="mt-1">{prog.done} of {prog.total} · created {prog.created}, updated {prog.updated}, skipped {prog.skipped}, failed {prog.failed}</p></div>}
              {msg && <p role="status" className="rounded-lg bg-sand-100 p-3">{msg}</p>}
              {errs.length > 0 && <ul className="list-disc pl-5 text-xs">{errs.slice(0, 50).map((e, i) => <li key={i}>{e.sourceId}: {e.message}</li>)}</ul>}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
