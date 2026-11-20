import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { importReady, listImports, listProducts, rowFlags, rowPackages, rowRestricted, stats } from "@/lib/import/store";
import { rollbackAction } from "../import/actions";
import { Table } from "./table";

export const dynamic = "force-dynamic";
type SP = { q?: string; status?: string; channel?: string; restricted?: string; flag?: string; page?: string; import?: string };

export default async function ImportedPage({ searchParams }: { searchParams: Promise<SP> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  if (!(await importReady(db))) return <><PageHeader title="Imported products" /><Empty title="Migration 0035 is not applied yet" text="Run drizzle/0035_catalog_import.sql in D1, one statement at a time." /></>;
  const [list, st, imports] = await Promise.all([
    listProducts(db, { q: sp.q, status: sp.status, channel: sp.channel, restricted: sp.restricted === "yes" || sp.restricted === "no" ? sp.restricted : undefined, flag: sp.flag, importId: Number(sp.import) || undefined }, Number(sp.page) || 1),
    stats(db), listImports(db),
  ]);
  const q = (o: Partial<SP>) => `?${new URLSearchParams(Object.entries({ ...sp, ...o }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <>
      <PageHeader title="Imported products" text="Everything imported starts as a draft. Restricted products need the Also-publish-restricted confirmation when you publish; products without a price cannot be published. Products without a delivery link can be published, but paid orders for them wait until you add the link." actions={<Link href="/admin/products/import" className="text-sm underline">Import products</Link>} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Draft" value={String(st.byStatus.draft ?? 0)} /><StatCard label="Published" value={String(st.byStatus.published ?? 0)} />
        <StatCard label="Archived" value={String(st.byStatus.archived ?? 0)} /><StatCard label="Restricted" value={String(st.restricted)} />
      </div>
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search name or slug" className="rounded-lg border border-sand-300 px-3 py-1.5" />
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-lg border border-sand-300 px-2 py-1.5"><option value="">Any status</option><option>draft</option><option>published</option><option>archived</option></select>
        <select name="channel" defaultValue={sp.channel ?? ""} className="rounded-lg border border-sand-300 px-2 py-1.5"><option value="">Any channel</option><option value="business-email">Business email</option><option value="consumer-email">Consumer email</option><option value="phone">Phone</option><option value="email">Email</option></select>
        <select name="restricted" defaultValue={sp.restricted ?? ""} className="rounded-lg border border-sand-300 px-2 py-1.5"><option value="">Restricted: any</option><option value="yes">Restricted only</option><option value="no">Not restricted</option></select>
        <input name="flag" defaultValue={sp.flag} placeholder="Flag contains…" className="rounded-lg border border-sand-300 px-3 py-1.5" />
        <button className="rounded-full border border-forest-900 px-4 py-1.5 font-semibold">Filter</button>
      </form>
      <Panel title={`${list.total} products`}>
        {list.rows.length === 0 ? <Empty title="No products match" /> : (
          <Table rows={list.rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, status: r.status, category: r.categoryName, country: r.countryName, channel: r.channel, packages: rowPackages(r).map((p) => `${p.name} $${(p.priceUsdCents / 100).toFixed(0)}`).join(", "), restricted: rowRestricted(r), flags: rowFlags(r).length }))} />
        )}
        <p className="flex items-center justify-between p-4 text-sm"><span>Page {list.page} of {list.pages}</span><span className="flex gap-3">{list.page > 1 && <Link className="underline" href={q({ page: String(list.page - 1) })}>Previous</Link>}{list.page < list.pages && <Link className="underline" href={q({ page: String(list.page + 1) })}>Next</Link>}</span></p>
      </Panel>
      <Panel title="Import history">
        <ul className="divide-y divide-sand-200 text-sm">
          {imports.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span>#{i.id} · {i.filename} · {i.status} · <Link className="underline" href={q({ import: String(i.id), page: "" })}>view products</Link></span>
              <form action={rollbackAction} className="flex items-center gap-2"><input type="hidden" name="id" value={i.id} /><label className="flex items-center gap-1 text-xs"><input type="checkbox" name="confirm" value="1" required /> Confirm</label><button className="rounded-full border border-red-700 px-3 py-1 text-xs font-semibold text-red-800">Roll back drafts</button></form>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
