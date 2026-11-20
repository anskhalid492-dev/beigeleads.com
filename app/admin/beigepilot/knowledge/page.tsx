import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getEntry, listEntries } from "@/lib/beigepilot/knowledge";
import { helpArticles } from "@/lib/help";
import { loadHelp } from "@/lib/help/store";
import { legalBySlug } from "@/lib/legal/docs";
import { BpNav } from "../nav";
import { deleteEntryAction } from "../actions";
import { EntryEditor } from "./editor";

export const dynamic = "force-dynamic";
export default async function KnowledgePage({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string; q?: string; from?: string; saved?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const env = getCloudflareContext().env;
  const [{ ready, items }, help] = await Promise.all([listEntries(env), loadHelp(env).catch(() => null)]);
  const editing = sp.edit ? await getEntry(env, Number(sp.edit)) : null;
  const showForm = !!editing || sp.new !== undefined;
  const helpCount = (help?.articles ?? helpArticles).filter((a) => (a.status ?? "published") === "published").length;
  return (
    <>
      <PageHeader title="Knowledge Base" text="What BeigePilot can answer from. It already reads your published Help Center articles, legal pages and the live catalog. Add your own answers, and list claims it must never make." actions={<Button asChild><Link href="/admin/beigepilot/knowledge?new=1">Add entry</Link></Button>} />
      <BpNav here="/admin/beigepilot/knowledge" />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Run migration 0038 in D1 (3 statements, one at a time) to save entries.</p>}
      {sp.saved && <p className="mb-5 max-w-3xl rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">Entry saved.</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Panel className="p-5"><p className="text-sm font-semibold">Help Center articles read</p><p className="display mt-1 text-3xl text-forest-900">{helpCount}</p><p className="text-xs">Always current. Nothing to sync.</p></Panel>
        <Panel className="p-5"><p className="text-sm font-semibold">Policy pages read</p><p className="display mt-1 text-3xl text-forest-900">{Object.keys(legalBySlug).length}</p><p className="text-xs">Straight from the published legal pages.</p></Panel>
        <Panel className="p-5"><p className="text-sm font-semibold">Your published entries</p><p className="display mt-1 text-3xl text-forest-900">{items.filter((i) => i.status === "published").length}</p><p className="text-xs">Answers and blocked claims below.</p></Panel>
      </div>
      {showForm && <div className="mb-6 max-w-3xl"><EntryEditor key={editing?.id ?? sp.from ?? "new"} entry={editing} preset={sp.q && sp.from ? { title: sp.q, from: Number(sp.from) } : undefined} /></div>}
      <Panel title="Your entries">
        {items.length === 0 ? <Empty title="No entries yet" text="Add the answers your visitors ask for that the Help Center does not cover." /> : (
          <ul className="divide-y divide-sand-200">
            {items.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0 max-w-2xl"><p className="font-bold text-forest-900">{e.title}</p><p className="line-clamp-2 text-sm">{e.answer}</p>
                  <div className="mt-1.5 flex gap-1.5"><Badge tone={e.kind === "restricted" ? "bad" : "info"}>{e.kind === "restricted" ? "Blocked claim" : "Answer"}</Badge><Badge tone={e.status === "published" ? "good" : "mute"}>{e.status}</Badge></div></div>
                <div className="flex gap-2"><Button asChild size="sm" variant="secondary"><Link href={`/admin/beigepilot/knowledge?edit=${e.id}`}>Edit</Link></Button>
                  <form action={deleteEntryAction}><input type="hidden" name="id" value={e.id} /><Button size="sm" variant="secondary" type="submit">Delete</Button></form></div>
              </li>))}
          </ul>)}
      </Panel>
    </>
  );
}
