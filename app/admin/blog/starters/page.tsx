import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { authorOptions } from "@/lib/blog/authors";
import { STARTERS } from "@/lib/blog/starters";
import { getDbFromEnv, schema } from "@/lib/db";
import { StarterRow } from "./row";

export const dynamic = "force-dynamic";

export default async function Starters() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let authors: Awaited<ReturnType<typeof authorOptions>> = [];
  const existing = new Map<string, number>();
  try {
    authors = await authorOptions(env);
    for (const s of STARTERS) { const r = await getDbFromEnv(env).select({ id: schema.blogPosts.id }).from(schema.blogPosts).where(eq(schema.blogPosts.slug, s.slug)).limit(1); if (r[0]) existing.set(s.slug, r[0].id); }
  } catch {
    return <><PageHeader title="Starter articles" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run the blog and author migrations in D1 first (0007 and 0010).</p></>;
  }
  return (
    <>
      <PageHeader title="Starter articles" text="Ready-written articles. Adding one creates a DRAFT in the normal blog editor (category and tags included). You add the featured image, check it, and publish it yourself."
        actions={<Link href="/admin/blog" className="text-sm font-semibold underline">Back to articles</Link>} />
      <div className="space-y-4">
        {STARTERS.map((s) => (
          <Panel key={s.slug}>
            <StarterRow slug={s.slug} title={s.title} excerpt={s.excerpt} category={s.category} existingId={existing.get(s.slug) ?? null} authors={authors.map((a) => ({ id: a.id, name: a.name, title: a.title }))} />
          </Panel>
        ))}
      </div>
    </>
  );
}
