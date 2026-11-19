import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { guardAdmin } from "@/lib/admin/guard";
import { settingsIn } from "@/lib/settings/registry";
import { loadCategory } from "@/lib/settings/service";

export const dynamic = "force-dynamic";

export default async function NavigationSettings() {
  await guardAdmin();
  const cur = await loadCategory(getCloudflareContext().env, "navigation");
  const fields = settingsIn("navigation").map(({ key, label, description, type, max, usedBy }) => ({ key, label, description, type, max, usedBy }));
  return (
    <>
      <PageHeader title="Website & Navigation" text="Changes appear on the public site within about a minute." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      {!cur.ready && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The settings tables are not set up yet. Run drizzle/0016_system_settings.sql in D1, one statement at a time, then reload.</p>}
      <Panel title="Featured industries and countries"><SettingsForm category="navigation" fields={fields} initial={cur.values} stamp={cur.stamp} /></Panel>
    </>
  );
}
