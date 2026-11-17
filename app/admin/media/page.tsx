import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { guardBlog } from "@/lib/admin/guard";
import { listMedia } from "@/lib/blog/media";
import { MediaLibrary } from "./library";

export const dynamic = "force-dynamic";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const user = await guardBlog();
  const sp = await searchParams;
  let r;
  try { r = await listMedia(getCloudflareContext().env, { q: sp.q?.slice(0, 60), page: Number(sp.page) || 1 }); } catch {
    return <><PageHeader title="Media" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">Run drizzle/0007_blog_cms.sql in D1 first.</p></>;
  }
  return (
    <>
      <PageHeader title="Media library" text="Images used in articles. They are stored in R2 and served from /media/…. Deleting an image that an article uses needs an extra confirmation." />
      <MediaLibrary role={user.role} items={r.rows.map((m) => ({ id: m.id, url: m.url, filename: m.filename, alt: m.alt, mime: m.mime, size: m.size, width: m.width, height: m.height, used: m.used, at: m.createdAt.toISOString().slice(0, 10), by: m.uploadedBy }))} total={r.total} page={r.page} per={r.per} q={sp.q ?? ""} />
      <p className="mt-4 text-xs">Looking for articles? <Link className="underline" href="/admin/blog">Open the blog</Link>.</p>
    </>
  );
}
