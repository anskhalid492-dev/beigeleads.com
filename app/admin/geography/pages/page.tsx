import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { allGeoContentPaths } from "@/lib/geo/page-content";
import { geoPageList } from "@/lib/geo/store";

export const dynamic = "force-dynamic";

export default async function GeoPages({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await guardAdmin();
  const q = ((await searchParams).q ?? "").toLowerCase().slice(0, 80);
  const db = getDbFromEnv(getCloudflareContext().env);
  const [list, edited] = await Promise.all([geoPageList(db), allGeoContentPaths(db)]);
  const rows = list.filter((p) => !q || p.label.toLowerCase().includes(q) || p.path.includes(q));
  return (
    <>
      <PageHeader title="Geography pages: SEO and intro" text="Write your own title, meta description and intro for a country, state or city page. Empty fields keep the generated text." actions={<Link href="/admin/geography" className="text-sm underline">Geography</Link>} />
      <form className="mb-4" role="search"><input name="q" defaultValue={q} placeholder="Search pages" aria-label="Search pages" className="w-full max-w-xs rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm" /></form>
      <Panel>
        {rows.length === 0 ? <Empty title="No pages found" text="Pages appear for every industry's country page and for each place with recorded inventory." /> : (
          <ul className="divide-y divide-sand-200 text-sm">
            {rows.map((p) => (
              <li key={p.path} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div><p className="font-semibold text-forest-900">{p.label}</p><p className="font-mono text-xs">{p.path}</p></div>
                <div className="flex items-center gap-3">{edited.has(p.path) ? <Badge tone="good">Edited</Badge> : <Badge tone="mute">Generated</Badge>}<Link className="font-semibold underline" href={`/admin/geography/pages/edit?path=${encodeURIComponent(p.path)}`}>Edit</Link></div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
