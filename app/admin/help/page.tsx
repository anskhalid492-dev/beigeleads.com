import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { summary, type Summary } from "@/lib/help/analytics";
import { articleId } from "@/lib/help/data";
import { loadAll } from "@/lib/help/store";
import { ImportButton } from "./controls";

export const dynamic = "force-dynamic";

export default async function HelpOverview() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const all = await loadAll(env);
  let s: Summary | null = null;
  try { s = await summary(env); } catch { s = null; }

  if (!all) {
    return (
      <>
        <PageHeader title="Help Center" text="Manage articles, topics and see what visitors search for." />
        <Panel><Empty title="Running on the built-in content" text="The public Help Center works as before. To manage it here, run migration 0021_help_cms.sql in D1, then import the built-in articles." /><div className="px-6 pb-8 text-center"><ImportButton /></div></Panel>
      </>
    );
  }
  const title = (id: string) => all.articles.find((a) => articleId(a) === id)?.title ?? id;
  const published = all.articles.filter((a) => a.status === "published").length;
  const drafts = all.articles.length - published;
  const fb = (s?.feedback ?? []).map((f) => ({ ...f, total: f.yes + f.no, rate: Math.round((f.yes / Math.max(1, f.yes + f.no)) * 100) }));
  const weak = fb.filter((f) => f.total >= 3).sort((a, b) => a.rate - b.rate).slice(0, 8);

  return (
    <>
      <PageHeader title="Help Center" text="Counts are real and anonymous: no IP address, account or cookie is stored with searches, views or votes." actions={<div className="flex gap-2"><Button asChild size="sm" variant="secondary"><Link href="/admin/help/categories">Topics</Link></Button><Button asChild size="sm" variant="secondary"><Link href="/admin/help/articles">Articles</Link></Button><Button asChild size="sm"><Link href="/admin/help/articles/new">New article</Link></Button></div>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Published articles" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Topics" value={all.categories.length} />
        <StatCard label="Views (30 days)" value={s?.views30 ?? "–"} />
        <StatCard label="Searches (30 days)" value={s?.searches30 ?? "–"} />
      </div>
      {!s && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Analytics tables are not available yet (migration 0021 not fully applied).</p>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Searches with no matching article (30 days)">
          {s && s.noResults.length ? <ul className="divide-y divide-sand-200 text-sm">{s.noResults.map((r) => <li key={r.q} className="flex justify-between gap-3 px-5 py-2.5"><span className="truncate">{r.q}</span><Badge tone="warn">{r.n}×</Badge></li>)}</ul> : <Empty title="Nothing yet" text="Searches that find no article appear here. They are the best ideas for new articles." />}
        </Panel>
        <Panel title="Most searched (30 days)">
          {s && s.topSearches.length ? <ul className="divide-y divide-sand-200 text-sm">{s.topSearches.map((r) => <li key={r.q} className="flex justify-between gap-3 px-5 py-2.5"><span className="truncate">{r.q}</span><span className="shrink-0 text-xs">{r.n}× · avg {r.avgResults} results</span></li>)}</ul> : <Empty title="Nothing yet" text="Search words are recorded once someone uses the search box (kept 90 days)." />}
        </Panel>
        <Panel title="Most viewed articles (30 days)">
          {s && s.topViewed.length ? <ul className="divide-y divide-sand-200 text-sm">{s.topViewed.map((r) => <li key={r.articleId} className="flex justify-between gap-3 px-5 py-2.5"><span className="truncate">{title(r.articleId)}</span><span className="shrink-0 text-xs">{r.views} views</span></li>)}</ul> : <Empty title="Nothing yet" text="Views are counted once per visitor session." />}
        </Panel>
        <Panel title="Lowest-rated articles (3+ votes)">
          {weak.length ? <ul className="divide-y divide-sand-200 text-sm">{weak.map((r) => <li key={r.articleId} className="flex justify-between gap-3 px-5 py-2.5"><span className="truncate">{title(r.articleId)}</span><span className="shrink-0 text-xs">{r.rate}% helpful · {r.yes} yes / {r.no} no</span></li>)}</ul> : <Empty title="Not enough votes yet" text="Articles show here once they have at least three helpful / not helpful votes." />}
        </Panel>
      </div>
      <Panel title="All article feedback" className="mt-5">
        {fb.length ? <ul className="divide-y divide-sand-200 text-sm">{fb.map((r) => <li key={r.articleId} className="flex justify-between gap-3 px-5 py-2.5"><span className="truncate">{title(r.articleId)}</span><span className="shrink-0 text-xs">{r.yes} helpful · {r.no} not helpful</span></li>)}</ul> : <Empty title="No votes yet" text="Votes from the “Was this article helpful?” box appear here." />}
      </Panel>
    </>
  );
}
