import { PageHeader, Panel, Badge } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

export default async function SearchConsole() {
  await guardAdmin();
  return (
    <>
      <PageHeader title="Search Console" text="Clicks, impressions and rankings come from Google, not from this site." />
      <Panel title="Connection">
        <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm">
          <p>No Google account is connected, so no search data is shown here. Nothing on this page is estimated.</p>
          <Badge tone="mute">Not connected</Badge>
        </div>
      </Panel>
      <Panel title="Set it up when the site opens to search engines" className="mt-6">
        <ol className="list-decimal space-y-2 px-9 py-4 text-sm">
          <li>Launch first: the whole site is hidden from search engines until you remove the noindex setting and the robots.txt block, so Google has nothing to report before then.</li>
          <li>In Google Search Console, add <b>beigeleads.com</b> as a Domain property and verify it with the DNS record Google gives you (add it in Cloudflare DNS).</li>
          <li>Submit <span className="font-mono">https://beigeleads.com/sitemap.xml</span> in the Sitemaps section.</li>
          <li>Read the data in Search Console itself. Connecting it to this admin would need a Google sign-in (OAuth) and is not built; it needs your approval first.</li>
        </ol>
      </Panel>
    </>
  );
}
