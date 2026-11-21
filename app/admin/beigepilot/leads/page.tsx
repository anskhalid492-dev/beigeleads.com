import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { LEAD_STATUSES, listLeads } from "@/lib/beigepilot/leads";
import { BpNav } from "../nav";
import { leadAction, retryLeadEmailAction } from "../actions";

export const dynamic = "force-dynamic";
const TABS = ["new", "in_progress", "resolved", "closed", "all"] as const;
const LABEL: Record<string, string> = { new: "New", in_progress: "In Progress", resolved: "Resolved", closed: "Closed", contacted: "In Progress", all: "All" };
const tone = (v: string) => (v === "sent" ? "text-forest-700" : v === "failed" ? "font-bold text-red-700" : "");
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await guardAdmin();
  const status = (await searchParams).s ?? "new";
  const { ready, items } = await listLeads(getCloudflareContext().env, status);
  return (
    <>
      <PageHeader title="Support Requests" text="Tickets from people who asked BeigePilot for a human. Each has a reference number, the message, a chat summary if the person agreed to share it, and the real result of both emails." />
      <BpNav here="/admin/beigepilot/leads" />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0038 in D1 to save support requests (and 0043 for the chat summary). Until then the form in the chat will fail.</p>}
      <nav className="mb-4 flex gap-1.5">{TABS.map((t) => <Link key={t} href={`/admin/beigepilot/leads?s=${t}`} className={`rounded-full border px-3 py-1 text-sm font-semibold ${status === t ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900"}`}>{LABEL[t]}</Link>)}</nav>
      <Panel>
        {items.length === 0 ? <Empty title="No requests" text="They appear when a visitor presses “Contact Our Team” in the chat and sends the form." /> : (
          <ul className="divide-y divide-sand-200">
            {items.map((l) => (
              <li key={l.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-forest-900">{l.name}</p><a href={`mailto:${l.email}?subject=Re: ${l.reference}`} className="text-sm font-semibold text-purple-700 underline">{l.email}</a><Badge tone={l.status === "new" ? "warn" : l.status === "closed" ? "mute" : "good"}>{l.status}</Badge><Badge tone={l.ownerNotify === "sent" ? "good" : "warn"}>alert {l.ownerNotify}</Badge></div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{l.message}</p>
                <p className="mt-1 text-xs">{l.reference} · {fmtDate(new Date(l.createdAt * 1000))}{l.page && ` · from ${l.page}`} · consent given</p>
                {l.summary && <details className="mt-1 text-sm"><summary className="cursor-pointer font-semibold text-purple-700">Conversation summary (shared by the customer)</summary><p className="mt-1 whitespace-pre-wrap rounded-lg bg-sand-100 p-3 text-xs">{l.summary}</p></details>}
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span>Support email: <b className={tone(l.ownerNotify)}>{l.ownerNotify}</b></span>
                  <span>Customer confirmation: <b className={tone(l.customerEmail)}>{l.customerEmail}</b></span>
                  {(l.ownerNotify !== "sent" || l.customerEmail !== "sent") && <form action={retryLeadEmailAction} className="flex gap-1.5"><input type="hidden" name="ref" value={l.reference} />
                    {l.ownerNotify !== "sent" && <button name="which" value="owner" className="rounded-full border border-forest-900 px-2.5 py-0.5 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Retry support email</button>}
                    {l.customerEmail !== "sent" && <button name="which" value="customer" className="rounded-full border border-forest-900 px-2.5 py-0.5 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Retry confirmation</button>}</form>}
                </p>
                <form action={leadAction} className="mt-2 flex flex-wrap items-center gap-2"><input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="rounded-lg border border-sand-300 px-2 py-1.5 text-sm">{LEAD_STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                  <input name="note" defaultValue={l.note} placeholder="Internal note (never shown to the visitor)" maxLength={1000} className="min-w-64 flex-1 rounded-lg border border-sand-300 px-3 py-1.5 text-sm" />
                  <Button size="sm" type="submit">Save</Button><Button size="sm" variant="secondary" type="submit" name="op" value="delete">Delete</Button></form>
              </li>))}
          </ul>)}
      </Panel>
    </>
  );
}
