import Link from "next/link";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
import { guardAdmin } from "@/lib/admin/guard";

export default async function Backup() {
  await guardAdmin();
  const rows: [string, "good" | "warn" | "mute", string, string][] = [
    ["Database (D1) point-in-time restore", "mute", "Provided by Cloudflare", "D1 has a built-in Time Travel feature that can restore the database to an earlier moment. How far back depends on your Cloudflare plan; check the current limit in the documentation. The site does not control or verify it."],
    ["Automatic database export to R2", "warn", "Not configured", "No scheduled export job exists in this project, so none is running. CLAUDE.md lists it as planned."],
    ["Files in R2 (blog bodies, images)", "warn", "No backup", "Nothing copies these files elsewhere. Deleting a file in R2 cannot be undone from this site."],
    ["Last verified backup", "warn", "None recorded", "The site has never recorded a backup or a restore test, so no date is shown."],
  ];
  return (
    <>
      <PageHeader title="Backup & Data Management" text="What protects your data today, stated as it really is." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      <Panel title="Status">
        <ul className="divide-y divide-sand-200 text-sm">{rows.map(([l, tone, b, t]) => <li key={l} className="px-5 py-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-forest-900">{l}</p><Badge tone={tone}>{b}</Badge></div><p className="mt-1 text-xs">{t}</p></li>)}</ul>
      </Panel>
      <Panel title="Restore guidance" className="mt-6">
        <ol className="list-decimal space-y-2 px-9 py-4 text-sm">
          <li>Stop and note the time just before the problem began.</li>
          <li>In Cloudflare, open the D1 database and follow the Time Travel restore steps in the documentation. A restore replaces current data, so confirm the time first.</li>
          <li>After a restore, check Orders and Wallets here, then the migrations on the Maintenance page.</li>
        </ol>
        <p className="border-t border-sand-200 px-5 py-3 text-xs"><a className="underline" href="https://developers.cloudflare.com/d1/reference/time-travel/" target="_blank" rel="noopener noreferrer">D1 Time Travel documentation</a>. This site has no restore button on purpose: a restore is destructive and needs a human following the documented procedure.</p>
      </Panel>
      <Panel title="Exports" className="mt-6">
        <p className="px-5 py-4 text-sm">Customer data is not offered as a bulk download here. Available now: the <Link href="/admin/settings/audit" className="underline">settings audit history (CSV)</Link>.</p>
      </Panel>
    </>
  );
}
