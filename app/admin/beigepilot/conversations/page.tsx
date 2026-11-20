import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { listConversations } from "@/lib/beigepilot/history";
import { getSettings } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";
import { deleteAllConversationsAction } from "../actions";

export const dynamic = "force-dynamic";
export default async function ConversationsPage({ searchParams }: { searchParams: Promise<{ f?: string; p?: string }> }) {
  await guardAdmin();
  const sp = await searchParams; const f = sp.f === "handoff" ? "handoff" : "all"; const page = Math.max(0, Number(sp.p) || 0);
  const env = getCloudflareContext().env;
  const [{ ready, items, total }, { s }] = await Promise.all([listConversations(env, f, page * 25), getSettings(env)]);
  return (
    <>
      <PageHeader title="Conversations" text="Saved chats, newest first. Visitor emails, phone-like numbers and keys are replaced before saving." />
      <BpNav here="/admin/beigepilot/conversations" />
      {!s.saveChats && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Saving is OFF, so no new chats are stored. Turn it on in Appearance &amp; Behavior (and mention it in your privacy policy).</p>}
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0039 in D1 (4 statements, one at a time).</p>}
      <nav className="mb-4 flex gap-1.5">{[["all", "All"], ["handoff", "Asked for a human"]].map(([k, l]) => <Link key={k} href={`/admin/beigepilot/conversations?f=${k}`} className={`rounded-full border px-3 py-1 text-sm font-semibold ${f === k ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-300 bg-white text-forest-900"}`}>{l}</Link>)}</nav>
      <Panel>
        {items.length === 0 ? <Empty title="No saved conversations" text="Chats appear here after visitors use BeigePilot with saving turned on." /> : (
          <ul className="divide-y divide-sand-200">{items.map((c) => (
            <li key={c.id}><Link href={`/admin/beigepilot/conversations/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-sand-50">
              <span className="text-sm"><b className="text-forest-900">{fmtDate(new Date(c.lastAt * 1000))}</b> · {c.messages} messages{c.page && ` · ${c.page}`}</span>{c.handoff && <Badge tone="warn">human requested</Badge>}</Link></li>))}</ul>)}
        {total > 25 && <p className="flex gap-3 border-t border-sand-200 px-5 py-3 text-sm">{page > 0 && <Link className="font-semibold text-purple-700" href={`/admin/beigepilot/conversations?f=${f}&p=${page - 1}`}>Newer</Link>}{(page + 1) * 25 < total && <Link className="font-semibold text-purple-700" href={`/admin/beigepilot/conversations?f=${f}&p=${page + 1}`}>Older</Link>}</p>}
      </Panel>
      {total > 0 && <form action={deleteAllConversationsAction} className="mt-5 flex items-center gap-3 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="confirm" value="yes" required />Delete ALL saved conversations permanently</label><Button size="sm" variant="secondary" type="submit">Delete all</Button></form>}
      <p className="mt-3 text-xs">Conversations older than {s.retentionDays} days are removed automatically.</p>
    </>
  );
}
