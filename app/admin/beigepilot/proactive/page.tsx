import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getPro, proStats } from "@/lib/beigepilot/proactive/store";
import { getSettings } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";
import { ProactiveForm } from "./form";

export const dynamic = "force-dynamic";
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : "—");

export default async function ProactivePage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const [pro, st, { s }] = await Promise.all([getPro(env), proStats(env, 30), getSettings(env)]);
  const rows = ([1, 2, 3] as const).map((n) => ({ n, e: st.stages[n] }));
  const tot = rows.reduce((a, r) => a + r.e.impression, 0);
  return (
    <>
      <PageHeader title="Proactive Engagement" text="Short messages Pilo shows above the launcher: at most three per visit, never while chatting or at checkout, and never opening the chat by itself." />
      <BpNav here="/admin/beigepilot/proactive" />
      <div className="mb-6">
        <Panel title="Last 30 days, per message">
          {!st.ready ? <p className="text-sm text-forest-700">Run migration 0046 in D1 to start collecting these numbers.</p> : tot === 0 ? <p className="text-sm text-forest-700">No messages shown yet.</p> : (
            <>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">{rows.map(({ n, e }) => <StatCard key={n} label={`Message ${n}`} value={`${e.impression} shown`} hint={`Click rate ${pct(e.click, e.impression)} · chats started ${pct(e.conversation_start, e.impression)}`} />)}</div>
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-forest-700"><tr><th className="py-1 pr-3">Message</th>{["Shown", "Clicked", "Dismissed", "Chat opened", "Chat started", "Lists recommended", "Added to cart", "Purchases"].map((h) => <th key={h} className="px-2 py-1">{h}</th>)}</tr></thead>
                <tbody>{rows.map(({ n, e }) => <tr key={n} className="border-t border-sand-200"><td className="py-1.5 pr-3 font-semibold">Message {n}</td>{[e.impression, e.click, e.dismiss, e.chat_open, e.conversation_start, e.product_rec, e.add_to_cart, e.purchase].map((v, i) => <td key={i} className="px-2 py-1.5">{v}</td>)}</tr>)}</tbody></table></div>
              <p className="mt-3 text-xs text-forest-700">Each number counts visits (sessions), once per stage and event. Chat opened, chat started, lists recommended, add to cart and purchases are <b>associated</b> with the most recent message of the same visit. They show what happened afterwards, not that the message caused it.</p>
              {st.templates.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-purple-700">By template</summary><ul className="mt-2 text-sm">{st.templates.map((t) => <li key={t.id}>{t.id}: {t.impressions} shown, {t.clicks} clicked ({pct(t.clicks, t.impressions)})</li>)}</ul></details>}
            </>
          )}
        </Panel>
      </div>
      <div className="max-w-4xl"><ProactiveForm initial={pro} name={s.name} /></div>
    </>
  );
}
