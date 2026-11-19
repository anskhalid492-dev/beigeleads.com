import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listExclusions } from "@/lib/seo/sitemap";
import sitemap from "@/app/sitemap";
import { SitemapManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function SitemapAdmin() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let excluded: string[];
  try { excluded = (await listExclusions(env)).map((r) => r.path); } catch {
    return (<><PageHeader title="Sitemap" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The sitemap exclusion table is not set up yet. Run drizzle/0015_seo_redirects_sitemap.sql in D1, then reload.</p></>);
  }
  const entries = (await sitemap()).map((e) => e.url.replace("https://beigeleads.com", "") || "/");
  const section = (p: string) => (p === "/" ? "Home" : "/" + p.split("/")[1]);
  const groups = new Map<string, number>();
  for (const p of entries) groups.set(section(p), (groups.get(section(p)) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Sitemap" text="The live sitemap at /sitemap.xml. It lists only pages that exist and are meant to be indexed." />
      <Panel title={`Pages in the sitemap (${entries.length})`}>
        <ul className="grid gap-x-8 divide-y divide-sand-200 px-5 text-sm sm:grid-cols-2 sm:divide-y-0">
          {[...groups].map(([k, n]) => <li key={k} className="flex justify-between py-2"><span className="font-semibold text-forest-900">{k}</span><span>{n}</span></li>)}
        </ul>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Blog articles set to noindex are left out automatically. The whole site is still noindex until launch.</p>
      </Panel>
      <SitemapManager excluded={excluded} />
    </>
  );
}
