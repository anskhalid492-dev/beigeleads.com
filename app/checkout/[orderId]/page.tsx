import { hydrateCatalog } from "@/lib/catalog-db";
import { CryptoGuide } from "@/components/checkout/crypto-guide";
import { ApiForm } from "@/components/forms/api-form";
import { optionForWallet } from "@/lib/payments/options";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { toString as qrToSvg } from "qrcode/lib/browser.js"; // browser build: no fs, safe on Workers
import { TriangleAlert } from "lucide-react";
import { formatUsd, getProduct } from "@/lib/catalog";
import { getDb, schema } from "@/lib/db";
import { CheckoutLive } from "./live";
import { EV_SLUG } from "@/lib/ev/settings";

import { fitMeta } from "@/lib/seo/fit";
const itemName = (slug: string) => (slug === EV_SLUG ? "Email List Verification" : getProduct(slug)?.name ?? slug);

const metadataRaw: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default async function CheckoutPage(props: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await props.params;
  await hydrateCatalog();
  if (!UUID.test(orderId)) notFound();
  const db = getDb();
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!order) notFound();
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId)).orderBy(schema.orderItems.id);
  const bundleRows = await db.select().from(schema.orderBundles).where(eq(schema.orderBundles.orderId, orderId)).catch(() => []);
  const bundleSlugs = (b: { itemsJson: string }): string[] => { try { return (JSON.parse(b.itemsJson) as { slug: string }[]).map((x) => x.slug); } catch { return []; } };
  const inBundle = new Set(bundleRows.flatMap(bundleSlugs));
  const singles = items.filter((i) => !inBundle.has(i.productSlug));
  const [a] = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.orderId, orderId)).orderBy(desc(schema.paymentAttempts.id)).limit(1);
  if (items.length === 0 || !a) notFound();

  const opt = optionForWallet(a.coin, a.network);
  if (!opt) notFound();
  const testnet = a.network === opt.test;
  const unit = opt.coin;
  const netName = testnet ? opt.testNetworkName : opt.mainNetworkName;
  // BTC and ETH wallets understand amount URIs; token wallets scan the plain address.
  const uri = opt.id === "BTC" ? `bitcoin:${a.address}?amount=${a.expectedAmount}` : a.address;
  const qr = await qrToSvg(uri, { margin: 1, width: 220, errorCorrectionLevel: "M" });
  const row = "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-sand-200 py-3 last:border-0";

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="display text-4xl text-forest-900 sm:text-5xl">Pay with {opt.label}</h1>
      <p className="mt-2">Order <span className="font-mono text-sm">{order.id}</span> · {formatUsd(order.totalUsdCents)}</p>
      <ul aria-label="Lists in this order" className="mt-3 space-y-1.5 rounded-2xl border border-sand-200 bg-white p-4 text-sm">
        {bundleRows.map((b) => (
          <li key={b.id} className="border-b border-sand-200 pb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4"><span className="font-semibold text-forest-900">{b.bundleName} <span className="font-normal">· bundle</span></span><span>{formatUsd(b.priceCents)}</span></div>
            <ul className="mt-1 space-y-0.5 pl-4 text-forest-700">
              {items.filter((i) => bundleSlugs(b).includes(i.productSlug)).map((it) => <li key={it.id} className="list-disc">{itemName(it.productSlug)} · {it.packageName} package</li>)}
            </ul>
          </li>
        ))}
        {singles.map((it) => (
          <li key={it.id} className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span className="font-semibold text-forest-900">{itemName(it.productSlug)} <span className="font-normal">· {it.packageName} package{it.records > 0 ? (it.productSlug === EV_SLUG ? `, up to ${it.records.toLocaleString("en-US")} emails` : `, ${it.records.toLocaleString("en-US")} records`) : ""}</span></span>
            <span>{formatUsd(it.priceUsdCents)}</span>
          </li>
        ))}
      </ul>

      {testnet && (
        <p className="mt-5 flex gap-3 rounded-2xl border-2 border-purple-600 bg-purple-100 p-4 font-semibold text-forest-900">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden /> TEST ORDER on a test network. Do not send real funds.
        </p>
      )}

      <div className="mt-6"><CheckoutLive orderId={order.id} expiresAt={a.expiresAt.getTime()} initial={order.status} slugs={items.map((i) => i.productSlug)} verification={items.some((i) => i.productSlug === EV_SLUG)} lists={items.some((i) => i.productSlug !== EV_SLUG)} bundles={bundleRows.map((b) => b.bundleSlug)} /></div>

      {order.status === "pending" && <CryptoGuide className="mt-6" />}

      <section aria-label="Payment details" className="mt-6 grid gap-6 rounded-3xl border border-sand-200 bg-white p-6 sm:grid-cols-[auto_1fr] sm:p-8">
        <div className="mx-auto" role="img" aria-label="QR code for the payment address and amount" dangerouslySetInnerHTML={{ __html: qr }} />
        <dl>
          <div className={row}><dt className="font-semibold text-forest-900">Send exactly</dt><dd className="font-mono text-lg font-bold text-forest-900">{a.expectedAmount} {unit}</dd></div>
          <div className={row}><dt className="font-semibold text-forest-900">To address</dt><dd className="break-all font-mono text-sm">{a.address}</dd></div>
          <div className={row}><dt className="font-semibold text-forest-900">Price locked at</dt><dd>1 {unit} = ${Number(a.lockedRate).toLocaleString("en-US", { maximumFractionDigits: 2 })} for 30 minutes</dd></div>
        </dl>
      </section>

      <ul className="mt-6 space-y-2 rounded-2xl bg-sand-100 p-5 text-sm">
        <li><strong className="text-forest-900">Network:</strong> send only on {netName}. Funds sent on another network are lost.</li>
        <li><strong className="text-forest-900">Amount:</strong> send the exact amount shown, to the last digit, in ONE payment. The small extra digits are how we match your payment to your order; if your wallet or exchange deducts a fee, add it on top so the amount we receive is exact.</li>
        <li><strong className="text-forest-900">Time:</strong> pay before the countdown ends. Payments after that need manual review.</li>
        <li><strong className="text-forest-900">Delivery:</strong> after the network confirms your payment we email your download link{items.length > 1 ? "s" : ""} to the address you used at checkout.</li>
      </ul>
      <section className="mt-6 rounded-2xl border border-sand-200 bg-white p-5">
        <h2 className="text-lg font-bold text-forest-900">Already paid but nothing happened?</h2>
        <p className="mt-1 text-sm">Send us the transaction ID from your wallet or exchange. We check it on the blockchain by hand and email you. Sending this does not change your order by itself.</p>
        <div className="mt-4">
          <ApiForm
            endpoint="/api/checkout/claim"
            hidden={{ orderId: order.id }}
            fields={[
              { name: "txHash", label: "Transaction ID (hash)", type: "text", required: true },
              { name: "note", label: "Note (optional)", type: "textarea" },
            ]}
            submitLabel="Send transaction ID"
            successTitle="Received"
            successText="We will check it and email you at the address you used at checkout."
          />
        </div>
      </section>
    </main>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
