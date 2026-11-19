import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { ArticleBody } from "@/components/blog/render";
import { guardBlog } from "@/lib/admin/guard";
import { getPost, getRevision, listRevisions } from "@/lib/blog/posts";
import { RestoreButton } from "./restore-button";

export const dynamic = "force-dynamic";

export default async function Revisions({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ rev?: string }> }) {
  const user = await guardBlog();
  const id = Number((await params).id);
  const env = getCloudflareContext().env;
  const post = Number.isInteger(id) ? await getPost(env, id) : null;
  if (!post || (post.kind === "guide" && user.role !== "admin")) notFound();
  const revs = await listRevisions(env, id);
  const sel = Number((await searchParams).rev) || 0;
  const shown = sel ? await getRevision(env, id, sel) : null;
  return (
    <>
      <PageHeader title="Revision history" text={`“${post.title}”. Restoring creates a new version, so nothing is lost. Autosaves are recorded at most every 10 minutes.`}
        actions={<Link href={`${post.kind === "guide" ? "/admin/guides" : "/admin/blog"}/${id}/edit`} className="text-sm font-semibold underline">Back to editor</Link>} />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Panel title={`${revs.length} revision${revs.length === 1 ? "" : "s"}`}>
          {revs.length === 0 ? <Empty title="No revisions yet" text="A revision is saved when you press Save, and periodically while autosaving." /> : (
            <ul className="divide-y divide-sand-200 text-sm">
              {revs.map((r) => (
                <li key={r.id} className={sel === r.id ? "bg-sand-100" : ""}>
                  <Link href={`?rev=${r.id}`} className="block px-5 py-3 hover:bg-sand-100">
                    <span className="flex items-center gap-2"><strong className="text-forest-900">v{r.version}</strong><Badge tone={r.kind === "autosave" ? "mute" : "info"}>{r.kind}</Badge></span>
                    <span className="mt-1 block truncate">{r.title}</span>
                    <span className="block text-xs">{fmtDate(r.createdAt)} · {r.editor}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={shown ? `Version ${shown.meta.version}` : "Select a revision"}>
          {shown ? (
            <div className="p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><h2 className="display text-3xl text-forest-900">{shown.snap.title}</h2><RestoreButton postId={id} revisionId={shown.meta.id} version={post.version} /></div>
              <ArticleBody doc={shown.snap.doc} />
            </div>
          ) : <Empty title="Pick a revision on the left" text="You can read it here before restoring." />}
        </Panel>
      </div>
    </>
  );
}
