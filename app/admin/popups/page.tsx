import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { eventCounts, listCampaigns } from "@/lib/popups/store";
import { importPopupsAction, setPopupStatusAction } from "./actions";

export const dynamic = "force-dynamic";
const STAGE = { tofu: "Awareness", mofu: "Consideration", bofu: "Purchase", post: "After purchase" } as const;
const TONE = { draft: "mute", live: "good", paused: "warn", archived: "mute" } as const;

export default async function PopupsPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const { ready, items } = await listCampaigns(env);
  const counts = ready ? await eventCounts(env) : {};
  const live = items.filter((c) => c.status === "live").length;
  return (
    <>
      <PageHeader title="Popups" text="Behavioral popup campaigns. All start as drafts: nothing shows to visitors until you set one live." />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Popups need migration 0025 in D1. Until then nothing is shown to visitors.</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Campaigns" value={items.length} />
        <StatCard label="Live" value={live} hint="At most one popup is shown per page view." />
        <StatCard label="Drafts" value={items.filter((c) => c.status === "draft").length} />
      </div>
      {ready && items.length === 0 ? (
        <Panel><Empty title="No campaigns yet" text="Add the 12 built-in campaigns as drafts. Nothing goes live by itself." />
          <form action={importPopupsAction} className="px-5 pb-5"><Button type="submit">Add the 12 draft campaigns</Button></form></Panel>
      ) : ready && (
        <Panel title="Campaigns">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead className="border-b border-sand-200 text-forest-900"><tr><th className="px-5 py-3">Campaign</th><th>Stage</th><th>Format</th><th>Status</th><th>Shown</th><th>Clicked</th><th>Closed</th><th className="pr-5">Action</th></tr></thead>
            <tbody className="divide-y divide-sand-200">
              {items.map((c) => { const k = counts[c.id] ?? {}; return (
                <tr key={c.id} className="align-top">
                  <td className="px-5 py-3"><p className="font-bold text-forest-900">{c.name}</p><p className="max-w-xs text-xs">{c.headline}</p></td>
                  <td>{STAGE[c.stage]}</td><td>{c.format}</td>
                  <td><Badge tone={TONE[c.status]}>{c.status}</Badge></td>
                  <td>{k.impression ?? 0}</td><td>{k.click ?? 0}</td><td>{k.dismiss ?? 0}</td>
                  <td className="pr-5"><form action={setPopupStatusAction} className="flex gap-1.5"><input type="hidden" name="id" value={c.id} />
                    {c.status !== "live" && <Button type="submit" name="status" value="live" size="sm">Set live</Button>}
                    {c.status === "live" && <Button type="submit" name="status" value="paused" size="sm" variant="secondary">Pause</Button>}
                    {c.status !== "archived" && <Button type="submit" name="status" value="archived" size="sm" variant="secondary">Archive</Button>}
                    {c.status !== "draft" && c.status !== "live" && <Button type="submit" name="status" value="draft" size="sm" variant="secondary">Back to draft</Button>}
                  </form></td>
                </tr>); })}
            </tbody></table></div>
          <p className="border-t border-sand-200 px-5 py-3 text-xs">Counts are the last 30 days of anonymous events (no address, cookie or account is stored). They count what happened on screen; revenue is not attributed to popups. Visitors who have a Do Not Track or Global Privacy Control signal are not counted.</p>
        </Panel>
      )}
    </>
  );
}
