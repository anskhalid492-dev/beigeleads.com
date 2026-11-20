import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { KINDS, type Kind } from "@/lib/blog/kind";
import { CategoryManager, TagManager } from "./forms";

export async function TaxonomyAdmin({ kind }: { kind: Kind }) {
  const K = KINDS[kind];
  await guardAdmin();
  const env = getCloudflareContext().env;
  let data;
  try { data = { cats: await listCategories(env, kind), tags: await listTags(env) }; } catch {
    return <><PageHeader title="Categories & tags" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run drizzle/0007_blog_cms.sql in D1 first.</p></>;
  }
  return (
    <>
      <PageHeader title="Categories & tags" text={kind === "case" ? "Case study categories (industry and use case) are filters on /case-studies. A category with case studies cannot be deleted until they are moved. Tags are shared with the blog." : kind === "guide" ? "Guide categories are filters on /guides. A category with guides cannot be deleted until they are moved. Tags are shared with the blog." : "Categories get a public page at /blog/category/<slug>. A category with articles cannot be deleted until they are moved."} actions={<Link href={K.admin} className="text-sm font-semibold underline">Back to {K.many}</Link>} />
      <h2 className="mb-3 text-lg font-bold text-forest-900">Categories</h2>
      <CategoryManager kind={kind} cats={data.cats} />
      <h2 className="mb-3 mt-10 text-lg font-bold text-forest-900">Tags</h2>
      <TagManager tags={data.tags} />
    </>
  );
}
