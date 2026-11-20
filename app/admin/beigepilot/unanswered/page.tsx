import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { listUnanswered } from "@/lib/beigepilot/leads";
import { BpNav } from "../nav";
import { unansweredAction } from "../actions";

export const dynamic = "force-dynamic";
const TABS = ["new", "resolved", "ignored", "all"] as const;
export default async function UnansweredPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await guardAdmin();
  const status = (await searchParams).s ?? "new";
  const { ready, items } = await listUnanswered(getCloudflareContext().env, status);
  return (
    <>
      <PageHeader title="Unanswered Questions" text="Questions BeigePilot could not answer from your content and sent to your team. Only the question text is kept (emails and long numbers are never stored). Turn each one into an answer so the next visitor gets it." />
      <BpNav here="/admin/beigepilot/unanswered" />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0038 in D1 to record unanswered questions.</p>}
      <nav className="mb-4 flex gap-1.5">{TABS.map((t) => <Link key={t} href={`/admin/beigepilot/unanswered?s=${t}`} className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize ${status === t ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900"}`}>{t}</Link>)}</nav>
      <Panel>
        {items.length === 0 ? <Empty title="Nothing here" text="Questions appear when BeigePilot has no answer in your catalog, Help Center, policies or knowledge base." /> : (
          <ul className="divide-y divide-sand-200">
            {items.map((u) => (
              <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div className="max-w-2xl"><p className="font-bold text-forest-900">{u.question}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs"><Badge tone={u.status === "new" ? "warn" : "mute"}>{u.status}</Badge>asked {u.times}×{u.page && ` · from ${u.page}`} · last {fmtDate(new Date(u.lastAt * 1000))}</p></div>
                <form action={unansweredAction} className="flex flex-wrap gap-1.5"><input type="hidden" name="id" value={u.id} />
                  <Button asChild size="sm"><Link href={`/admin/beigepilot/knowledge?new=1&q=${encodeURIComponent(u.question)}&from=${u.id}`}>Write answer</Link></Button>
                  {u.status !== "ignored" && <Button size="sm" variant="secondary" type="submit" name="op" value="ignored">Ignore</Button>}
                  {u.status !== "resolved" && <Button size="sm" variant="secondary" type="submit" name="op" value="resolved">Resolved</Button>}
                  <Button size="sm" variant="secondary" type="submit" name="op" value="delete">Delete</Button></form>
              </li>))}
          </ul>)}
      </Panel>
    </>
  );
}
