import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getCategories, getCountries } from "@/lib/catalog";
import { getDbFromEnv } from "@/lib/db";
import { INTENTS, STATUSES, TARGETS, buildBrief, classifyIntent, duplicateTargets, listKeywords, suggestTarget, type Intent, type KeywordRow } from "@/lib/seo/keywords";
import { deleteKeywordAction, saveKeywordAction } from "./actions";

export const dynamic = "force-dynamic";
const f = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const l = "mb-1 block text-xs font-bold text-forest-900";
const tone = { idea: "mute", briefed: "info", writing: "warn", published: "good" } as const;

function Fields({ r, cats, countries }: { r?: KeywordRow; cats: { slug: string; name: string }[]; countries: { slug: string; name: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {r && <input type="hidden" name="id" value={r.id} />}
      <div className="lg:col-span-2"><label className={l}>Keyword</label><input name="keyword" required defaultValue={r?.keyword} className={f} placeholder="birmingham dentist email list" /></div>
      <div><label className={l}>Search intent</label><select name="intent" defaultValue={r?.intent ?? ""} className={f}>{!r && <option value="">Suggest for me</option>}{INTENTS.map((i) => <option key={i} value={i}>{i}</option>)}</select></div>
      <div><label className={l}>Status</label><select name="status" defaultValue={r?.status ?? "idea"} className={f}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
      <div><label className={l}>Content type</label><select name="targetType" defaultValue={r?.targetType ?? "none"} className={f}>{TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="lg:col-span-2"><label className={l}>Target page (site path)</label><input name="targetPath" defaultValue={r?.targetPath} className={f} placeholder="/lists/dentists/united-states/alabama" /></div>
      <div><label className={l}>Industry</label><select name="category" defaultValue={r?.categorySlug ?? ""} className={f}><option value="">None</option>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div><label className={l}>Country</label><select name="country" defaultValue={r?.countrySlug ?? ""} className={f}><option value="">None</option>{countries.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div><label className={l}>Place (state or city)</label><input name="place" defaultValue={r?.place} className={f} /></div>
      <div className="lg:col-span-3"><label className={l}>Notes</label><input name="notes" defaultValue={r?.notes} className={f} /></div>
    </div>
  );
}

export default async function KeywordsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; brief?: string; error?: string; saved?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const db = getDbFromEnv(getCloudflareContext().env);
  const { ready, rows } = await listKeywords(db, { q: (sp.q ?? "").slice(0, 80), status: sp.status });
  const cats = getCategories().map((c) => ({ slug: c.slug, name: c.name }));
  const countries = getCountries().map((c) => ({ slug: c.slug, name: c.name }));
  const dupes = duplicateTargets(rows);
  const open = rows.find((r) => String(r.id) === sp.brief);
  const brief = open ? buildBrief({ keyword: open.keyword, intent: open.intent as Intent, category: open.categorySlug, country: open.countrySlug, place: open.place }) : null;
  return (
    <>
      <PageHeader title="Keywords and content plan" text="Map each keyword to ONE page, note the search intent, write a brief and track it from idea to published. Suggestions are rule-based (no search-volume data)." actions={<Link href="/admin/seo" className="text-sm underline">SEO Manager</Link>} />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Migration 0029 is not applied yet. Keywords cannot be saved until it is.</p>}
      {sp.error && <p role="alert" className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">{sp.error}</p>}
      {sp.saved && <p role="status" className="mb-5 rounded-xl bg-forest-100 px-4 py-3 text-sm text-forest-900">Saved.</p>}
      <Panel title="Add a keyword">
        <form action={saveKeywordAction} className="space-y-4 p-5"><Fields cats={cats} countries={countries} /><Button type="submit">Add keyword</Button></form>
      </Panel>
      <form className="my-5 flex flex-wrap gap-3" role="search"><input name="q" defaultValue={sp.q} placeholder="Search keywords or pages" aria-label="Search keywords" className={`${f} max-w-xs`} />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Status" className={`${f} max-w-40`}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select><Button type="submit" variant="secondary">Filter</Button></form>
      {brief && open && (
        <Panel title={`Brief: ${open.keyword}`} className="mb-5">
          <div className="space-y-3 px-5 py-4 text-sm">
            <p><strong>Suggested H1:</strong> {brief.h1} · <strong>Title idea:</strong> {brief.titleIdea}</p>
            <div><strong>Outline</strong><ol className="mt-1 list-decimal pl-5">{brief.outline.map((o) => <li key={o}>{o}</li>)}</ol></div>
            <div><strong>Questions to answer</strong><ul className="mt-1 list-disc pl-5">{brief.questions.map((o) => <li key={o}>{o}</li>)}</ul></div>
            <div><strong>Link to (real pages)</strong><ul className="mt-1 list-disc pl-5">{brief.links.map((o) => <li key={o.url}><span className="font-mono text-xs">{o.url}</span> {o.title}</li>)}</ul></div>
            <div><strong>Rules</strong><ul className="mt-1 list-disc pl-5">{brief.rules.map((o) => <li key={o}>{o}</li>)}</ul></div>
            <p>{open.targetType === "guide" ? <Link className="underline" href="/admin/guides">Write it in Guides</Link> : open.targetType === "article" ? <Link className="underline" href="/admin/blog">Write it in the Blog</Link> : open.targetPath.startsWith("/lists/") ? <Link className="underline" href={`/admin/geography/pages/edit?path=${encodeURIComponent(open.targetPath)}`}>Edit that page&apos;s SEO and intro</Link> : null}</p>
          </div>
        </Panel>
      )}
      <Panel title={`Keywords (${rows.length})`}>
        {rows.length === 0 ? <Empty title="No keywords yet" text="Add the phrases you want pages or articles to rank for." /> : (
          <ul className="divide-y divide-sand-200">
            {rows.map((r) => (
              <li key={r.id} className="px-5 py-3">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 text-sm">
                    <span className="font-semibold text-forest-900">{r.keyword}</span>
                    <Badge tone={tone[r.status]}>{r.status}</Badge><Badge tone="mute">{r.intent}</Badge>
                    {r.targetPath ? <span className="font-mono text-xs">{r.targetPath}</span> : <span className="text-xs">No target yet (suggested: {suggestTarget(classifyIntent(r.keyword))})</span>}
                    {r.targetPath && dupes.has(r.targetPath) && <Badge tone="warn">Shares a page with another keyword</Badge>}
                  </summary>
                  <div className="mt-4 space-y-3">
                    <form action={saveKeywordAction} className="space-y-4"><Fields r={r} cats={cats} countries={countries} /><Button type="submit" size="sm">Save changes</Button></form>
                    <div className="flex gap-4 text-sm"><Link className="font-semibold underline" href={`?brief=${r.id}`}>Show brief</Link>
                      <form action={deleteKeywordAction}><input type="hidden" name="id" value={r.id} /><button type="submit" className="font-semibold text-red-800 underline">Delete</button></form></div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
