import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { seoPostRows, type SeoPostRow } from "@/lib/seo/overview";

export const dynamic = "force-dynamic";
const FILTERS: Record<string, [string, (r: SeoPostRow) => boolean]> = {
  meta: ["Missing meta description", (r) => !r.metaDescription.trim()],
  title: ["Missing SEO title", (r) => !r.seoTitle.trim()],
  focus: ["Missing focus keyword", (r) => !r.focusKeyword.trim()],
  image: ["No featured image", (r) => !r.featuredImage],
  alt: ["Featured image without alt text", (r) => !!r.featuredImage && !r.featuredAlt.trim()],
  titlelen: ["SEO title outside 30–60 characters", (r) => !!r.seoTitle.trim() && (r.seoTitle.trim().length < 30 || r.seoTitle.trim().length > 60)],
  metalen: ["Meta description outside 70–160 characters", (r) => !!r.metaDescription.trim() && (r.metaDescription.trim().length < 70 || r.metaDescription.trim().length > 160)],
};
const ok = (b: boolean) => <Badge tone={b ? "good" : "warn"}>{b ? "Set" : "Missing"}</Badge>;

export default async function SeoPages({ searchParams }: { searchParams: Promise<{ missing?: string }> }) {
  await guardAdmin();
  const { missing } = await searchParams;
  let rows: SeoPostRow[];
  try { rows = await seoPostRows(getCloudflareContext().env); } catch { return <PageHeader title="Article SEO" text="The blog tables are not available yet." />; }
  const f = missing ? FILTERS[missing] : undefined;
  const shown = f ? rows.filter((r) => r.status === "published" && f[1](r)) : rows;
  return (
    <>
      <PageHeader title="Article SEO" text="SEO fields of every blog article. Open an article's SEO tab to change them." />
      {f && <p className="mb-4 text-sm"><b>{f[0]}</b> · {shown.length} published · <Link href="/admin/seo/pages" className="underline">Show all</Link></p>}
      <Panel>
        {shown.length === 0 ? <Empty title="Nothing to show" text="No article matches." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b border-sand-200 text-xs"><th className="px-4 py-3">Article</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">SEO title</th><th className="px-4 py-3">Meta</th><th className="px-4 py-3">Focus</th><th className="px-4 py-3">Image alt</th><th className="px-4 py-3">Index</th></tr></thead>
              <tbody className="divide-y divide-sand-200">
                {shown.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3"><Link href={`/admin/blog/${r.id}/edit`} className="font-semibold text-forest-900 underline">{r.title}</Link><p className="text-xs">/blog/{r.slug}</p></td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">{ok(!!r.seoTitle.trim())}</td>
                    <td className="px-4 py-3">{ok(!!r.metaDescription.trim())}</td>
                    <td className="px-4 py-3">{ok(!!r.focusKeyword.trim())}</td>
                    <td className="px-4 py-3">{r.featuredImage ? ok(!!r.featuredAlt.trim()) : "No image"}</td>
                    <td className="px-4 py-3">{r.noindex ? <Badge tone="warn">noindex</Badge> : "Yes"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
