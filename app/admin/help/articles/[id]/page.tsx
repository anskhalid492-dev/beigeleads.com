import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { HELP_UPDATED } from "@/lib/help";
import { articleId } from "@/lib/help/data";
import { loadAll } from "@/lib/help/store";
import { ArticleEditor, type EditorArticle } from "./editor";

export const dynamic = "force-dynamic";

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ topic?: string }> }) {
  await guardAdmin();
  const { id } = await params;
  const { topic } = await searchParams;
  const all = await loadAll(getCloudflareContext().env);
  if (!all) {
    return <><PageHeader title="Article" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run migration 0021_help_cms.sql in D1, then import the built-in articles from the Articles page.</p></>;
  }
  const found = id === "new" ? undefined : all.articles.find((a) => a.id === Number(id));
  if (id !== "new" && !found) notFound();
  const article: EditorArticle = found
    ? { id: found.id, version: found.updatedAtMs, category: found.category, slug: found.slug, title: found.title, description: found.description, keywords: [...found.keywords], body: [...found.body], related: [...found.related], ctaLabel: found.cta?.label ?? "", ctaHref: found.cta?.href ?? "", group: found.group ?? "", featured: (found.featured ?? 0) > 0, common: (found.common ?? 0) > 0, status: found.status ?? "draft", seoTitle: found.seoTitle ?? "", metaDescription: found.metaDescription ?? "", noindex: !!found.noindex, updated: found.updated ?? HELP_UPDATED }
    : { category: all.categories.find((c) => c.slug === topic)?.slug ?? all.categories[0].slug, slug: "", title: "", description: "", keywords: [], body: [], related: [], ctaLabel: "", ctaHref: "", group: "", featured: false, common: false, status: "draft", seoTitle: "", metaDescription: "", noindex: false, updated: new Date().toISOString().slice(0, 10) };
  const groups: Record<string, string[]> = {};
  for (const a of all.articles) {
    if (!a.group) continue;
    const list = (groups[a.category] ??= []);
    if (!list.includes(a.group)) list.push(a.group);
  }
  return (
    <>
      <PageHeader title={found ? "Edit article" : "New article"} text="Build the article from blocks. Nothing is public until you publish." />
      <ArticleEditor article={article} topics={all.categories.map((c) => ({ slug: c.slug, name: c.name }))} groups={groups} others={all.articles.map((a) => ({ id: articleId(a), title: a.title }))} />
    </>
  );
}
