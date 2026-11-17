import { and, count, desc, eq, like, or } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, fmtDate, usd } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { ReviewView } from "./review";

export const dynamic = "force-dynamic";
const PAGE = 20;
const STATUSES = ["pending", "paid", "expired", "partial", "late_payment", "refunded"] as const;
type St = (typeof STATUSES)[number];

const payTone = { paid: "good", pending: "info", partial: "warn", late_payment: "warn", expired: "mute", refunded: "mute" } as const;
const field = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-purple-600";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ view?: string; q?: string; status?: string; page?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const sp = await searchParams;
  const review = sp.view === "review";
  const tabs = (
    <div className="mb-6 flex gap-2 text-sm font-semibold">
      <Link href="/admin/orders" className={`rounded-full px-4 py-2 ${!review ? "bg-forest-900 text-sand-50" : "border border-sand-300 bg-white"}`}>All orders</Link>
      <Link href="/admin/orders?view=review" className={`rounded-full px-4 py-2 ${review ? "bg-forest-900 text-sand-50" : "border border-sand-300 bg-white"}`}>Needs a decision</Link>
    </div>
  );
  if (review) return (<><PageHeader title="Orders" text="Nothing changes until you tick the box and press the button. Every decision is logged and emailed to the owner." />{tabs}<ReviewView /></>);

  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = STATUSES.includes(sp.status as St) ? (sp.status as St) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = getDb();
  const where = and(status ? eq(schema.orders.status, status) : undefined, q ? or(like(schema.orders.email, `%${q}%`), like(schema.orders.id, `%${q}%`)) : undefined);
  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(schema.orders).where(where),
    db.select({ id: schema.orders.id, email: schema.orders.email, status: schema.orders.status, cents: schema.orders.totalUsdCents, createdAt: schema.orders.createdAt, slug: schema.orderItems.productSlug, pkg: schema.orderItems.packageName, dStatus: schema.deliveries.status })
      .from(schema.orders)
      .leftJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
      .leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
      .where(where).orderBy(desc(schema.orders.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number) => `/admin/orders?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Orders" text="Payment status and delivery status are separate: an order can be paid and still waiting for its delivery email." />
      {tabs}
      <form className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search email or order ID" className={`${field} min-w-56 flex-1`} aria-label="Search orders" />
        <select name="status" defaultValue={status ?? ""} className={field} aria-label="Payment status">
          <option value="">All payment statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <button type="submit" className="h-10 rounded-full bg-forest-900 px-5 text-sm font-semibold text-sand-50">Filter</button>
      </form>
      <Panel>
        {rows.length === 0 ? <Empty title="No orders found" text={q || status ? "Try a different search or filter." : "Orders appear here when someone starts checkout."} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-sand-100 text-xs font-bold text-forest-900"><tr>
                <th className="px-4 py-3">Order</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Package</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Delivery</th><th className="px-4 py-3">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-sand-200">
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-mono text-xs" title={o.id}>{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{o.slug ?? "—"}</td><td className="px-4 py-3">{o.pkg ?? "—"}</td>
                    <td className="px-4 py-3">{o.email}</td><td className="px-4 py-3 font-semibold text-forest-900">{usd(o.cents)}</td>
                    <td className="px-4 py-3"><Badge tone={payTone[o.status]}>{o.status.replace("_", " ")}</Badge></td>
                    <td className="px-4 py-3">{o.dStatus === "sent" ? <Badge tone="good">Delivered</Badge> : o.dStatus === "failed" ? <Badge tone="bad">Failed</Badge> : o.dStatus === "sending" ? <Badge tone="info">Sending</Badge> : o.status === "paid" ? <Badge tone="warn">Waiting</Badge> : <Badge>—</Badge>}</td>
                    <td className="px-4 py-3">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-sand-200 p-3 text-sm">
          <span>{total} order{total === 1 ? "" : "s"} · page {Math.min(page, pages)} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={href(page - 1)} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Previous</Link>}
            {page < pages && <Link href={href(page + 1)} className="rounded-full border border-sand-300 px-4 py-1.5 font-semibold">Next</Link>}
          </div>
        </div>
      </Panel>
    </>
  );
}
