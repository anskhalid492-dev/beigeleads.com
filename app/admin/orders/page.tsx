import { desc, eq, inArray, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { explorerTxUrl } from "@/lib/payments/explorer";
import { optionForWallet } from "@/lib/payments/options";
import { claimAction, markPaidAction, markRefundedAction } from "./actions";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-sand-200 bg-white p-4 text-sm";
const Confirm = () => <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="confirm" value="yes" required /> I checked the blockchain</label>;

export default async function OrdersPage() {
  let admin;
  try { admin = await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const [claims, attention, attempts, audit] = await Promise.all([
    db.select().from(schema.paymentClaims).where(eq(schema.paymentClaims.status, "pending")).orderBy(desc(schema.paymentClaims.id)).limit(50),
    db.select({ id: schema.orders.id, status: schema.orders.status, email: schema.orders.email, cents: schema.orders.totalUsdCents })
      .from(schema.orders).where(inArray(schema.orders.status, ["partial", "late_payment"])).orderBy(desc(schema.orders.createdAt)).limit(50),
    db.select().from(schema.paymentAttempts).orderBy(desc(schema.paymentAttempts.id)).limit(500),
    db.select().from(schema.orderAuditLog).orderBy(desc(schema.orderAuditLog.id)).limit(20),
  ]);
  const overpaid = attempts.filter((a) => a.overpaidAmount);
  const attemptOf = (orderId: string) => attempts.find((a) => a.orderId === orderId);
  const seen = claims.length ? await db.select({ tx: schema.paymentEvents.txHash, attempt: schema.paymentEvents.attemptId }).from(schema.paymentEvents).where(or(...claims.map((c) => eq(schema.paymentEvents.txHash, c.txHash)))!) : [];

  // Testnet gate: how many TEST orders ended in each outcome. Duplicate handling is guaranteed by the UNIQUE tx_hash and unit tests, not counted here.
  const test = attempts.filter((a) => { const o = optionForWallet(a.coin, a.network); return o && a.network === o.test; });
  const count = (f: (a: (typeof attempts)[number]) => boolean) => test.filter(f).length;
  const gate = [
    ["Exact payment (paid)", count((a) => a.status === "paid" && !a.overpaidAmount)],
    ["Underpaid (partial)", count((a) => a.status === "partial")],
    ["Overpaid", count((a) => !!a.overpaidAmount)],
    ["Late payment", count((a) => a.status === "late")],
    ["Expired, never paid", count((a) => a.status === "expired")],
  ] as const;

  return (
    <>
      <h1 className="display text-4xl text-forest-900">Orders needing a decision</h1>
      <p className="mt-2">Signed in as {admin.email}. Nothing here changes an order until you tick the box and press the button. Every decision is logged and emailed to the owner.</p>

      <h2 className="mt-10 text-xl font-bold text-forest-900">Buyer claims (&ldquo;I paid&rdquo;)</h2>
      <ul className="mt-3 space-y-3">
        {claims.length === 0 && <li className={card}>No pending claims.</li>}
        {claims.map((c) => {
          const a = attemptOf(c.orderId);
          const link = a ? explorerTxUrl(a.coin, a.network, c.txHash) : null;
          const match = seen.find((s) => s.tx === c.txHash);
          return (
            <li key={c.id} className={card}>
              <p className="font-mono text-xs">{c.orderId}</p>
              <p className="mt-1">{a ? `${a.coin} · ${a.network} · asked ${a.expectedAmount}` : "no payment attempt"}</p>
              <p className="mt-1 break-all font-mono text-xs">tx {c.txHash} {link && <a className="underline" href={link} target="_blank" rel="noopener noreferrer">open in explorer</a>}</p>
              {c.note && <p className="mt-1">Note: {c.note}</p>}
              {match && <p className="mt-1 font-semibold text-forest-900">The watcher already matched this transaction to attempt #{match.attempt}.</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <form action={claimAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="claimId" value={c.id} /><input type="hidden" name="decision" value="approve" /><Confirm /><Button type="submit" size="sm">Approve and mark paid</Button></form>
                <form action={claimAction}><input type="hidden" name="claimId" value={c.id} /><input type="hidden" name="decision" value="reject" /><Button type="submit" variant="secondary" size="sm">Reject</Button></form>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-xl font-bold text-forest-900">Partial and late payments</h2>
      <ul className="mt-3 space-y-3">
        {attention.length === 0 && <li className={card}>None.</li>}
        {attention.map((o) => (
          <li key={o.id} className={card}>
            <p className="font-mono text-xs">{o.id}</p>
            <p className="mt-1"><b>{o.status}</b> · ${(o.cents / 100).toFixed(2)} · {o.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <form action={markPaidAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="orderId" value={o.id} /><Confirm /><Button type="submit" size="sm">Mark paid and deliver</Button></form>
              <form action={markRefundedAction} className="flex flex-wrap items-center gap-3"><input type="hidden" name="orderId" value={o.id} /><Confirm /><Button type="submit" variant="secondary" size="sm">Mark refunded</Button></form>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold text-forest-900">Overpaid orders (refund or credit owed)</h2>
      <ul className="mt-3 space-y-3">
        {overpaid.length === 0 && <li className={card}>None.</li>}
        {overpaid.map((a) => <li key={a.id} className={card}><span className="font-mono text-xs">{a.orderId}</span><br />Overpaid by {a.overpaidAmount} {a.coin} ({a.network}). Refund or credit it yourself, then note it with the order id.</li>)}
      </ul>

      <h2 className="mt-10 text-xl font-bold text-forest-900">Testnet gate (before mainnet)</h2>
      <p className="mt-1 text-sm">Required: 20+ test orders covering exact, under, over, late and duplicate cases, then real $1-$5 payments per coin. Counts come from orders on test networks only. Duplicate transactions cannot be counted here (the database refuses a repeated transaction hash, covered by tests).</p>
      <ul className={`mt-3 divide-y divide-sand-200 ${card} p-0`}>
        {gate.map(([label, n]) => <li key={label} className="flex justify-between p-3"><span>{label}</span><b>{n}</b></li>)}
        <li className="flex justify-between p-3"><span>Total test orders</span><b>{test.length} / 20</b></li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-forest-900">Decision log</h2>
      <ul className="mt-3 divide-y divide-sand-200 rounded-2xl border border-sand-200 bg-white text-sm">
        {audit.map((l) => <li key={l.id} className="p-3">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {l.actor} · <b>{l.action}</b> · {l.orderId}</li>)}
        {audit.length === 0 && <li className="p-3">Nothing yet.</li>}
      </ul>
    </>
  );
}
