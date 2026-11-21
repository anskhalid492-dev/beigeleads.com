import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { analytics } from "@/lib/beigepilot/history";
import { usageMonth } from "@/lib/beigepilot/store";
import { piloStats } from "@/lib/beigepilot/v2/events";
import { LANGS } from "@/lib/beigepilot/v2/lang";
import { BpNav } from "../nav";

export const dynamic = "force-dynamic";
export default async function AnalyticsPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [a, month, v2] = await Promise.all([analytics(env, 14), usageMonth(env), piloStats(env, 30)]);
  const ev = (k: string) => v2.byEvent[k]?.sessions ?? 0;
  const pct = (x: number, y: number) => (y ? `${Math.round((x / y) * 1000) / 10}%` : "—");
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
      <Panel title="Engagement (30 days, visits counted once)" className="mt-6">
        {!v2.ready ? <p className="p-5 text-sm text-forest-700">Run migration 0047 in D1 to start collecting these numbers.</p> : (
          <div className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Chats opened" value={ev("chat_open")} hint="Visits where the chat was opened" />
              <StatCard label="Conversations started" value={ev("conversation_start")} hint={`${pct(ev("conversation_start"), ev("chat_open"))} of opens`} />
              <StatCard label="Lists recommended" value={ev("recommendation")} hint="Visits where Pilo showed lists" />
              <StatCard label="Added to cart from chat" value={ev("add_to_cart")} hint="Associated with the chat" />
              <StatCard label="Follow-up buttons used" value={ev("followup_click")} hint="Quick replies pressed" />
              <StatCard label="Exit-intent shown" value={v2.exit.shown} hint={`${v2.exit.clicked} clicked (${pct(v2.exit.clicked, v2.exit.shown)}), ${v2.exit.dismissed} declined`} />
              <StatCard label="Discount requests" value={ev("discount_inquiry")} hint={`${ev("offer_issued")} offers made, ${ev("offer_accepted")} applied`} />
              <StatCard label="Memory cleared" value={ev("memory_cleared")} hint="Visitors who cleared the chat" />
            </div>
            <h3 className="mt-5 text-sm font-bold text-forest-900">Languages (visits)</h3>
            {v2.languages.length ? <ul className="mt-1 flex flex-wrap gap-2 text-sm">{v2.languages.map((l) => <li key={l.lang} className="rounded-full border border-sand-300 bg-white px-3 py-1"><b>{LANGS.find((x) => x.code === l.lang)?.name ?? l.lang}</b> {l.n}</li>)}</ul> : <p className="mt-1 text-sm text-forest-700">No data yet.</p>}
            <p className="mt-3 text-xs text-forest-700">No message text is stored for these numbers. Orders and revenue linked to offers are on the AI Negotiation tab.</p>
          </div>
        )}
      </Panel>
      <Panel title="This month" className="mt-6"><dl className="grid gap-4 p-5 sm:grid-cols-3 text-sm">
        <div><dt>Requests</dt><dd className="display text-2xl text-forest-900">{month.requests}</dd></div>
        <div><dt>Tokens in / out</dt><dd className="display text-2xl text-forest-900">{month.tokensIn.toLocaleString()} / {month.tokensOut.toLocaleString()}</dd></div>
        <div><dt>Estimated cost</dt><dd className="display text-2xl text-forest-900">{month.requests === 0 ? "$0.00" : month.costUsd === null ? "Set token prices" : `$${month.costUsd.toFixed(2)}`}</dd></div></dl></Panel>
      <p className="mt-4 text-xs">Saved conversations ({a.conversations} in this period, {a.handoffs} asked for a human) are counted only when saving is turned on. Conversion to orders is not measured: chats are not linked to purchases.</p>
    </>
  );
}
