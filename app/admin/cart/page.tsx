import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { cartStats, rate } from "@/lib/cart/stats";

export const dynamic = "force-dynamic";
const pct = (v: number | null) => (v === null ? "No data yet" : `${v}%`);

export default async function CartFunnelPage() {
  await guardAdmin();
  const s = await cartStats(getCloudflareContext().env, 30);
  const e = s.events;
  const steps: [string, number, string][] = [
    ["Cart views", e.view_cart, "Counted once per browser session"],
    ["Checkout started", e.begin_checkout, "Pressed Proceed to Checkout"],
    ["Orders created", s.ordersCreated, "From the orders table (includes test orders)"],
    ["Paid, real payments", s.paidReal, "Mainnet payments confirmed by the network"],
  ];
  return (
    <>
      <PageHeader title="Cart funnel" text={`Last ${s.days} days. Real numbers only: anonymous cart counters from visitors' browsers plus the orders table. Nothing is estimated.`} />
      {!s.ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Cart counters need migration 0027 in D1. Order numbers below still work.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Added to cart" value={e.add_to_cart} />
        <StatCard label="Removed from cart" value={e.remove_from_cart} />
        <StatCard label="Orders with several lists" value={s.multiItemOrders} hint={s.ordersCreated ? `of ${s.ordersCreated} orders` : undefined} />
        <StatCard label="Paid on test networks" value={s.paidTest} hint="Not counted as real purchases" />
      </div>
      <Panel title="Funnel" className="mt-6">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sand-200 text-forest-900"><tr><th className="px-5 py-3">Step</th><th>Count</th><th>From previous step</th><th className="pr-5">Note</th></tr></thead>
          <tbody className="divide-y divide-sand-200">
            {steps.map(([label, n, note], i) => (
              <tr key={label}><td className="px-5 py-3 font-semibold text-forest-900">{label}</td><td>{n}</td><td>{i === 0 ? "" : pct(rate(n, steps[i - 1][1]))}</td><td className="pr-5">{note}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Counters are anonymous event counts, not unique visitors, and visitors whose browser sends Do Not Track or Global Privacy Control are not counted. One person can create several events, so read the percentages as a rough guide. The order and payment rows come straight from the orders table.</p>
      </Panel>
    </>
  );
}
