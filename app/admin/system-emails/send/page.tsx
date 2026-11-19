import Link from "next/link";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv, schema } from "@/lib/db";
import { listEditable } from "@/lib/system-emails/store";
import { ManualSendForm, type Prefill, type TemplateOption } from "./form";

export const dynamic = "force-dynamic";

export default async function ManualSendPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const map = await listEditable(db);
  const templates: TemplateOption[] = [...map.values()].filter((t) => t.def.audience === "customer")
    .map((t) => ({ key: t.def.key, name: t.def.name, subject: t.published.subject, heading: t.published.heading }));
  let prefill: Prefill = { orderId: "", email: "", product: "", pkg: "", records: "", paid: false };
  const id = (sp.order ?? "").trim().slice(0, 60);
  if (id) {
    try {
      const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
      if (o) {
        const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, o.id));
        prefill = { orderId: o.id, email: o.email, product: items.map((i) => i.productSlug).join(", "), pkg: items.map((i) => i.packageName).join(", "), records: items.length === 1 ? String(items[0].records ?? "") : "", paid: o.status === "paid" };
      }
    } catch { /* form still works without a prefill */ }
  }
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/system-emails" className="underline">System Emails</Link> / Manual send</p>
      <PageHeader title="Send an email by hand" text="For orders you fulfil yourself. Pick a branded email, add your own link and buttons, preview it, and send it to one person. Nothing is sent until you press Send." />
      <Panel><ManualSendForm templates={templates} prefill={prefill} /></Panel>
    </>
  );
}
