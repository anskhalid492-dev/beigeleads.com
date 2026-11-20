"use client";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { FIELDS, type FieldKey, type Mapping, type Raw } from "@/lib/glossary/clean";
import { DEFAULT_OPTS, planImport, summarize, type Existing, type Known, type Opts, type PlanRow } from "@/lib/glossary/plan";
import { applyMapping, guessMapping, parseCsv, parseJson, tableFromGrid, toCsv, type Table } from "@/lib/glossary/tabular";
import { readXlsx } from "@/lib/glossary/xlsx";
import { importBatchAction, importContextAction } from "../actions";

const MAX_BYTES = 15 * 1024 * 1024; const MAX_ROWS = 5000;
const REQUIRED: FieldKey[] = ["term", "shortDefinition"];
type Filter = "all" | "create" | "update" | "skip" | "error" | "warn";
type Report = { created: number; updated: number; skipped: number; failed: number; lines: { row: number; term: string; action: string; message: string }[] };
const tone = { create: "good", update: "info", skip: "mute", error: "bad" } as const;
const label = { create: "Will add", update: "Will update", skip: "Will skip", error: "Error" } as const;

export function ImportWizard() {
  const [table, setTable] = useState<Table | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Mapping>({});
  const [ctx, setCtx] = useState<{ existing: Existing[]; known: Known } | null>(null);
  const [opts, setOpts] = useState<Opts>(DEFAULT_OPTS);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const cancel = useRef(false);

  const load = useCallback(async (file: File) => {
    setError(""); setReport(null); setTable(null); setBusy(true);
    try {
      if (file.size > MAX_BYTES) throw new Error("This file is larger than 15 MB. Split it into smaller files.");
      const ext = file.name.toLowerCase().split(".").pop();
      let t: Table;
      if (ext === "xlsx") t = tableFromGrid(readXlsx(new Uint8Array(await file.arrayBuffer())));
      else if (ext === "json") t = parseJson(await file.text());
      else if (ext === "csv" || ext === "txt") t = tableFromGrid(parseCsv(await file.text()));
      else throw new Error("Use a .csv, .xlsx or .json file.");
      if (!t.headers.length || !t.rows.length) throw new Error("No rows were found in this file. The first row must contain column names.");
      if (t.rows.length > MAX_ROWS) throw new Error(`This file has ${t.rows.length} rows. The limit is ${MAX_ROWS} per file. Split it.`);
      const c = await importContextAction();
      if (!c.ok) throw new Error(c.message || "Could not load the glossary.");
      setCtx({ existing: c.existing, known: c.known }); setFileName(file.name); setTable(t); setMapping(guessMapping(t.headers)); setFilter("all"); setPage(0);
    } catch (e) { setError(e instanceof Error ? e.message : "This file could not be read."); } finally { setBusy(false); }
  }, []);

  const missing = REQUIRED.filter((k) => !mapping[k]);
  const plan = useMemo<PlanRow[]>(() => (table && ctx && !missing.length ? planImport(table.rows.map((r, i) => ({ raw: applyMapping(r, mapping), row: i + 2 })), ctx.existing, ctx.known, opts) : []), [table, ctx, mapping, opts, missing.length]);
  const sum = useMemo(() => summarize(plan), [plan]);
  const shown = useMemo(() => plan.filter((p) => filter === "all" || (filter === "warn" ? p.action !== "error" && p.warnings.length > 0 : p.action === filter)), [plan, filter]);
  const PER = 25; const pages = Math.max(1, Math.ceil(shown.length / PER));
  const doable = plan.filter((p) => p.action === "create" || p.action === "update");

  async function run() {
    if (!doable.length) return;
    cancel.current = false; setBusy(true); setError(""); setReport(null);
    const rep: Report = { created: 0, updated: 0, skipped: plan.filter((p) => p.action === "skip").length, failed: plan.filter((p) => p.action === "error").length, lines: [] };
    for (const p of plan) if (p.action === "skip" || p.action === "error") rep.lines.push({ row: p.row, term: p.entry.term, action: p.action === "skip" ? "skipped" : "failed", message: p.action === "skip" ? p.note ?? "" : p.errors.join(" ") });
    // batches limited by row count and by payload size
    const batches: PlanRow[][] = []; let cur: PlanRow[] = []; let size = 0;
    for (const p of doable) { const s = JSON.stringify(rawOf(p)).length; if (cur.length && (cur.length >= 40 || size + s > 400_000)) { batches.push(cur); cur = []; size = 0; } cur.push(p); size += s; }
    if (cur.length) batches.push(cur);
    let done = 0; setProgress({ done: 0, total: doable.length });
    function rawOf(p: PlanRow): { row: number; raw: Raw } { const src = table!.rows[p.row - 2]; return { row: p.row, raw: applyMapping(src, mapping) }; }
    for (const b of batches) {
      if (cancel.current) { setError("Stopped. Rows already saved stay saved."); break; }
      const r = await importBatchAction(b.map(rawOf), opts);
      if (!r.ok || !r.result) { setError(r.message ?? "A batch failed."); rep.failed += b.length; for (const p of b) rep.lines.push({ row: p.row, term: p.entry.term, action: "failed", message: r.message ?? "Batch failed." }); }
      else { rep.created += r.result.created; rep.updated += r.result.updated; rep.skipped += r.result.skipped; rep.failed += r.result.failed; rep.lines.push(...r.result.rows.filter((x) => x.action !== "created")); }
      done += b.length; setProgress({ done, total: doable.length });
    }
    setReport(rep); setBusy(false); setProgress(null);
    const c = await importContextAction(); if (c.ok) setCtx({ existing: c.existing, known: c.known });
  }

  function downloadReport() {
    if (!report) return;
    const grid = [["Row", "Term", "Result", "Message"], ...report.lines.sort((a, b) => a.row - b.row).map((l) => [String(l.row), l.term, l.action, l.message])];
    const url = URL.createObjectURL(new Blob([toCsv(grid)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "glossary-import-report.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const sel = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-base font-bold text-forest-900">1. Choose a file</h2>
        <p className="mt-1 text-sm">CSV, XLSX or JSON, up to {MAX_ROWS.toLocaleString()} entries per file. The file is read in your browser; nothing is saved until you press Import.</p>
        <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void load(f); }} className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-sand-300 bg-sand-50 px-6 py-8 text-center hover:border-forest-500">
          <span className="font-semibold text-forest-900">{fileName || "Drop a file here, or click to choose"}</span>
          <span className="text-xs">.csv  .xlsx  .json</span>
          <input type="file" accept=".csv,.xlsx,.json,.txt" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void load(f); e.target.value = ""; }} />
        </label>
        {busy && !progress && <p className="mt-3 text-sm" role="status">Reading the file…</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{error}</p>}
      </section>

      {table && ctx && (
        <>
          <section className="rounded-2xl border border-sand-200 bg-white p-5">
            <h2 className="text-base font-bold text-forest-900">2. Match the columns</h2>
            <p className="mt-1 text-sm">{table.rows.length.toLocaleString()} rows found. We matched the column names automatically. Change any choice. Term and Short definition are required.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FIELDS.map(([k, name]) => (
                <div key={k}>
                  <label htmlFor={`m-${k}`} className="mb-1 block text-xs font-bold text-forest-900">{name}{REQUIRED.includes(k) && " *"}</label>
                  <select id={`m-${k}`} className={`${sel} w-full ${REQUIRED.includes(k) && !mapping[k] ? "border-red-400" : ""}`} value={mapping[k] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [k]: e.target.value || undefined }))}>
                    <option value="">{k === "slug" ? "Generate from the term" : k === "status" ? "Draft for all" : "Not in my file"}</option>
                    {table.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {missing.length > 0 && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">Choose a column for: {missing.map((k) => FIELDS.find((f) => f[0] === k)![1]).join(", ")}.</p>}
          </section>

          {!missing.length && (
            <section className="rounded-2xl border border-sand-200 bg-white p-5">
              <h2 className="text-base font-bold text-forest-900">3. Choose how to handle what already exists</h2>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <fieldset><legend className="mb-1 text-xs font-bold text-forest-900">If a term or slug already exists</legend>
                  <label className="flex items-center gap-2"><input type="radio" name="mode" checked={opts.mode === "skip"} onChange={() => setOpts({ ...opts, mode: "skip" })} /> Skip it (safe)</label>
                  <label className="mt-1 flex items-center gap-2"><input type="radio" name="mode" checked={opts.mode === "update"} onChange={() => setOpts({ ...opts, mode: "update" })} /> Update it with the file’s non-empty fields</label>
                </fieldset>
                <fieldset><legend className="mb-1 text-xs font-bold text-forest-900">Safety</legend>
                  <label className={`flex items-center gap-2 ${opts.mode === "skip" ? "opacity-50" : ""}`}><input type="checkbox" disabled={opts.mode === "skip"} checked={opts.allowUpdatePublished} onChange={(e) => setOpts({ ...opts, allowUpdatePublished: e.target.checked })} /> Allow updating published entries</label>
                  <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={opts.forceDraft} onChange={(e) => setOpts({ ...opts, forceDraft: e.target.checked })} /> Import new entries as drafts, whatever the Status column says</label>
                </fieldset>
              </div>

              <h2 className="mt-6 text-base font-bold text-forest-900">4. Check the preview</h2>
              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter preview">
                {([["all", `All ${plan.length}`], ["create", `New ${sum.create}`], ["update", `Updates ${sum.update}`], ["skip", `Skipped ${sum.skip}`], ["error", `Errors ${sum.error}`], ["warn", `Warnings ${sum.warn}`]] as [Filter, string][]).map(([k, t]) => (
                  <button key={k} type="button" aria-pressed={filter === k} onClick={() => { setFilter(k); setPage(0); }} className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold ${filter === k ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900"}`}>{t}</button>
                ))}
              </div>
              <div className="mt-4 overflow-x-auto rounded-xl border border-sand-200">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-sand-50 text-xs text-forest-500"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Term</th><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Details</th></tr></thead>
                  <tbody>
                    {shown.slice(page * PER, page * PER + PER).map((p) => (
                      <tr key={p.row} className="border-t border-sand-200 align-top">
                        <td className="px-3 py-2">{p.row}</td><td className="px-3 py-2 font-semibold text-forest-900">{p.entry.term || "—"}</td><td className="px-3 py-2 font-mono text-xs">{p.entry.slug || "—"}</td><td className="px-3 py-2">{p.entry.category || "—"}</td><td className="px-3 py-2">{p.entry.status === "published" ? "Published" : "Draft"}</td>
                        <td className="px-3 py-2"><Badge tone={tone[p.action]}>{label[p.action]}</Badge></td>
                        <td className="px-3 py-2 text-xs">{[...p.errors.map((e) => `Error: ${e}`), p.note, ...p.warnings.map((w) => `Warning: ${w}`)].filter(Boolean).map((m, i) => <p key={i} className={m!.startsWith("Error") ? "text-red-800" : m!.startsWith("Warning") ? "text-amber-800" : ""}>{m}</p>)}</td>
                      </tr>
                    ))}
                    {shown.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-sm">Nothing in this view.</td></tr>}
                  </tbody>
                </table>
              </div>
              {pages > 1 && <div className="mt-3 flex items-center gap-4 text-sm"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="underline disabled:opacity-40">Previous</button><span>Page {page + 1} of {pages}</span><button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="underline disabled:opacity-40">Next</button></div>}

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Button type="button" disabled={busy || !doable.length} onClick={run}>{busy && progress ? "Importing…" : `Import ${doable.length} ${doable.length === 1 ? "entry" : "entries"}`}</Button>
                {busy && progress && <button type="button" onClick={() => { cancel.current = true; }} className="text-sm underline">Stop after this batch</button>}
                <p className="text-sm">{sum.create} new, {sum.update} updates, {sum.skip} skipped, {sum.error} with errors (not imported).{opts.forceDraft || plan.every((p) => p.entry.status === "draft") ? " Nothing will be published." : ""}</p>
              </div>
              {progress && <div className="mt-4" role="status"><div className="h-2 overflow-hidden rounded-full bg-sand-200"><div className="h-full bg-forest-500 transition-[width]" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div><p className="mt-1 text-xs">{progress.done} of {progress.total} processed</p></div>}
            </section>
          )}
        </>
      )}

      {report && (
        <section className="rounded-2xl border border-forest-500 bg-forest-100 p-5" role="status">
          <h2 className="text-base font-bold text-forest-900">Import finished</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {([["Added", report.created], ["Updated", report.updated], ["Skipped", report.skipped], ["Failed", report.failed]] as [string, number][]).map(([k, n]) => <div key={k} className="rounded-xl bg-white p-4"><p className="display text-3xl text-forest-900">{n}</p><p className="text-sm">{k}</p></div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm"><button type="button" onClick={downloadReport} className="rounded-full border border-forest-900 px-4 py-1.5 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Download the report (CSV)</button><Link href="/admin/glossary?status=draft" className="font-semibold underline">Review the drafts</Link></div>
        </section>
      )}
    </div>
  );
}
