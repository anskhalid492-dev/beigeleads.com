import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getProducts } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { LinkForm } from "./link-form";
import { resendAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DeliveryPage() {
  let admin;
  try { admin = await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const [links, paid] = await Promise.all([
    db.select().from(schema.deliveryLinks),
    db.select({ id: schema.orders.id, email: schema.orders.email, paidAt: schema.orders.paidAt, pkg: schema.orderItems.packageName, slug: schema.orderItems.productSlug, dStatus: schema.deliveries.status, dAttempts: schema.deliveries.attempts })
      .from(schema.orders)
      .innerJoin(schema.orderItems, eq(schema.orderItems.orderId, schema.orders.id))
      .leftJoin(schema.deliveries, eq(schema.deliveries.orderId, schema.orders.id))
      .where(eq(schema.orders.status, "paid")).orderBy(desc(schema.orders.paidAt)).limit(30),
  ]);
  const urlFor = (slug: string, pkg: string) => links.find((l) => l.productSlug === slug && l.packageName === pkg)?.url ?? "";
  return (
    <>
      <h1 className="display text-4xl text-forest-900">Delivery links</h1>
      <p className="mt-2">Signed in as {admin.email}. When an order is paid, the buyer is emailed the link set here. A package link wins over the product link. Every change is emailed to the owner.</p>
      <div className="mt-8 space-y-6">
        {getProducts().map((p) => (
          <section key={p.slug} className="rounded-2xl border border-sand-200 bg-white p-5">
            <h2 className="font-bold text-forest-900">{p.name}</h2>
            <div className="divide-y divide-sand-200">
              <LinkForm product={p.slug} pkg="" label="All packages" current={urlFor(p.slug, "")} />
              {p.packages.map((k) => <LinkForm key={k.name} product={p.slug} pkg={k.name} label={`${k.name} only`} current={urlFor(p.slug, k.name)} />)}
            </div>
          </section>
        ))}
      </div>
      <h2 className="mt-10 text-xl font-bold text-forest-900">Recent paid orders</h2>
      <ul className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white text-sm">
        {paid.length === 0 && <li className="p-4">No paid orders yet.</li>}
        {paid.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-mono text-xs">{o.id}</p>
              <p>{o.slug} · {o.pkg} · {o.email}</p>
              <p className="font-semibold text-forest-900">{o.dStatus === "sent" ? "Delivered" : o.dStatus === "failed" ? `Email failed (${o.dAttempts} tries)` : o.dStatus === "sending" ? "Sending…" : "Waiting (no link yet, or next minute)"}</p>
            </div>
            <form action={resendAction}><input type="hidden" name="orderId" value={o.id} /><Button type="submit" variant="secondary" size="sm">Send again</Button></form>
          </li>
        ))}
      </ul>
    </>
  );
}
