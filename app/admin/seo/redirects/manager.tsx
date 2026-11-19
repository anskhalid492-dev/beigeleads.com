"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Empty, Panel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { deleteRedirectAction, saveRedirectAction, toggleRedirectAction } from "../actions";

type Row = { id: number; from: string; to: string; status: number; enabled: boolean; note: string };
const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";

export function RedirectManager({ rows }: { rows: Row[] }) {
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [status, setStatus] = useState(301); const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast(); const router = useRouter();
  const done = (r: { ok: boolean; error?: string }, msg: string) => { toast(r.ok, r.ok ? msg : (r.error ?? "Failed")); if (r.ok) router.refresh(); return r.ok; };
  return (
    <div className="space-y-6">
      <Panel title="Add a redirect">
        <form className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); start(async () => { if (done(await saveRedirectAction({ from, to, status, note }), "Redirect saved")) { setFrom(""); setTo(""); setNote(""); } }); }}>
          <div><label htmlFor="rf" className="mb-1 block text-sm font-semibold text-forest-900">Old address</label><input id="rf" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/blog/old-article" className={input} required /></div>
          <div><label htmlFor="rt" className="mb-1 block text-sm font-semibold text-forest-900">New address</label><input id="rt" value={to} onChange={(e) => setTo(e.target.value)} placeholder="/blog/new-article or https://…" className={input} required /></div>
          <div><label htmlFor="rs" className="mb-1 block text-sm font-semibold text-forest-900">Type</label><select id="rs" value={status} onChange={(e) => setStatus(Number(e.target.value))} className={input}><option value={301}>301 permanent</option><option value={302}>302 temporary</option></select></div>
          <div className="md:col-span-2"><label htmlFor="rn" className="mb-1 block text-sm font-semibold text-forest-900">Note (optional)</label><input id="rn" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={input} /></div>
          <div className="flex items-end"><Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save redirect"}</Button></div>
        </form>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Loops are blocked. Admin, API, checkout, download, opt-out and media addresses cannot be redirected.</p>
      </Panel>
      <Panel title={`Redirects (${rows.length})`}>
        {rows.length === 0 ? <Empty title="No redirects yet" text="Add one above, or create one from an article when you change a live slug." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-sand-200 text-xs"><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-sand-200">{rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-xs">{r.from}{r.note && <p className="font-sans text-xs">{r.note}</p>}</td>
                <td className="px-4 py-3 break-all font-mono text-xs">{r.to}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3"><Badge tone={r.enabled ? "good" : "mute"}>{r.enabled ? "Active" : "Paused"}</Badge></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => start(async () => { done(await toggleRedirectAction(r.id, !r.enabled), r.enabled ? "Redirect paused" : "Redirect activated"); })}>{r.enabled ? "Pause" : "Activate"}</Button>{" "}
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => { if (window.confirm(`Delete the redirect from ${r.from}?`)) start(async () => { done(await deleteRedirectAction(r.id), "Redirect deleted"); }); }}>Delete</Button>
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Panel>
    </div>
  );
}
