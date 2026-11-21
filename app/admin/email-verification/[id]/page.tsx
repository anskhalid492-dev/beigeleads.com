import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq, like } from "drizzle-orm";
import { Badge, PageHeader, Panel, usd } from "@/components/admin/ui";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getProduct } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { EV_SLUG } from "@/lib/ev/settings";
import { LABEL, TONE, adminOptions, isStatus } from "@/lib/ev/state";
import { filesOf, getEv } from "@/lib/ev/store";
import { gate } from "../gate";
import { NoteControl, RemoveResult, ResendButton, ResultUpload, StatusControl } from "./controls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification order", robots: { index: false, follow: false } };
const dt = (t: number | null | undefined) => (t ? new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—");
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(2)} MB`;

export default async function EvDetail({ params }: { params: Promise<{ id: string }> }) {
  await gate();
  const { id } = await params;
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const db = getDbFromEnv(env);
  const ev = /^EV-[A-Z0-9]{8}$/.test(id) ? await getEv(db, id).catch(() => null) : null;
  if (!ev) notFound();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, ev.orderId));
  const [attempt] = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, ev.orderId)).orderBy(desc(schema.paymentAttempts.id)).limit(1);
  const items = (await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, ev.orderId))).filter((i) => i.productSlug !== EV_SLUG);
  const files = await filesOf(db, ev.id);
  const originals = files.filter((f) => f.kind === "original");
  const results = files.filter((f) => f.kind === "result" && f.state === "accepted");
  const events = await db.select().from(schema.evEvents).where(eq(schema.evEvents.evOrderId, id)).orderBy(desc(schema.evEvents.id)).limit(60);
  const mails = await db.select().from(schema.emailDeliveryLogs).where(like(schema.emailDeliveryLogs.reference, `${id}%`)).orderBy(desc(schema.emailDeliveryLogs.id)).limit(40);
  const status = isStatus(ev.status) ? ev.status : "awaiting_payment";
  const closed = status === "completed" || status === "delivered" || status === "cancelled" || status === "refunded";
  const opts = adminOptions(status).filter((t) => t !== "completed" || results.length > 0).map((t) => ({ value: t, label: LABEL[t] }));
  const row = "flex justify-between gap-4 border-b border-sand-200 py-2 text-sm last:border-0";
  return (
    <>
      <PageHeader title={`Verification ${ev.id}`} text={`${ev.email} · ${ev.packageName}`} actions={<Badge tone={TONE[status]}>{LABEL[status]}</Badge>} />
      <p className="mb-4 text-sm"><Link href="/admin/email-verification" className="font-semibold underline">All verification orders</Link></p>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Customer and payment"><dl className="px-5 py-2">
          <div className={row}><dt>Customer email</dt><dd className="font-semibold text-forest-900">{ev.email}</dd></div>
          <div className={row}><dt>BeigeLeads order</dt><dd className="font-mono text-xs">{ev.orderId}</dd></div>
          <div className={row}><dt>Order payment status</dt><dd><Badge tone={order?.status === "paid" ? "good" : "mute"}>{order?.status ?? "unknown"}</Badge></dd></div>
          <div className={row}><dt>Paid on</dt><dd>{dt(ev.paidAt)}</dd></div>
          <div className={row}><dt>Network</dt><dd>{attempt ? `${attempt.coin} · ${attempt.network}` : "—"}</dd></div>
          <div className={row}><dt>Whole order total</dt><dd>{order ? usd(order.totalUsdCents) : "—"}</dd></div>
        </dl></Panel>
        <Panel title="Package (price and limit as purchased)"><dl className="px-5 py-2">
          <div className={row}><dt>Package</dt><dd className="font-semibold text-forest-900">{ev.packageName}</dd></div>
          <div className={row}><dt>Price paid for verification</dt><dd>{usd(ev.priceCents)}</dd></div>
          <div className={row}><dt>Maximum emails</dt><dd>{ev.limitCount.toLocaleString("en-US")}</dd></div>
          <div className={row}><dt>Submitted emails</dt><dd>{ev.submittedCount > 0 ? ev.submittedCount.toLocaleString("en-US") : "None yet"}</dd></div>
          <div className={row}><dt>List submitted</dt><dd>{dt(ev.submittedAt)}</dd></div>
          <div className={row}><dt>Completed</dt><dd>{dt(ev.completedAt)}</dd></div>
          <div className={row}><dt>Delivered (first download)</dt><dd>{dt(ev.deliveredAt)}</dd></div>
        </dl></Panel>
        <Panel title="Submitted files">
          {originals.length === 0 ? <p className="px-5 py-4 text-sm">No file submitted yet.</p> : <ul className="divide-y divide-sand-200">{originals.map((f) => (
            <li key={f.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-forest-900">{f.filename}</span><Badge tone={f.state === "accepted" ? "good" : f.state === "rejected" ? "bad" : "mute"}>{f.state}</Badge></div>
              <p className="mt-1">{f.format.toUpperCase()} · {mb(f.sizeBytes)} · {f.entryCount.toLocaleString("en-US")} emails{f.columnLabel ? ` · column “${f.columnLabel}”` : ""} · {f.source === "paste" ? "pasted" : "uploaded"} · {dt(f.createdAt)}</p>
              {f.state === "accepted" && !f.deletedAt && <a className="mt-1 inline-block font-semibold text-forest-700 underline" href={`/api/admin/ev/file/${f.id}`}>Download original</a>}
              {f.deletedAt && <p className="mt-1 text-xs">Deleted {dt(f.deletedAt)}</p>}
            </li>))}</ul>}
        </Panel>
        <Panel title="Results">
          <div className="space-y-4 px-5 py-4">
            {results.length > 0 && <ul className="space-y-1 text-sm">{results.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-2"><span><a className="font-semibold underline" href={`/api/admin/ev/file/${f.id}`}>{f.filename}</a> · {mb(f.sizeBytes)}</span>{!closed && <RemoveResult id={ev.id} fileId={f.id} />}</li>)}</ul>}
            <ResultUpload id={ev.id} disabled={closed} />
            <p className="text-xs">Uploading does not complete the job. After the file is uploaded, set the status to Completed to email the customer.</p>
          </div>
        </Panel>
        <Panel title="Status"><div className="px-5 py-4"><StatusControl id={ev.id} options={opts} />{ev.actionReason && <p className="mt-3 text-sm">Reason sent to customer: {ev.actionReason}</p>}{results.length === 0 && !closed && <p className="mt-3 text-xs">Completed becomes available after a result file is uploaded.</p>}</div></Panel>
        <Panel title="Internal notes"><div className="px-5 py-4"><NoteControl id={ev.id} note={ev.note} /></div></Panel>
        <Panel title="Related database products (same order)">
          {items.length === 0 ? <p className="px-5 py-4 text-sm">This order has no database products.</p> : <ul className="divide-y divide-sand-200 text-sm">{items.map((i) => <li key={i.id} className="flex justify-between gap-3 px-5 py-2.5"><span>{getProduct(i.productSlug)?.name ?? i.productSlug} · {i.packageName}</span><span>{usd(i.priceUsdCents)}</span></li>)}</ul>}
          <p className="px-5 pb-4 text-xs">Database delivery is handled separately (Delivery Links) and never waits for verification.</p>
        </Panel>
        <Panel title="Resend an email"><div className="flex flex-wrap items-start gap-3 px-5 py-4">
          <ResendButton id={ev.id} kind="payment" label="Order confirmed" /><ResendButton id={ev.id} kind="received" label="File received" /><ResendButton id={ev.id} kind="processing" label="In progress" /><ResendButton id={ev.id} kind="results" label="Results ready" /><ResendButton id={ev.id} kind="reminder" label="Reminder" />
        </div></Panel>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Email delivery log">{mails.length === 0 ? <p className="px-5 py-4 text-sm">No emails yet.</p> : <ul className="divide-y divide-sand-200 text-sm">{mails.map((m) => <li key={m.id} className="flex flex-wrap justify-between gap-2 px-5 py-2.5"><span><span className="font-semibold text-forest-900">{m.templateKey}</span> · {m.recipient}</span><span><Badge tone={m.status === "sent" ? "good" : "bad"}>{m.deliveryStatus || m.status}</Badge> <span className="text-xs">{dt(Math.floor(m.createdAt.getTime() / 1000))}</span></span></li>)}</ul>}</Panel>
        <Panel title="Activity">{events.length === 0 ? <p className="px-5 py-4 text-sm">Nothing yet.</p> : <ul className="divide-y divide-sand-200 text-sm">{events.map((e) => <li key={e.id} className="px-5 py-2"><span className="font-semibold text-forest-900">{e.action}</span> · {e.actor} <span className="text-xs">{dt(e.createdAt)}</span>{e.detail && <span className="block text-xs">{e.detail}</span>}</li>)}</ul>}</Panel>
      </div>
    </>
  );
}
