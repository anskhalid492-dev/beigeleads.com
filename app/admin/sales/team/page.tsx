import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { fmtDay, fmtUsd } from "@/lib/sales/reward";
import { listRequests, REMINDER_HOURS, REQUEST_DAYS } from "@/lib/sales/team";
import { RequestRowActions } from "../forms";

export const dynamic = "force-dynamic";
const tone = { pending: "info", viewed: "info", approved: "warn", paid: "good", declined: "bad", expired: "mute", cancelled: "mute" } as const;
export default async function TeamRequestsPage() {
  await guardAdmin();
  const rows = await listRequests(getDbFromEnv(getCloudflareContext().env));
  return (<><PageHeader title="Team Purchase Requests" text={`A team member asks a manager to approve and pay. Valid ${REQUEST_DAYS} days, manager reminder after ${REMINDER_HOURS} hours. "Paid" always comes from the order's own paid status on the network; there is no manual paid button here.`} />
    <Panel title="Requests">
      {rows === null ? <p className="p-5 text-sm">Run migration 0042 in D1 first.</p> : rows.length === 0 ? <Empty title="No requests yet" text="Requests appear when a team member uses “Request manager approval” in the cart." /> : (
        <div className="overflow-x-auto"><table className="w-full text-left text-sm">
          <thead className="border-b border-sand-200 text-forest-900"><tr><th className="px-5 py-3">Request</th><th>Requester</th><th>Manager</th><th>Databases</th><th>Total</th><th>Status</th><th>Created</th><th>Expires</th><th>Order</th><th>Emails</th><th className="pr-5">Actions</th></tr></thead>
          <tbody className="divide-y divide-sand-200">{rows.map((r) => (
            <tr key={r.id} className="align-top"><td className="px-5 py-3 font-mono">{r.reference}</td><td>{r.requester}</td><td>{r.manager}</td><td className="max-w-xs">{r.items.map((i) => `${i.name} (${i.pkg})`).join("; ")}</td><td>{fmtUsd(r.totalCents)}</td>
              <td><Badge tone={tone[r.status]}>{r.status}</Badge>{r.declineReason ? <span className="mt-1 block text-xs">{r.declineReason}</span> : null}</td><td>{fmtDay(r.createdAt)}</td><td>{fmtDay(r.expiresAt)}</td><td>{r.orderId ? r.orderId.slice(0, 8) : "—"}</td><td className="text-xs">requester: {r.requesterEmailStatus}<br />manager: {r.managerEmailStatus}</td>
              <td className="pr-5"><RequestRowActions id={r.id} open={r.status === "pending" || r.status === "viewed"} /></td></tr>))}</tbody>
        </table></div>)}
    </Panel></>);
}
