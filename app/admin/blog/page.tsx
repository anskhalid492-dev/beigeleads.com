import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardBlog } from "@/lib/admin/guard";
import { blogStats, listPosts, type PostStatus } from "@/lib/blog/posts";
import { listCategories } from "@/lib/blog/taxonomy";
import { createAction } from "./actions";
import { PostTable } from "./post-table";

export const dynamic = "force-dynamic";
type SP = Promise<{ q?: string; status?: string; category?: string; author?: string; sort?: string; page?: string }>;

export default async function BlogAdmin({ searchParams }: { searchParams: SP }) {
  const user = await guardBlog();
  const sp = await searchParams;
  const env = getCloudflareContext().env;
  let data;
  try {
    const status = (["draft", "scheduled", "published", "archived"].includes(sp.status ?? "") ? sp.status : "") as PostStatus | "";
    const sort = (["updated", "title", "published"].includes(sp.sort ?? "") ? sp.sort : "updated") as "updated" | "title" | "published";
    const [stats, list, cats] = await Promise.all([
      blogStats(env),
      listPosts(env, { q: sp.q?.slice(0, 100), status, categoryId: Number(sp.category) || undefined, author: sp.author, sort, page: Number(sp.page) || 1 }),
      listCategories(env),
    ]);
    data = { stats, list, cats, status, sort };
  } catch {
    return (
      <>
        <PageHeader title="Blog" />
        <p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The blog tables are not set up yet. Run drizzle/0007_blog_cms.sql in D1, one statement at a time, then reload this page.</p>
      </>
    );
  }
  const { stats, list, cats, status, sort } = data;
  return (
    <>
      <PageHeader title="Blog" text="Write, schedule and publish articles. Bodies and images are stored in R2; settings and status in D1."
        actions={<div className="flex gap-2">{user.role === "admin" && <Button asChild variant="secondary"><Link href="/admin/blog/taxonomy">Categories & tags</Link></Button>}<form action={createAction}><Button type="submit">New article</Button></form></div>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="All articles" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Archived" value={stats.archived} />
      </div>
      <PostTable role={user.role}
        rows={list.rows.map((r) => ({ id: r.id, title: r.title, slug: r.slug, status: r.status as PostStatus, author: r.author, image: r.featuredImage, category: r.categoryName, published: r.publishedAt ? fmtDate(r.publishedAt) : "", scheduled: r.scheduledAt ? fmtDate(r.scheduledAt) : "", updated: fmtDate(r.updatedAt) }))}
        total={list.total} page={list.page} per={list.per}
        cats={cats.map((c) => ({ id: c.id, name: c.name }))} authors={stats.authors}
        q={sp.q ?? ""} status={status} category={sp.category ?? ""} author={sp.author ?? ""} sort={sort}
      />
    </>
  );
}
