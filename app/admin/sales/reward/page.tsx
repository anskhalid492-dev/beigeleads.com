import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { fmtDay, fmtUsd, listRewards, maskEmail } from "@/lib/sales/reward";
import { loadSalesSettings } from "@/lib/sales/settings";
import { RewardForm, RewardRowActions } from "../forms";

export const dynamic = "force-dynamic";
const tone = { active: "good", used: "mute", expired: "warn", revoked: "bad" } as const;
export default async function RewardPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const { reward } = await loadSalesSettings(env);
  const rows = await listRewards(getDbFromEnv(env));
  return (<><PageHeader title="Second Purchase Offer" text="A personal, single-use code created after a customer's first paid order and emailed to that customer." />
    <Panel title="Settings"><RewardForm s={reward} /></Panel>
    <p className="mt-4 text-sm">Email wording: <Link className="font-semibold underline" href="/admin/system-emails">System Emails</Link> (reward_first, reward_reminder, reward_expiring).</p>
    <Panel title="Issued codes" className="mt-6">
      {rows === null ? <p className="p-5 text-sm">Run migration 0041 in D1 first.</p> : rows.length === 0 ? <Empty title="No codes yet" text="Codes appear after the first paid order." /> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-b border-sand-200 text-forest-900"><tr><th className="px-5 py-3">Customer</th><th>Code</th><th>Status</th><th>Created</th><th>Expires</th><th>Used on order</th><th>Email</th><th className="pr-5">Actions</th></tr></thead>
          <tbody className="divide-y divide-sand-200">{rows.map((r) => (
            <tr key={r.id}><td className="px-5 py-3">{maskEmail(r.email)}</td><td className="font-mono">{r.code}</td><td><Badge tone={tone[r.status]}>{r.status}</Badge></td><td>{fmtDay(r.createdAt)}</td><td>{fmtDay(r.expiresAt)}</td><td>{r.redeemedOrderId ? r.redeemedOrderId.slice(0, 8) : "—"}</td><td>{r.emailStatus}{r.emailError ? ` (${r.emailError})` : ""}</td><td className="pr-5"><RewardRowActions id={r.id} status={r.status} emailStatus={r.emailStatus} /></td></tr>))}</tbody>
        </table><p className="border-t border-sand-200 px-5 py-3 text-xs">Max discount per code: {reward.maxDiscountCents ? fmtUsd(reward.maxDiscountCents) : "none"} (current setting). Emails are masked here.</p></div>)}
    </Panel></>);
}
