import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { toString as qrToSvg } from "qrcode/lib/browser.js"; // browser build: no fs, safe on Workers
import { TriangleAlert } from "lucide-react";
import { formatUsd } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { CheckoutLive } from "./live";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function CheckoutPage(props: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await props.params;
  if (!UUID.test(orderId)) notFound();
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) notFound();
  const [item] = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
  const [a] = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)).orderBy(desc(schema.paymentAttempts.id)).limit(1);
  if (!item || !a) notFound();

  const isBtc = a.coin === "BTC";
  const testnet = a.network === "testnet" || a.network === "nile";
  const unit = isBtc ? "BTC" : "USDT";
  const uri = isBtc ? `bitcoin:${a.address}?amount=${a.expectedAmount}` : a.address; // TRON wallets scan the plain address
  const qr = await qrToSvg(uri, { margin: 1, width: 220, errorCorrectionLevel: "M" });
  const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-sand-200 py-3 last:border-0";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="display text-4xl text-forest-900 sm:text-5xl">{isBtc ? "Pay with Bitcoin" : "Pay with USDT (TRC20)"}</h1>
      <p className="mt-2">Order <span className="font-mono text-sm">{order.id}</span> · {item.packageName} package ({item.records.toLocaleString("en-US")} records) · {formatUsd(order.totalUsdCents)}</p>

      {testnet && (
        <p className="mt-5 flex gap-3 rounded-2xl border-2 border-purple-600 bg-purple-100 p-4 font-semibold text-forest-900">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> TEST ORDER on a test network. Do not send real funds.
        </p>
      )}

      <div className="mt-6"><CheckoutLive orderId={order.id} expiresAt={a.expiresAt.getTime()} initial={order.status} /></div>

      <section aria-label="Payment details" className="mt-6 grid gap-6 rounded-3xl border border-sand-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <div className="mx-auto" role="img" aria-label="QR code for the payment address and amount" dangerouslySetInnerHTML={{ __html: qr }} />
        <dl>
          <div className={row}><dt className="font-semibold text-forest-900">Send exactly</dt><dd className="font-mono text-lg font-bold text-forest-900">{a.expectedAmount} {unit}</dd></div>
          <div className={row}><dt className="font-semibold text-forest-900">To address</dt><dd className="break-all font-mono text-sm">{a.address}</dd></div>
          <div className={row}><dt className="font-semibold text-forest-900">Price locked at</dt><dd>1 {unit} = ${Number(a.lockedRate).toLocaleString("en-US", { maximumFractionDigits: 2 })} for 30 minutes</dd></div>
        </dl>
      </section>

      <ul className="mt-6 space-y-2 rounded-2xl bg-sand-100 p-5 text-sm">
        <li><strong className="text-forest-900">Network:</strong> send only on {isBtc ? (testnet ? "the Bitcoin testnet" : "the Bitcoin (BTC) network") : (testnet ? "the TRON Nile test network" : "the TRON (TRC20) network")}. Funds sent on another network are lost.</li>
        <li><strong className="text-forest-900">Amount:</strong> send the exact amount shown, to the last digit, in ONE payment. The small extra digits are how we match your payment to your order; if your wallet or exchange deducts a fee, add it on top so the amount we receive is exact.</li>
        <li><strong className="text-forest-900">Time:</strong> pay before the countdown ends. Payments after that need manual review.</li>
        <li><strong className="text-forest-900">Delivery:</strong> after the network confirms your payment we email a secure download link to the address you used at checkout.</li>
      </ul>
    </main>
  );
}
