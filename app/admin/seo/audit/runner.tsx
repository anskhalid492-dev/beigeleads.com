"use client";
import { useState } from "react";
import { Badge, Empty, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import type { PageAudit } from "@/lib/seo/audit";
import { auditBatchAction } from "../actions";

export function AuditRunner() {
  const [pages, setPages] = useState<PageAudit[]>([]);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function run() {
    setRunning(true); setError(""); setPages([]); setDone(false);
    let offset: number | null = 0;
    while (offset !== null) {
      const r = await auditBatchAction(offset);
      if (!r.ok) { setError(r.error); break; }
      setTotal(r.total); setPages((p) => [...p, ...r.pages]); offset = r.next;
    }
    setRunning(false); setDone(true);
  }
  const verified = pages.reduce((n, p) => n + p.issues.filter((i) => i.kind === "verified").length, 0);
  const tips = pages.reduce((n, p) => n + p.issues.filter((i) => i.kind === "tip").length, 0);
  const flagged = pages.filter((p) => p.issues.length);
  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <p className="text-sm" role="status">{running ? `Checked ${pages.length} of ${total || "…"} pages` : done ? `Checked ${pages.length} pages: ${verified} verified issue${verified === 1 ? "" : "s"}, ${tips} tip${tips === 1 ? "" : "s"}.` : "Nothing has been checked yet."}</p>
          <Button onClick={run} disabled={running}>{running ? "Checking…" : pages.length ? "Run again" : "Run audit"}</Button>
        </div>
        {error && <p role="alert" className="border-t border-sand-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</p>}
        <p className="border-t border-sand-200 px-5 py-3 text-xs"><b>Verified issue</b>: a fact found in the page&apos;s HTML (a missing title, a broken JSON-LD block). <b>Tip</b>: a rule of thumb that may not apply to every page. Results are not saved. The site-wide noindex is expected until launch and is not reported.</p>
      </Panel>
      {done && flagged.length === 0 && <Empty title="No issues found" text="Every checked page passed these checks." />}
      {flagged.length > 0 && (
        <Panel title={`Pages with findings (${flagged.length})`}>
          <ul className="divide-y divide-sand-200 text-sm">
            {flagged.map((p) => (
              <li key={p.path} className="px-5 py-3">
                <p className="font-mono text-xs font-bold text-forest-900">{p.path}</p>
                <ul className="mt-1 space-y-1">{p.issues.map((i) => <li key={i.code} className="flex items-start gap-2"><Badge tone={i.kind === "verified" ? "bad" : "mute"}>{i.kind === "verified" ? "Issue" : "Tip"}</Badge><span>{i.text}</span></li>)}</ul>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
