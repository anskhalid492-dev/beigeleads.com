import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate, usd } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProducts } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { optionForWallet } from "@/lib/payments/options";
import { listAudit } from "@/lib/wallets/service";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const [[{ orders }], [{ paid }], [{ pending }], [{ requests }], recent, paidAttempts, orderLog, walletLog] = await Promise.all([
    db.select({ orders: count() }).from(schema.orders),
    db.select({ paid: count() }).from(schema.orders).where(eq(schema.orders.status, "paid")),
    db.select({ pending: count() }).from(schema.orders).where(eq(schema.orders.status, "pending")),
    db.select({ requests: count() }).from(schema.customListRequests),
    db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt)).limit(6),
    db.select({ orderId: schema.paymentAttempts.orderId, coin: schema.paymentAttempts.coin, network: schema.paymentAttempts.network, cents: schema.orders.totalUsdCents })
      .from(schema.paymentAttempts).innerJoin(schema.orders, eq(schema.orders.id, schema.paymentAttempts.orderId))
      .where(eq(schema.orders.status, "paid")),
    db.select().from(schema.orderAuditLog).orderBy(desc(schema.orderAuditLog.id)).limit(6),
    listAudit(6),
  ]);
  // Revenue counts real-money (mainnet) payments only; test-network orders are shown separately.
  const seen = new Set<string>();
  let real = 0, testPaid = 0;
  for (const a of paidAttempts) {
    if (seen.has(a.orderId)) continue;
    seen.add(a.orderId);
    const o = optionForWallet(a.coin, a.network);
    if (o && a.network === o.test) testPaid++; else real += a.cents;
  }
  const activity = [
    ...orderLog.map((l) => ({ at: l.createdAt, text: `${l.actor} · ${l.action} · order ${l.orderId.slice(0, 8)}` })),
    ...walletLog.map((l) => ({ at: l.createdAt, text: `${l.actor} · wallet ${l.action}` })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);

  return (
    <>
      <PageHeader title="Overview" text="Live numbers from the database. Nothing here is estimated." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total products" value={getProducts().length} />
        <StatCard label="Total orders" value={orders} />
        <StatCard label="Paid orders" value={paid} hint={testPaid ? `${testPaid} of them on test networks` : undefined} />
        <StatCard label="Pending orders" value={pending} />
        <StatCard label="Revenue (real payments)" value={usd(real)} hint="Test-network orders are not counted" />
        <StatCard label="Custom list requests" value={requests} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
        {[["Set delivery links", "/admin/delivery"], ["Orders needing a decision", "/admin/orders?view=review"], ["Manage wallets", "/admin/wallets"], ["View custom requests", "/admin/custom-requests"]].map(([l, h]) => (
          <Link key={h} href={h} prefetch={false} className="rounded-full border border-sand-300 bg-white px-4 py-2 text-forest-900 hover:bg-sand-100">{l}</Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Recent orders">
          {recent.length === 0 ? <Empty title="No orders yet" /> : (
            <ul className="divide-y divide-sand-200 text-sm">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0"><p className="truncate">{o.email}</p><p className="text-xs">{fmtDate(o.createdAt)}</p></div>
                  <div className="flex items-center gap-3"><b className="text-forest-900">{usd(o.totalUsdCents)}</b><Badge tone={o.status === "paid" ? "good" : o.status === "pending" ? "info" : "warn"}>{o.status.replace("_", " ")}</Badge></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Latest activity">
          {activity.length === 0 ? <Empty title="Nothing yet" text="Wallet changes and order decisions appear here." /> : (
            <ul className="divide-y divide-sand-200 text-sm">{activity.map((a, i) => <li key={i} className="px-5 py-3"><p>{a.text}</p><p className="text-xs">{fmtDate(a.at)}</p></li>)}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
