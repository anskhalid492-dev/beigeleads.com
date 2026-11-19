import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { SEO_DEFAULTS, getStoredSeoSettings } from "@/lib/seo/settings";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SeoSettings() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  let stored;
  try { stored = await getStoredSeoSettings(env); } catch {
    return (<><PageHeader title="SEO settings" /><p role="alert" className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The SEO settings table is not set up yet. Run drizzle/0014_seo_settings.sql in D1, then reload this page.</p></>);
  }
  return (
    <>
      <PageHeader title="SEO settings" text="Global defaults for the blog. An article's own SEO fields always win over these." />
      <Panel title="Blog defaults"><SettingsForm initial={stored} defaults={SEO_DEFAULTS} /></Panel>
      <Panel title="What these settings do not change" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">
          <li>The whole site stays hidden from search engines until launch. No setting here can change that.</li>
          <li>They apply to the blog pages, which are rendered on demand. Pages like Home or Pricing are built in code, and giving them editable SEO would make them read the database on every visit.</li>
        </ul>
      </Panel>
    </>
  );
}
