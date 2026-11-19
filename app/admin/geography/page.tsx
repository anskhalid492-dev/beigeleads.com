import Link from "next/link";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getCategories, getCountries } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { allCoverage } from "@/lib/geo/store";
import { ImportForm } from "./import-form";
import { removeCoverageAction, setIndexableAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function GeographyPage() {
  await guardAdmin();
  const g = await allCoverage(getDb());
  const name = new Map(getCategories().map((c) => [c.slug, c.name]));
  const byArea = new Map<number, { category: string; n: number }[]>();
  for (const r of g.coverage) byArea.set(r.areaId, [...(byArea.get(r.areaId) ?? []), { category: r.categorySlug, n: r.recordCount }]);
  const parent = new Map(g.areas.map((a) => [a.id, a]));
  return (
    <>
      <PageHeader title="Geography" text="Countries, states/regions and cities, and the REAL number of records you have in each. Pages for a place are views of an existing product. They are indexable only when the place has real records." />
      {!g.ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Migration 0028 is not applied yet. Until then only the built-in cities exist and every place page is noindex.</p>}
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Panel title="Import places and counts"><ImportForm countries={getCountries().map((c) => ({ slug: c.slug, name: c.name }))} /></Panel>
        <Panel title={`Places (${g.areas.length})`}>
          {g.areas.length === 0 ? <Empty title="No places yet" text="Import a CSV to add states and cities with real record counts." /> : (
            <div className="max-h-[32rem] overflow-auto"><table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-sand-100 text-xs font-bold text-forest-900"><tr><th className="px-4 py-2">Place</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Records by industry</th><th className="px-4 py-2">Page</th><th className="px-4 py-2">Indexing</th></tr></thead>
              <tbody className="divide-y divide-sand-200">
                {g.areas.map((a) => {
                  const rows = byArea.get(a.id) ?? [];
                  const par = a.parentId ? parent.get(a.parentId) : null;
                  return (
                    <tr key={a.id}>
                      <td className="px-4 py-2 font-semibold">{a.name}{par ? <span className="font-normal">, {par.name}</span> : null}</td>
                      <td className="px-4 py-2">{a.level}</td>
                      <td className="px-4 py-2">{rows.length ? rows.map((r) => (
                        <form key={r.category} action={removeCoverageAction} className="mb-1 flex items-center gap-2"><input type="hidden" name="id" value={a.id} /><input type="hidden" name="category" value={r.category} /><span>{name.get(r.category) ?? r.category}: {r.n.toLocaleString("en-US")}</span><button type="submit" className="text-xs font-semibold underline" aria-label={`Remove the ${name.get(r.category) ?? r.category} count for ${a.name}`}>Remove count</button></form>
                      )) : <Badge tone="mute">No inventory</Badge>}</td>
                      <td className="px-4 py-2">{rows.length ? <Link className="underline" href={`/lists/${rows[0].category}/${a.countrySlug}/${par ? `${par.slug}/` : ""}${a.slug}`}>Open</Link> : "—"}</td>
                      <td className="px-4 py-2"><form action={setIndexableAction}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="on" value={a.indexable ? "0" : "1"} /><button type="submit" className="text-xs font-semibold underline">{a.indexable ? "Allowed. Block" : "Blocked. Allow"}</button></form></td>
                    </tr>
                  );
                })}
              </tbody></table></div>
          )}
        </Panel>
      </div>
    </>
  );
}
