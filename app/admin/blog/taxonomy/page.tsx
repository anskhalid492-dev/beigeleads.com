import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listCategories, listTags } from "@/lib/blog/taxonomy";
import { CategoryManager, TagManager } from "./forms";

export const dynamic = "force-dynamic";

export default async function Taxonomy() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let data;
  try { data = { cats: await listCategories(env), tags: await listTags(env) }; } catch {
    return <><PageHeader title="Categories & tags" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run drizzle/0007_blog_cms.sql in D1 first.</p></>;
  }
  return (
    <>
      <PageHeader title="Categories & tags" text="Categories get a public page at /blog/category/<slug>. A category with articles cannot be deleted until they are moved." actions={<Link href="/admin/blog" className="text-sm font-semibold underline">Back to articles</Link>} />
      <h2 className="mb-3 text-lg font-bold text-forest-900">Categories</h2>
      <CategoryManager cats={data.cats} />
      <h2 className="mb-3 mt-10 text-lg font-bold text-forest-900">Tags</h2>
      <TagManager tags={data.tags} />
    </>
  );
}
