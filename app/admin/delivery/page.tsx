import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProducts } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { DeliveryManager, type Row } from "./delivery-manager";
import { resendAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const [links, paidBase] = await Promise.all([
    db.select().from(schema.deliveryLinks),
    db.select({ id: schema.orders.id, email: schema.orders.email, paidAt: schema.orders.paidAt, dStatus: schema.deliveries.status, dAttempts: schema.deliveries.attempts })
      .from(schema.orders)
      .leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
      .where(eq(schema.orders.status, "paid")).orderBy(desc(schema.orders.paidAt)).limit(30),
  ]);
  // Several lists can be in one order: fetch the items separately and show them together.
  const itemRows = paidBase.length ? await db.select().from(schema.orderItems).where(inArray(schema.orderItems.orderId, paidBase.map((o) => o.id))) : [];
  const paid = paidBase.map((o) => {
    const its = itemRows.filter((i) => i.orderId === o.id);
    return { ...o, slug: its.map((i) => i.productSlug).join(", "), pkg: its.map((i) => i.packageName).join(", ") };
  });
  const rows: Row[] = getProducts().map((p) => ({
    slug: p.slug,
    name: p.name,
    packages: p.packages.map((k) => ({ name: k.name, records: k.records })),
    links: Object.fromEntries(links.filter((l) => l.productSlug === p.slug).map((l) => [l.packageName, { url: l.url, updatedAt: l.updatedAt.getTime() }])),
  }));

  return (
    <>
      <PageHeader title="Delivery links" text="When an order is paid, the buyer is emailed the link set here. A package link wins over the product's default link. Every change is emailed to the owner." />
      <DeliveryManager rows={rows} />
      <Panel title="Recent paid orders" className="mt-8">
        {paid.length === 0 ? <Empty title="No paid orders yet" text="Paid orders and their delivery status appear here." /> : (
          <ul className="divide-y divide-sand-200 text-sm">
            {paid.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs">{o.id}</p>
                  <p>{o.slug} · {o.pkg} · {o.email}</p>
                  <p className="text-xs">Paid {fmtDate(o.paidAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {o.dStatus === "sent" ? <Badge tone="good">Delivered</Badge> : o.dStatus === "failed" ? <Badge tone="bad">Email failed ({o.dAttempts} tries)</Badge> : o.dStatus === "sending" ? <Badge tone="info">Sending</Badge> : <Badge tone="warn">Waiting for a link</Badge>}
                  <form action={resendAction}><input type="hidden" name="orderId" value={o.id} /><Button type="submit" variant="secondary" size="sm">Send again</Button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
