import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, usd } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { hydrateCatalog } from "@/lib/catalog-db";
import { getDbFromEnv } from "@/lib/db";
import { ctxOf } from "@/lib/bundles/public";
import { listAll, loadCategories, loadStats, priceBundle } from "@/lib/bundles/store";
import { gate } from "./gate";
import { BundleRowActions } from "./row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Database Bundles", robots: { index: false, follow: false } };

export default async function BundlesAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await gate();
  const sp = await searchParams;
  const env = getCloudflareContext().env;
  await hydrateCatalog(env);
  const db = getDbFromEnv(env);
  const all = await listAll(db);
  if (!all) return (
    <>
      <PageHeader title="Database Bundles" text="Curated bundles of existing databases." />
      <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0044_bundles.sql in D1 (one statement at a time) to turn this page on.</p>
    </>
  );
  const stats = await loadStats(db);
  const cats = new Map((await loadCategories(db)).map((c) => [c.slug, c.name]));
  const q = (sp.q ?? "").toLowerCase().trim();
  const rows = all.filter((b) => (!sp.status || b.status === sp.status) && (!q || `${b.name} ${b.slug}`.toLowerCase().includes(q)));
  return (
    <>
      <PageHeader title="Database Bundles" text="Combine existing databases into one purchase. Bundles only point to catalog products; prices are checked on the server at checkout."
        actions={<div className="flex gap-2"><Button asChild variant="secondary"><Link href="/admin/bundles/categories">Categories</Link></Button><Button asChild variant="secondary"><Link href="/admin/bundles/settings">Bundle builder</Link></Button><Button asChild><Link href="/admin/bundles/new">Create bundle</Link></Button></div>} />
      {stats && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Published bundles" value={stats.published} hint={`${stats.drafts} draft${stats.drafts === 1 ? "" : "s"}`} />
          <StatCard label="Bundle purchases" value={stats.purchases} hint="Paid orders, real payments only" />
          <StatCard label="Revenue from bundles" value={usd(stats.revenueCents)} hint={stats.testExcluded ? `${stats.testExcluded} test-network payment${stats.testExcluded === 1 ? "" : "s"} not counted` : "Real payments only"} />
          <StatCard label="Average bundle order" value={stats.ordersWithBundle ? usd(stats.avgOrderCents) : "No data yet"} hint="Whole-order value" />
        </div>
      )}
      {stats && stats.top.length > 0 && (
        <Panel title="Most purchased" className="mb-5">
          <ul className="divide-y divide-sand-200 text-sm">{stats.top.map((t) => <li key={t.slug} className="flex justify-between px-5 py-2.5"><span className="font-semibold text-forest-900">{t.name}</span><span>{t.purchases} purchase{t.purchases === 1 ? "" : "s"} · {usd(t.revenueCents)}</span></li>)}</ul>
        </Panel>
      )}
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search bundles" aria-label="Search bundles" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {rows.length === 0 ? <Empty title="No bundles yet" text="Create one from existing databases." /> : (
        <Panel>
          <ul className="divide-y divide-sand-200">
            {rows.map((b) => {
              const p = priceBundle(b, ctxOf(env));
              return (
                <li key={b.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-bold text-forest-900">{b.name} {b.featured && <Badge tone="info">Featured</Badge>} <Badge tone={b.status === "published" ? "good" : "mute"}>{b.status === "published" ? "Published" : "Draft"}</Badge> {b.label && <Badge>{b.label}</Badge>}</p>
                    <p className="mt-1 text-sm">{b.items.length} databases · {cats.get(b.categorySlug) ?? "No category"} · /bundles/{b.slug}</p>
                    <p className="text-sm">{usd(p.listCents)} separately → <strong className="text-forest-900">{usd(p.priceCents)}</strong> ({p.savingsPercent}% off){!p.purchasable && p.reason ? <span className="text-amber-900"> · {p.reason}</span> : null}</p>
                  </div>
                  <BundleRowActions id={b.id} status={b.status} />
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}
