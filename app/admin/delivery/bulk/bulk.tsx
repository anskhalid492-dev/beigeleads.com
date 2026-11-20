"use client";
import { useMemo, useState } from "react";
import { parseCsv, tableFromGrid, toCsv } from "@/lib/glossary/tabular";
import { checkRow, type LinkOutcome, type LinkRow, type LinkTarget } from "@/lib/delivery/bulk-check";
import { bulkLinksAction, finishBulkLinksAction } from "./actions";

type Plan = { row: LinkRow; line: number; state: "add" | "replace" | "same" | "bad"; reason?: string; name?: string };
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const pick = (row: Record<string, string>, keys: string[]) => { for (const k of Object.keys(row)) if (keys.includes(norm(k))) return (row[k] ?? "").trim(); return ""; };

export function Bulk({ targets, existing }: { targets: LinkTarget[]; existing: Record<string, string> }) {
  const [file, setFile] = useState(""); const [text, setText] = useState("");
  const [replace, setReplace] = useState(false); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [done, setDone] = useState<LinkOutcome[] | null>(null);
  const tmap = useMemo(() => new Map(targets.map((t) => [t.slug, t])), [targets]);
  const byName = useMemo(() => { const m = new Map<string, LinkTarget[]>(); for (const t of targets) { const k = norm(t.name); m.set(k, [...(m.get(k) ?? []), t]); } return m; }, [targets]);

  const plan: Plan[] = useMemo(() => {
    if (!text.trim()) return [];
    const t = tableFromGrid(parseCsv(text));
    return t.rows.map((r, i): Plan => {
      const ref = pick(r, ["slug", "product slug", "product"]) || pick(r, ["name", "title", "product name"]);
      const pkg = pick(r, ["package", "pkg", "package name"]), url = pick(r, ["url", "link", "download url", "download link", "delivery link"]);
      let slug = tmap.has(ref) ? ref : "";
      if (!slug) { const hit = byName.get(norm(ref)); if (hit?.length === 1) slug = hit[0].slug; else if (hit && hit.length > 1) return { row: { slug: ref, pkg, url }, line: i + 2, state: "bad", reason: "name matches several products: use the slug" }; }
      const row = { slug: slug || ref, pkg, url };
      if (!url) return { row, line: i + 2, state: "bad", reason: "no link in this row" };
      const c = checkRow(row, tmap);
      if (!c.ok) return { row, line: i + 2, state: "bad", reason: c.reason };
      const old = existing[`${row.slug}\u0000${row.pkg}`];
      return { row: { ...row, url: c.url }, line: i + 2, state: old === c.url ? "same" : old ? "replace" : "add", name: tmap.get(row.slug)?.name };
    });
  }, [text, tmap, byName, existing]);

  const n = (s: Plan["state"]) => plan.filter((p) => p.state === s).length;
  const todo = plan.filter((p) => p.state === "add" || (p.state === "replace" && replace));

  async function onFile(f: File | undefined) {
    if (!f) return; setFile(f.name); setDone(null); setMsg("");
    if (f.size > 2_000_000) { setMsg("That file is too large (2 MB max)."); return; }
    setText(await f.text());
  }
  function template() {
    const rows = targets.filter((t) => !Object.keys(existing).some((k) => k.startsWith(`${t.slug}\u0000`))).map((t) => [t.slug, t.name, "", ""]);
    const blob = new Blob([toCsv([["slug", "name", "package", "url"], ...rows])], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "products-without-links.csv"; a.click();
  }
  async function run() {
    setBusy(true); setMsg("Working..."); const all: LinkOutcome[] = [];
    try {
      for (let i = 0; i < todo.length; i += 100) {
        const r = await bulkLinksAction(todo.slice(i, i + 100).map((p) => p.row), replace);
        if (!r.ok || !r.outcomes) { setMsg(r.message ?? "Stopped."); break; }
        all.push(...r.outcomes); setMsg(`Saved ${all.length} of ${todo.length}...`);
      }
      const c = (k: LinkOutcome["result"]) => all.filter((o) => o.result === k).length;
      await finishBulkLinksAction({ added: c("added"), replaced: c("replaced"), skipped: c("skipped"), failed: c("failed"), file: file || "pasted" });
      setDone(all); setMsg(`Done: ${c("added")} added, ${c("replaced")} replaced, ${c("skipped")} skipped, ${c("failed")} failed.`);
    } catch (e) { setMsg(`Stopped: ${e instanceof Error ? e.message : "unknown error"}`); }
    setBusy(false);
  }

  const missing = targets.filter((t) => !Object.keys(existing).some((k) => k.startsWith(`${t.slug}\u0000`))).length;
  return (
    <div className="space-y-5 text-sm">
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <p className="font-semibold text-forest-900">1. Get the file ready</p>
        <p className="mt-1">Columns: <code>slug</code> (or the exact product name), <code>package</code> (leave empty for one link that covers every package), <code>url</code> (https only). {missing} of {targets.length} products have no link yet.</p>
        <button type="button" onClick={template} className="mt-3 rounded-full border border-forest-900 px-4 py-1.5 font-semibold">Download template of products without a link</button>
      </div>
      <div className="rounded-2xl border border-sand-200 bg-white p-5">
        <p className="font-semibold text-forest-900">2. Upload it</p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="mt-2" aria-label="CSV file" />
        <label className="mt-3 flex items-center gap-2"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace links that already exist and are different (otherwise they are skipped)</label>
      </div>
      {plan.length > 0 && (
        <div className="rounded-2xl border border-sand-200 bg-white p-5">
          <p className="font-semibold text-forest-900">3. Check and save</p>
          <p className="mt-1">{plan.length} rows: {n("add")} new, {n("replace")} different from the saved link, {n("same")} unchanged, {n("bad")} with a problem.{n("replace") > 0 && !replace ? " Different links will be skipped unless you tick Replace." : ""}</p>
          {n("bad") > 0 && <ul className="mt-3 max-h-56 list-disc overflow-auto rounded-lg bg-red-50 p-3 pl-7 text-xs text-red-900">{plan.filter((p) => p.state === "bad").slice(0, 80).map((p) => <li key={p.line}>Row {p.line}: {p.row.slug || "(no product)"}: {p.reason}</li>)}</ul>}
          <button type="button" disabled={busy || !todo.length} onClick={run} className="mt-4 rounded-full bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-40">{busy ? "Working..." : `Save ${todo.length} links`}</button>
          <p className="mt-2 text-xs">Anyone with a link can open it. Use a host with private or unguessable links. The owner gets one email summarising the upload.</p>
        </div>
      )}
      {msg && <p role="status" aria-live="polite" className="font-semibold text-forest-900">{msg}</p>}
      {done && done.some((o) => o.result === "failed" || o.result === "skipped") && <ul className="max-h-56 list-disc overflow-auto rounded-lg bg-sand-100 p-3 pl-7 text-xs">{done.filter((o) => o.result === "failed" || o.result === "skipped").slice(0, 80).map((o, i) => <li key={i}>{o.slug}{o.pkg ? ` / ${o.pkg}` : ""}: {o.result} ({o.reason})</li>)}</ul>}
    </div>
  );
}
