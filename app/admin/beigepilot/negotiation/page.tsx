import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getCategories, getProducts } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getNeg, negStats } from "@/lib/beigepilot/v2/offers";
import { piloStats } from "@/lib/beigepilot/v2/events";
import { BpNav } from "../nav";
import { NegotiationForm } from "./form";

export const dynamic = "force-dynamic";
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function NegotiationPage() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const [policy, st, ev] = await Promise.all([getNeg(env), negStats(env, 30), piloStats(env, 30)]);
  const inquiries = ev.byEvent.discount_inquiry?.sessions ?? 0;
  return (
    <>
      <PageHeader title="AI Negotiation" text="Pilo can offer a small, automatic discount (never above 20%) to a visitor who explicitly asks for one. The server decides and checks everything; the AI cannot set a price." />
      <BpNav here="/admin/beigepilot/negotiation" />
      <div className="mb-6">
        <Panel title="Last 30 days">
          {!st.ready ? <p className="p-5 text-sm text-forest-700">Run migration 0047 in D1 to start collecting these numbers.</p> : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Visitors who asked" value={inquiries} hint="Chats with an explicit discount request" />
              <StatCard label="Offers made" value={st.issued} hint={st.byLevel.length ? st.byLevel.map((l) => `${l.percent}%: ${l.n}`).join(" · ") : "None yet"} />
              <StatCard label="Offers applied" value={st.accepted} hint="Visitor pressed Apply and the server confirmed" />
              <StatCard label="Average offer" value={st.issued ? `${st.avgPercent}%` : "—"} hint="Average authorized percentage" />
              <StatCard label="Paid orders with an offer" value={st.orders} hint={st.testExcluded ? `${st.testExcluded} test-network order(s) left out` : "Real payments only"} />
              <StatCard label="Discounts given" value={usd(st.discountCents)} hint="On those paid orders" />
              <StatCard label="Associated revenue" value={usd(st.revenueCents)} hint="Totals of those orders. Associated, not caused by Pilo." />
              <StatCard label="Kept larger savings" value={ev.byEvent.offer_kept_volume?.sessions ?? 0} hint="Existing volume savings were better" />
            </div>
          )}
        </Panel>
      </div>
      <div className="max-w-4xl"><NegotiationForm initial={policy} categories={getCategories().map((c) => ({ slug: c.slug, name: c.name }))} products={getProducts().map((p) => ({ slug: p.slug, name: p.name }))} /></div>
    </>
  );
}
