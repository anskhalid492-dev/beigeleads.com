import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin, guardBlog } from "@/lib/admin/guard";
import { blogStats, listPosts, type PostStatus } from "@/lib/blog/posts";
import { listCategories } from "@/lib/blog/taxonomy";
import { createAction, createCaseStudyAction, createGuideAction } from "./actions";
import { KINDS, type Kind } from "@/lib/blog/kind";
import { PostTable } from "./post-table";

type SP = Promise<{ q?: string; status?: string; category?: string; author?: string; sort?: string; page?: string }>;

export async function PostsAdmin({ kind, searchParams }: { kind: Kind; searchParams: SP }) {
  const G = kind !== "blog";
  const CS = kind === "case";
  const K = KINDS[kind];
  const user = G ? { ...(await guardAdmin()), role: "admin" as const } : await guardBlog();
  const sp = await searchParams;
  const env = getCloudflareContext().env;
  let data;
  try {
    const status = (["draft", "scheduled", "published", "archived"].includes(sp.status ?? "") ? sp.status : "") as PostStatus | "";
    const sort = (["updated", "title", "published"].includes(sp.sort ?? "") ? sp.sort : "updated") as "updated" | "title" | "published";
    const [stats, list, cats] = await Promise.all([
      blogStats(env, kind),
      listPosts(env, { kind, q: sp.q?.slice(0, 100), status, categoryId: Number(sp.category) || undefined, author: sp.author, sort, page: Number(sp.page) || 1 }),
      listCategories(env, kind),
    ]);
    data = { stats, list, cats, status, sort };
  } catch {
    return (
      <>
        <PageHeader title={CS ? "Case Studies" : G ? "Guides" : "Blog"} />
        <p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">{CS ? "The blog and guide migrations (0007, 0026) must be run in D1 first, then reload this page." : G ? "Guides need migration 0026 in D1 (3 statements, one at a time), then reload this page." : "The blog tables are not set up yet. Run drizzle/0007_blog_cms.sql in D1, one statement at a time, then reload this page."}</p>
      </>
    );
  }
  const { stats, list, cats, status, sort } = data;
  return (
    <>
      <PageHeader title={CS ? "Case Studies" : G ? "Guides" : "Blog"} text={CS ? "Case studies at /case-studies. Same editor as the blog: autosave, revisions, scheduling, SEO and the media library. Label illustrative examples as illustrative." : G ? "Long-form guides at /guides. Same editor as the blog: autosave, revisions, scheduling and SEO." : "Write, schedule and publish articles. Bodies and images are stored in R2; settings and status in D1."}
        actions={<div className="flex gap-2">{user.role === "admin" && <Button asChild variant="secondary"><Link href={`${K.admin}/taxonomy`}>Categories & tags</Link></Button>}{(!G || CS) && user.role === "admin" && <Button asChild variant="secondary"><Link href="/admin/blog/starters">Starter articles</Link></Button>}{(!G || user.role === "admin") && <form action={CS ? createCaseStudyAction : G ? createGuideAction : createAction}><Button type="submit">New {KINDS[kind].one}</Button></form>}</div>} />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label={`All ${KINDS[kind].many}`} value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Archived" value={stats.archived} />
      </div>
      <PostTable kind={kind} role={user.role}
        rows={list.rows.map((r) => ({ id: r.id, title: r.title, slug: r.slug, status: r.status as PostStatus, author: r.author, image: r.featuredImage, category: r.categoryName, published: r.publishedAt ? fmtDate(r.publishedAt) : "", scheduled: r.scheduledAt ? fmtDate(r.scheduledAt) : "", updated: fmtDate(r.updatedAt) }))}
        total={list.total} page={list.page} per={list.per}
        cats={cats.map((c) => ({ id: c.id, name: c.name }))} authors={stats.authors}
        q={sp.q ?? ""} status={status} category={sp.category ?? ""} author={sp.author ?? ""} sort={sort}
      />
    </>
  );
}
