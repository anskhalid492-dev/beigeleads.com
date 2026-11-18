import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { authorOptions, listAuthors, type AuthorSort } from "@/lib/blog/authors";
import { AuthorTable } from "./author-table";

export const dynamic = "force-dynamic";
type SP = Promise<{ q?: string; sort?: string; dir?: string; page?: string }>;
const SORTS: AuthorSort[] = ["name", "role", "status", "updated", "articles"];

export default async function AuthorsAdmin({ searchParams }: { searchParams: SP }) {
  await guardAdmin();
  const sp = await searchParams;
  const env = getCloudflareContext().env;
  const sort = (SORTS.includes(sp.sort as AuthorSort) ? sp.sort : "updated") as AuthorSort;
  const dir = sp.dir === "asc" ? "asc" : "desc";
  let list, everyone;
  try { [list, everyone] = await Promise.all([listAuthors(env, { q: sp.q?.slice(0, 80), sort, dir, page: Number(sp.page) || 1 }), authorOptions(env)]); } catch {
    return (
      <>
        <PageHeader title="Authors" />
        <p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The author tables are not set up yet. Run drizzle/0010_blog_authors.sql in D1, one statement at a time, then reload this page.</p>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Authors" text="Real people who write for the blog. A published profile gets a public page at /blog/author/<slug>. Emails are private and never shown publicly."
        actions={<Button asChild><Link href="/admin/blog/authors/new">Add new author</Link></Button>} />
      <AuthorTable everyone={everyone.map((o) => ({ id: o.id, name: o.name }))}
        rows={list.rows.map((r) => ({ id: r.id, name: r.displayName, fullName: r.fullName, title: r.title, email: r.email, photo: r.photo, status: r.status, published: r.published, slug: r.slug, updated: r.updatedAt.toISOString().slice(0, 10) }))}
        total={list.total} page={list.page} per={list.per} q={sp.q ?? ""} sort={sort} dir={dir} />
    </>
  );
}
