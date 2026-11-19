import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { seoOverview } from "@/lib/seo/overview";

export const dynamic = "force-dynamic";

export default async function SeoDashboard() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let o;
  try { o = await seoOverview(env); } catch {
    return (<><PageHeader title="SEO" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The blog tables are not available yet.</p></>);
  }
  const items: [string, number, string][] = [
    ["Missing meta description", o.noMeta, "missing=meta"],
    ["Missing SEO title", o.noTitle, "missing=title"],
    ["Missing focus keyword", o.noFocus, "missing=focus"],
    ["No featured image", o.noImage, "missing=image"],
    ["Featured image without alt text", o.noAlt, "missing=alt"],
    ["SEO title outside 30–60 characters", o.badTitleLen, "missing=titlelen"],
    ["Meta description outside 70–160 characters", o.badMetaLen, "missing=metalen"],
  ];
  return (
    <>
      <PageHeader title="SEO" text="Counts from your published blog articles. These are checks on the content you wrote, not search-engine data." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Published articles" value={o.published} hint={`${o.total} articles in total`} />
        <StatCard label="Set to noindex" value={o.noindex} hint="Published but hidden from search" />
        <StatCard label="Articles with a gap" value={Math.max(o.noMeta, o.noTitle, o.noAlt, o.noImage, o.noFocus)} hint="Largest single gap below" />
      </div>
      <Panel title="Fix list" className="mt-6">
        <ul className="divide-y divide-sand-200 text-sm">
          {items.map(([l, n, q]) => (
            <li key={q} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="font-semibold text-forest-900">{l}</span>
              {n > 0 ? <Link href={`/admin/seo/pages?${q}`} className="font-bold underline">{n} article{n === 1 ? "" : "s"}</Link> : <span>None</span>}
            </li>
          ))}
        </ul>
      </Panel>
      <p className="mt-6 text-sm">Next: <Link href="/admin/seo/pages" className="underline">all article SEO</Link> · <Link href="/admin/seo/settings" className="underline">global defaults</Link> · <Link href="/admin/seo/redirects" className="underline">redirects</Link> · <Link href="/admin/seo/sitemap" className="underline">sitemap</Link> · <Link href="/admin/seo/structured-data" className="underline">structured data</Link>. The site audit and Search Console setup are not built yet.</p>
    </>
  );
}
