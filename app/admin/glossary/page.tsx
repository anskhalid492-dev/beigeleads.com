import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { MIN_PUBLISH } from "@/lib/glossary/clean";
import { getCategories, listAdmin } from "@/lib/glossary/store";
import { ListTable } from "./list-table";

export const dynamic = "force-dynamic";
type SP = { q?: string; status?: string; category?: string; page?: string; saved?: string; error?: string };

export default async function GlossaryAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const page = Math.max(1, Number(sp.page) || 1); const per = 25;
  const [list, cats] = await Promise.all([listAdmin(db, { q: (sp.q ?? "").slice(0, 80), status: sp.status, category: sp.category, page, per }), getCategories(db)]);
  const pages = Math.max(1, Math.ceil(list.total / per));
  const qs = (o: Record<string, string | number | undefined>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries({ q: sp.q, status: sp.status, category: sp.category, ...o })) if (v) p.set(k, String(v)); const s = p.toString(); return `/admin/glossary${s ? `?${s}` : ""}`; };
  const rows = list.rows.map((r) => ({ id: r.id, term: r.term, slug: r.slug, category: r.categorySlug, status: r.status, featured: r.featured === 1, thin: r.shortDefinition.length < MIN_PUBLISH.short || r.content.length < MIN_PUBLISH.content, updated: new Date(r.updatedAt * 1000).toISOString().slice(0, 10) }));
  return (
    <>
      <PageHeader title="Glossary" text="Write terms by hand or upload hundreds at once. Entries stay drafts until you publish them." actions={<div className="flex flex-wrap gap-2"><Button asChild variant="secondary"><Link href="/admin/glossary/categories">Categories</Link></Button><Button asChild variant="secondary"><Link href="/admin/glossary/import">Bulk upload</Link></Button><Button asChild><Link href="/admin/glossary/new">Add entry</Link></Button></div>} />
      {!list.ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Migration 0032 is not applied yet. Run it in D1 (one statement at a time) before using the glossary.</p>}
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      <div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard label="Published" value={list.published} /><StatCard label="Drafts" value={list.drafts} /><StatCard label="Categories" value={cats.length} /></div>
      <Panel>
        <form className="flex flex-wrap items-end gap-3 border-b border-sand-200 px-5 py-4" method="get">
          <div><label htmlFor="q" className="mb-1 block text-xs font-bold text-forest-900">Search</label><input id="q" name="q" defaultValue={sp.q} placeholder="Term, slug or definition" className="w-64 rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" /></div>
          <div><label htmlFor="st" className="mb-1 block text-xs font-bold text-forest-900">Status</label><select id="st" name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"><option value="">All</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
          <div><label htmlFor="ct" className="mb-1 block text-xs font-bold text-forest-900">Category</label><select id="ct" name="category" defaultValue={sp.category ?? ""} className="rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm"><option value="">All</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
          <Button type="submit" size="sm">Filter</Button>
          {(sp.q || sp.status || sp.category) && <Link href="/admin/glossary" className="pb-2 text-sm underline">Clear</Link>}
        </form>
        {rows.length === 0 ? <Empty title={list.total === 0 && !sp.q && !sp.status && !sp.category ? "No glossary entries yet" : "No entries match"} text={list.total === 0 && !sp.q && !sp.status && !sp.category ? "Add the 58 starter entries as drafts from Bulk upload, or write one by hand." : "Try other filters."} /> : <ListTable rows={rows} categories={cats.map((c) => ({ slug: c.slug, name: c.name }))} back={qs({ page: page > 1 ? page : undefined })} />}
        {pages > 1 && <div className="flex items-center justify-between border-t border-sand-200 px-5 py-3 text-sm"><span>Page {page} of {pages}</span><span className="flex gap-4">{page > 1 && <Link href={qs({ page: page - 1 })} className="underline">Previous</Link>}{page < pages && <Link href={qs({ page: page + 1 })} className="underline">Next</Link>}</span></div>}
      </Panel>
    </>
  );
}
