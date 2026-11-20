import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { listLeads } from "@/lib/beigepilot/leads";
import { BpNav } from "../nav";
import { leadAction } from "../actions";

export const dynamic = "force-dynamic";
const TABS = ["new", "contacted", "closed", "all"] as const;
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await guardAdmin();
  const status = (await searchParams).s ?? "new";
  const { ready, items } = await listLeads(getCloudflareContext().env, status);
  return (
    <>
      <PageHeader title="Leads & Handoffs" text="People who asked BeigePilot for a human and agreed to be contacted by email. Delete a request when you no longer need it." />
      <BpNav here="/admin/beigepilot/leads" />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0038 in D1 to save handoff requests. Until then the form in the chat will fail.</p>}
      <nav className="mb-4 flex gap-1.5">{TABS.map((t) => <Link key={t} href={`/admin/beigepilot/leads?s=${t}`} className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize ${status === t ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900"}`}>{t}</Link>)}</nav>
      <Panel>
        {items.length === 0 ? <Empty title="No requests" text="They appear when a visitor presses “Contact Our Team” in the chat and sends the form." /> : (
          <ul className="divide-y divide-sand-200">
            {items.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-forest-900">{l.name}</p><a href={`mailto:${l.email}?subject=Re: ${l.reference}`} className="text-sm font-semibold text-purple-700 underline">{l.email}</a><Badge tone={l.status === "new" ? "warn" : l.status === "closed" ? "mute" : "good"}>{l.status}</Badge><Badge tone={l.ownerNotify === "sent" ? "good" : "warn"}>alert {l.ownerNotify}</Badge></div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{l.message}</p>
                <p className="mt-1 text-xs">{l.reference} · {fmtDate(new Date(l.createdAt * 1000))}{l.page && ` · from ${l.page}`} · consent given</p>
                <form action={leadAction} className="mt-2 flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="rounded-lg border border-sand-300 px-2 py-1.5 text-sm"><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select>
                  <input name="note" defaultValue={l.note} placeholder="Internal note (never shown to the visitor)" maxLength={1000} className="min-w-64 flex-1 rounded-lg border border-sand-300 px-3 py-1.5 text-sm" />
                  <Button size="sm" type="submit">Save</Button><Button size="sm" variant="secondary" type="submit" name="op" value="delete">Delete</Button></form>
              </li>))}
          </ul>)}
      </Panel>
    </>
  );
}
