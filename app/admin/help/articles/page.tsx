import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { loadAll } from "@/lib/help/store";
import { ArticleRowActions, ImportButton, ReviewUpdateButton } from "../controls";

export const dynamic = "force-dynamic";
const PAGE = 30;

export default async function HelpArticles({ searchParams }: { searchParams: Promise<{ q?: string; topic?: string; status?: string; page?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const all = await loadAll(getCloudflareContext().env);
  if (!all) {
    return (
      <>
        <PageHeader title="Help articles" />
        <Panel><Empty title="The Help Center is still running on the built-in content" text="Run migration 0021_help_cms.sql in D1, then import the built-in articles here. Until then the public pages keep working as before." /><div className="px-6 pb-8 text-center"><ImportButton /></div></Panel>
      </>
    );
  }
  const q = (sp.q ?? "").toLowerCase().trim();
  const topicName = (s: string) => all.categories.find((c) => c.slug === s)?.name ?? s;
  const shown = all.articles.filter((a) => (!sp.topic || a.category === sp.topic) && (!sp.status || a.status === sp.status) && (!q || `${a.title} ${a.slug} ${a.description}`.toLowerCase().includes(q)));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(pages, Math.max(1, Number(sp.page) || 1));
  const view = shown.slice((page - 1) * PAGE, page * PAGE);
  const qs = (n: number) => { const u = new URLSearchParams(); for (const k of ["q", "topic", "status"] as const) if (sp[k]) u.set(k, sp[k]!); u.set("page", String(n)); return `?${u}`; };
  const firstOf = (a: (typeof all.articles)[number]) => all.articles.find((x) => x.category === a.category)?.id === a.id;
  const lastOf = (a: (typeof all.articles)[number]) => [...all.articles].reverse().find((x) => x.category === a.category)?.id === a.id;

  return (
    <>
      <PageHeader title="Help articles" text="Drafts are never public. Use the arrows to change the order inside a topic." actions={<div className="flex gap-2"><ImportButton label="Import missing built-in articles" /><ReviewUpdateButton /><Button asChild size="sm"><Link href="/admin/help/articles/new">New article</Link></Button></div>} />
      <form className="mb-4 flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={sp.q} placeholder="Search title or slug" aria-label="Search" className="min-w-[14rem] rounded-xl border border-sand-300 bg-white px-3 py-2" />
        <select name="topic" defaultValue={sp.topic ?? ""} aria-label="Topic" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All topics</option>{all.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select>
        <Button type="submit" size="sm" variant="secondary">Filter</Button>
      </form>
      <Panel>
        {view.length === 0 ? <Empty title="No articles match" text="Change the filters or create a new article." /> : (
          <ul className="divide-y divide-sand-200">
            {view.map((a) => (
              <li key={a.id} className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[minmax(0,1.6fr)_1fr_auto] md:items-center">
                <div className="min-w-0"><Link href={`/admin/help/articles/${a.id}`} className="block truncate font-semibold text-forest-900 hover:underline">{a.title}</Link><p className="truncate text-xs">/help/{a.category}/{a.slug}</p></div>
                <div className="flex flex-wrap items-center gap-2"><Badge tone={a.status === "published" ? "good" : "warn"}>{a.status === "published" ? "Published" : "Draft"}</Badge><span className="text-xs">{topicName(a.category)}{a.group ? ` · ${a.group}` : ""}</span>{(a.featured ?? 0) > 0 && <Badge tone="info">Getting started</Badge>}{(a.common ?? 0) > 0 && <Badge tone="mute">Common</Badge>}</div>
                <ArticleRowActions id={a.id!} status={a.status ?? "draft"} first={firstOf(a)} last={lastOf(a)} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? <a className="font-semibold underline underline-offset-4" href={qs(page - 1)}>Previous</a> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <a className="font-semibold underline underline-offset-4" href={qs(page + 1)}>Next</a> : <span />}
        </nav>
      )}
    </>
  );
}
