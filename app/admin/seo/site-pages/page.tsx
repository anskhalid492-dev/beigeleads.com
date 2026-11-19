import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listOverrides } from "@/lib/seo/page-overrides";
import { sitePages } from "@/lib/seo/page-registry";

export const dynamic = "force-dynamic";
type SP = Promise<{ q?: string; group?: string; set?: string }>;

export default async function SitePages({ searchParams }: { searchParams: SP }) {
  await guardAdmin();
  const sp = await searchParams;
  let overrides: Awaited<ReturnType<typeof listOverrides>> = []; let ready = true;
  try { overrides = await listOverrides(getCloudflareContext().env); } catch { ready = false; }
  const by = new Map(overrides.map((o) => [o.path, o]));
  const all = sitePages();
  const groups = [...new Set(all.map((p) => p.group))];
  const q = (sp.q ?? "").trim().toLowerCase();
  const shown = all.filter((p) => (!sp.group || p.group === sp.group) && (!q || `${p.path} ${p.label}`.toLowerCase().includes(q)) && (sp.set !== "1" || by.has(p.path)));
  const input = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
  return (
    <>
      <PageHeader title="Website pages SEO" text="Edit the title, meta description and social tags of any page built in code. Saved changes go live on the page within about a minute. Blog articles are edited in their own SEO tab." actions={<Link href="/admin/seo" className="text-sm underline">SEO overview</Link>} />
      {!ready && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The page SEO table is not set up yet. Run drizzle/0017_seo_page_overrides.sql in D1, then reload.</p>}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div><label htmlFor="pq" className="mb-1 block text-xs font-semibold">Search</label><input id="pq" name="q" defaultValue={sp.q ?? ""} placeholder="Page name or address" className={input} /></div>
        <div><label htmlFor="pg" className="mb-1 block text-xs font-semibold">Group</label><select id="pg" name="group" defaultValue={sp.group ?? ""} className={input}><option value="">All</option>{groups.map((g) => <option key={g}>{g}</option>)}</select></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="set" value="1" defaultChecked={sp.set === "1"} /> Edited only</label>
        <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-semibold text-sand-50">Filter</button>
      </form>
      <Panel title={`${shown.length} of ${all.length} pages · ${overrides.length} edited`}>
        {shown.length === 0 ? <Empty title="No page matches" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
            <thead><tr className="border-b border-sand-200 text-xs"><th className="px-4 py-3">Page</th><th className="px-4 py-3">Group</th><th className="px-4 py-3">Admin SEO</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-sand-200">{shown.map((p) => {
              const o = by.get(p.path);
              return (
                <tr key={p.path}>
                  <td className="px-4 py-3"><span className="font-semibold text-forest-900">{p.label}</span><p className="font-mono text-xs">{p.path}</p></td>
                  <td className="px-4 py-3">{p.group}</td>
                  <td className="px-4 py-3">{o ? <span className="flex flex-wrap gap-1">{o.seoTitle && <Badge tone="good">Title</Badge>}{o.metaDescription && <Badge tone="good">Description</Badge>}{(o.ogTitle || o.ogDescription || o.ogImage) && <Badge tone="info">Social</Badge>}{o.canonicalUrl && <Badge tone="info">Canonical</Badge>}</span> : <Badge tone="mute">Code default</Badge>}</td>
                  <td className="px-4 py-3 text-right"><Link href={`/admin/seo/site-pages/edit?path=${encodeURIComponent(p.path)}`} className="font-semibold underline">Edit SEO</Link></td>
                </tr>);
            })}</tbody>
          </table></div>
        )}
      </Panel>
      <p className="mt-4 text-xs">Not listed: country and city pages (not built yet) and blog articles. The whole site stays hidden from search engines until launch; these settings cannot change that.</p>
    </>
  );
}
