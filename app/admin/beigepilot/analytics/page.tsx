import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { analytics } from "@/lib/beigepilot/history";
import { usageMonth } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";

export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [a, month] = await Promise.all([analytics(env, 14), usageMonth(env)]);
  const max = Math.max(1, ...a.days.map((d) => d.requests));
  const rated = a.up + a.down;
  return (
    <>
      <PageHeader title="Analytics" text="Real numbers only, last 14 days unless stated. Nothing is estimated." />
      <BpNav here="/admin/beigepilot/analytics" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Answers (14 days)" value={a.days.reduce((n, d) => n + d.requests, 0)} hint={`${a.days.reduce((n, d) => n + d.errors, 0)} failed`} />
        <StatCard label="Helpful ratings" value={rated ? `${Math.round((a.up / rated) * 100)}%` : "No ratings yet"} hint={rated ? `${a.up} up, ${a.down} down` : "Visitors rate answers with thumbs."} />
        <StatCard label="Handoff requests" value={a.leads} hint="Forms sent to your team" />
        <StatCard label="Unanswered, open" value={a.unanswered} hint="Questions waiting for an answer" />
      </div>
      <Panel title="Answers per day">
        <div className="flex h-44 items-end gap-1.5 px-5 pt-5" role="img" aria-label="Answers per day, last 14 days">
          {a.days.map((d) => <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1"><span className="text-[0.65rem]">{d.requests || ""}</span><div className="w-full rounded-t bg-forest-500" style={{ height: `${Math.max(2, (d.requests / max) * 100)}%` }} title={`${d.day}: ${d.requests} answers, ${d.tokens} tokens`} /></div>)}
        </div>
        <div className="flex gap-1.5 px-5 pb-4 pt-1">{a.days.map((d) => <span key={d.day} className="flex-1 text-center text-[0.6rem]">{d.day.slice(8)}</span>)}</div>
      </Panel>
      <Panel title="This month" className="mt-6"><dl className="grid gap-4 p-5 sm:grid-cols-3 text-sm">
        <div><dt>Requests</dt><dd className="display text-2xl text-forest-900">{month.requests}</dd></div>
        <div><dt>Tokens in / out</dt><dd className="display text-2xl text-forest-900">{month.tokensIn.toLocaleString()} / {month.tokensOut.toLocaleString()}</dd></div>
        <div><dt>Estimated cost</dt><dd className="display text-2xl text-forest-900">{month.requests === 0 ? "$0.00" : month.costUsd === null ? "Set token prices" : `$${month.costUsd.toFixed(2)}`}</dd></div></dl></Panel>
      <p className="mt-4 text-xs">Saved conversations ({a.conversations} in this period, {a.handoffs} asked for a human) are counted only when saving is turned on. Conversion to orders is not measured: chats are not linked to purchases.</p>
    </>
  );
}
