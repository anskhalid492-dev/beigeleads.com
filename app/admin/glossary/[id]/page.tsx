import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getCategories, termById } from "@/lib/glossary/store";
import { deleteTermAction, setStatusAction } from "../actions";
import { TermForm } from "../term-form";

export const dynamic = "force-dynamic";
export default async function EditTerm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await guardAdmin();
  const { id } = await params; const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const t = await termById(db, Number(id)); if (!t) notFound();
  const cats = await getCategories(db);
  return (
    <>
      <PageHeader title={t.term} text={`/glossary/${t.slug}`} actions={<div className="flex flex-wrap items-center gap-3"><Badge tone={t.status === "published" ? "good" : "mute"}>{t.status === "published" ? "Published" : "Draft"}</Badge><Link href={`/admin/glossary/${t.id}/preview`} className="text-sm font-semibold underline">Preview</Link>{t.status === "published" && <Link href={`/glossary/${t.slug}`} className="text-sm font-semibold underline">View live</Link>}<Link href="/admin/glossary" className="text-sm underline">Back to the list</Link></div>} />
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">{sp.saved}</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      <TermForm categories={cats} init={{ id: t.id, status: t.status, term: t.term, slug: t.slug, category: t.categorySlug, shortDefinition: t.shortDefinition, content: t.content, whyItMatters: t.whyItMatters, example: t.example, relatedTerms: t.relatedTerms, relatedGuides: t.relatedGuides, relatedProducts: t.relatedProducts, seoTitle: t.seoTitle, metaDescription: t.metaDescription, keywords: t.keywords, featured: t.featured === 1 }} />
      <Panel title="Publish and delete" className="mt-8">
        <div className="flex flex-wrap items-start gap-8 px-5 py-4">
          <form action={setStatusAction}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="to" value={t.status === "published" ? "draft" : "publish"} /><button type="submit" className="rounded-full border border-forest-900 px-5 py-2 text-sm font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">{t.status === "published" ? "Unpublish (move to draft)" : "Publish now"}</button></form>
          <form action={deleteTermAction} className="space-y-2"><input type="hidden" name="id" value={t.id} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" value="1" /> I confirm: delete this entry permanently</label><button type="submit" className="text-sm font-semibold text-red-800 underline">Delete entry</button></form>
        </div>
      </Panel>
    </>
  );
}
