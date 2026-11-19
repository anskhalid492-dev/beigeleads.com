import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { guardAdmin } from "@/lib/admin/guard";
import { settingsIn } from "@/lib/settings/registry";
import { loadCategory } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export default async function GeneralSettings() {
  await guardAdmin();
  const cur = await loadCategory(getCloudflareContext().env, "general");
  const fields = settingsIn("general").map(({ key, label, description, type, max, usedBy }) => ({ key, label, description, type, max, usedBy }));
  return (
    <>
      <PageHeader title="General Settings" text="Changes appear on the public site within about a minute." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      {!cur.ready && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The settings tables are not set up yet. Run drizzle/0016_system_settings.sql in D1, one statement at a time, then reload.</p>}
      <Panel title="Website and announcement banner"><SettingsForm category="general" fields={fields} initial={cur.values} stamp={cur.stamp} /></Panel>
      <Panel title="Controlled outside this screen" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">
          <li>Public website address: set in code (<span className="font-mono">lib/site.ts</span>) and DNS.</li>
          <li>Owner alert address: the <span className="font-mono">NOTIFY_EMAIL</span> variable in Cloudflare. It is not editable here so a changed settings login cannot redirect payment alerts.</li>
          <li>Prices, payment amounts and policies are never changed by these settings.</li>
        </ul>
      </Panel>
    </>
  );
}
