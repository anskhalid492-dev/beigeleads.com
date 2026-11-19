import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { listRedirects } from "@/lib/seo/redirects";
import { RedirectManager } from "./manager";

export const dynamic = "force-dynamic";

export default async function Redirects() {
  await guardAdmin();
  let rows;
  try { rows = await listRedirects(getCloudflareContext().env); } catch {
    return (<><PageHeader title="Redirects" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The redirects table is not set up yet. Run the statements in drizzle/0015_seo_redirects_sitemap.sql in D1, one at a time, then reload.</p></>);
  }
  return (
    <>
      <PageHeader title="Redirects" text="Send an old address to a new one. Use 301 for a permanent move. Changes take effect within about a minute." />
      <RedirectManager rows={rows.map((r) => ({ id: r.id, from: r.fromPath, to: r.toPath, status: r.status, enabled: r.enabled, note: r.note }))} />
    </>
  );
}
