import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, sql } from "drizzle-orm";
import { Badge, Empty, PageHeader, Panel, StatCard, usd } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { getDbFromEnv, schema } from "@/lib/db";
import { LABEL, isStage } from "@/lib/dfy/state";
import { gate } from "../email-verification/gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "DFY Outbound Orders", robots: { index: false, follow: false } };
const d = (t: number | null) => (t ? new Date(t * 1000).toISOString().slice(0, 10) : "—");

export default async function DfyOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await gate();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  let rows: (typeof schema.dfyOrders.$inferSelect)[] | null = null;
  try { rows = await db.select().from(schema.dfyOrders).orderBy(desc(schema.dfyOrders.createdAt)).limit(300); } catch { rows = null; }
  if (!rows) return <><PageHeader title="DFY Outbound Orders" /><p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0048_dfy.sql in D1 (one statement at a time), then reload.</p></>;
  const q = (sp.q ?? "").toLowerCase();
  const list = rows.filter((r) => (!sp.status || r.status === sp.status) && (!q || r.id.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)));
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  void sql;
  return (
    <>
      <PageHeader title="DFY Outbound Orders" text="Managed outbound service. All operational work is manual; nothing here sends, buys or verifies by itself." actions={<Button asChild variant="secondary"><Link href="/admin/dfy/settings">DFY settings</Link></Button>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting onboarding" value={count("awaiting_onboarding")} /><StatCard label="Onboarding to review" value={count("onboarding_submitted")} />
        <StatCard label="Campaigns active" value={count("campaign_active") + count("testing_optimization") + count("reporting")} /><StatCard label="Paused" value={count("paused")} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Order ID or customer email" aria-label="Search" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Stage" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"><option value="">All stages</option>{Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {list.length === 0 ? <Empty title="No DFY orders" text="Orders appear when a customer starts checkout with a DFY package." /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-sand-200 text-xs text-forest-700"><tr>{["Order", "Customer", "Package", "Price", "Ownership", "Stage", "Capacity", "Created"].map((h) => <th key={h} className="px-3 py-2">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-sand-200">{list.map((r) => (
              <tr key={r.id} className="hover:bg-sand-50">
                <td className="px-3 py-2.5"><Link className="font-mono font-semibold text-forest-900 underline" href={`/admin/dfy/${r.id}`}>{r.id}</Link></td>
                <td className="px-3 py-2.5">{r.email}</td><td className="px-3 py-2.5">{r.packageName}</td><td className="px-3 py-2.5">{usd(r.monthlyCents)}</td>
                <td className="px-3 py-2.5">{r.ownership ? `Yes (${usd(r.ownershipCents)})` : "No"}</td>
                <td className="px-3 py-2.5"><Badge tone={r.status === "campaign_active" ? "good" : r.status === "paused" || r.status === "cancelled" ? "bad" : "info"}>{isStage(r.status) ? LABEL[r.status] : r.status}</Badge></td>
                <td className="px-3 py-2.5">{r.capacityApproved ? "Approved" : r.paidAt ? "Needs review" : "—"}</td><td className="px-3 py-2.5">{d(r.createdAt)}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Panel>
    </>
  );
}
