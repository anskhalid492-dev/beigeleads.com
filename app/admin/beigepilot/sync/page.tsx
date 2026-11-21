import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { syncStatus } from "@/lib/beigepilot/sync";
import { BpNav } from "../nav";
import { refreshPiloAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  await guardAdmin();
  const s = await syncStatus(getCloudflareContext().env);
  const when = (ms: number) => (ms ? fmtDate(new Date(ms)) : "none yet");
  return (
    <>
      <PageHeader title="Content Sync" text="Pilo reads the published Help Center and Glossary live (cached for up to 60 seconds). There is no copy to keep in step: publish makes content available, unpublish or delete removes it, and drafts are never read." />
      <BpNav here="/admin/beigepilot/sync" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Help articles Pilo can read" value={s.help.published} hint={`${s.help.drafts} drafts are hidden`} />
        <StatCard label="Glossary terms Pilo can read" value={s.glossary.published} hint={`${s.glossary.drafts} drafts are hidden`} />
        <StatCard label="Help fingerprint" value={s.help.hash || "n/a"} hint={`Newest change: ${when(s.help.newest)}`} />
        <StatCard label="Glossary fingerprint" value={s.glossary.hash || "n/a"} hint={`Newest change: ${when(s.glossary.newest)}`} />
      </div>
      <Panel title="Refresh now">
        <div className="space-y-3 p-5 text-sm">
          <p>Clears the caches Pilo uses for Help, Glossary and your own Knowledge entries. Use it after a big edit if you do not want to wait a minute. A fingerprint changes whenever published text changes.</p>
          <form action={refreshPiloAction}><Button type="submit">Refresh Pilo&apos;s content</Button></form>
        </div>
      </Panel>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Help articles not reviewed in 180 days">
          {s.help.outdated.length === 0 ? <Empty title="Nothing outdated" text="Every published article has a review date inside the last 180 days." /> : (
            <ul className="divide-y divide-sand-200 text-sm">{s.help.outdated.map((a) => <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-2.5"><span>{a.title}</span><Badge tone="warn">{a.updated || "no date"}</Badge></li>)}</ul>
          )}
        </Panel>
        <Panel title="Knowledge entries that repeat a Help article">
          {s.knowledgeDuplicates.length === 0 ? <Empty title="No repeats found" text="Your own Knowledge entries do not share a title with a Help article." /> : (
            <ul className="divide-y divide-sand-200 text-sm">{s.knowledgeDuplicates.map((k) => <li key={k.id} className="px-5 py-2.5">{k.title} <span className="text-xs">(same as {k.matches}; the Help article is read live, so the entry may go stale)</span></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
