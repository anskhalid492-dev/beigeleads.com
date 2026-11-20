import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sql } from "drizzle-orm";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv, schema } from "@/lib/db";
import { getCategories } from "@/lib/glossary/store";
import { deleteCategoryAction, saveCategoryAction } from "../actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
export default async function Categories({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const cats = await getCategories(db);
  const counts = new Map<string, number>();
  try { for (const r of await db.select({ c: schema.glossaryTerms.categorySlug, n: sql<number>`count(*)` }).from(schema.glossaryTerms).groupBy(schema.glossaryTerms.categorySlug)) counts.set(r.c, r.n); } catch { /* migration missing */ }
  return (
    <>
      <PageHeader title="Glossary categories" text="Categories group entries on the glossary home. A category with entries cannot be deleted." actions={<Link href="/admin/glossary" className="text-sm underline">Back to the list</Link>} />
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      <Panel title="Add a category" className="mb-5"><form action={saveCategoryAction} className="grid gap-3 p-5 sm:grid-cols-[1fr_2fr_auto] sm:items-end"><div><label className="mb-1 block text-xs font-bold" htmlFor="n">Name</label><input id="n" name="name" required maxLength={80} className={f} /></div><div><label className="mb-1 block text-xs font-bold" htmlFor="d">Description</label><input id="d" name="description" maxLength={300} className={f} /></div><Button type="submit">Add</Button></form></Panel>
      <Panel title={`Categories (${cats.length})`}>
        <ul className="divide-y divide-sand-200">
          {cats.map((c) => (
            <li key={c.slug} className="px-5 py-4">
              <form action={saveCategoryAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <input type="hidden" name="slug" value={c.slug} />
                <div><label className="mb-1 block text-xs font-bold">Name <span className="font-mono font-normal text-forest-500">/{c.slug}</span></label><input name="name" defaultValue={c.name} required maxLength={80} className={f} /></div>
                <div><label className="mb-1 block text-xs font-bold">Description <span className="font-normal">({counts.get(c.slug) ?? 0} entries)</span></label><input name="description" defaultValue={c.description} maxLength={300} className={f} /></div>
                <Button type="submit" size="sm" variant="secondary">Save</Button>
              </form>
              {!(counts.get(c.slug) ?? 0) && <form action={deleteCategoryAction} className="mt-2"><input type="hidden" name="slug" value={c.slug} /><button type="submit" className="text-xs font-semibold text-red-800 underline">Delete category</button></form>}
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
