import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sql } from "drizzle-orm";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { TestEmailButton } from "@/components/admin/test-email-button";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv, schema } from "@/lib/db";
import { settingsIn } from "@/lib/settings/registry";
import { loadCategory } from "@/lib/settings/service";

export const dynamic = "force-dynamic";
const ALWAYS_ON = ["Payment confirmed, partial, late or unmatched", "A buyer says they paid", "Delivery failed, or a paid order has no delivery link", "Order marked paid or refunded by hand", "Wallet added, enabled or disabled; delivery link changed", "New opt-out request", "New custom list request (the request is also saved in the admin)"];
const mask = (e?: string) => (e ? e.replace(/^(.).*(@.*)$/, "$1•••$2") : "");

export default async function EmailSettings() {
  await guardAdmin();
  const env = getCloudflareContext().env;
  const cur = await loadCategory(env, "email");
  const fields = settingsIn("email").map(({ key, label, description, type, max, usedBy }) => ({ key, label, description, type, max, usedBy }));
  let stats: { status: string; n: number }[] = [];
  try { stats = await getDbFromEnv(env).select({ status: schema.sampleRequests.emailStatus, n: sql<number>`count(*)` }).from(schema.sampleRequests).groupBy(schema.sampleRequests.emailStatus); } catch { /* table missing: no stats */ }
  const from = env.EMAIL_FROM ?? "BeigeLeads <noreply@mail.beigeleads.com> (built-in default)";
  const rows: [string, boolean, string][] = [
    ["Email service key (Resend)", !!env.RESEND_API_KEY, "Set as a secret in Cloudflare. Never shown."],
    ["Owner alert address", !!env.NOTIFY_EMAIL, env.NOTIFY_EMAIL ? `NOTIFY_EMAIL = ${mask(env.NOTIFY_EMAIL)}` : "NOTIFY_EMAIL is not set: owner alerts are skipped."],
  ];
  return (
    <>
      <PageHeader title="Email & Notifications" text="Transactional email only (delivery, confirmations, alerts). The site never sends marketing email." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      {!cur.ready && <p role="alert" className="mb-4 rounded-xl bg-amber-100 p-4 text-sm text-amber-900">The settings tables are not set up yet. Run drizzle/0016_system_settings.sql in D1, then reload.</p>}
      <Panel title="Sender and request alerts"><SettingsForm category="email" fields={fields} initial={cur.values} stamp={cur.stamp} /></Panel>
      <Panel title="Test email" className="mt-6"><TestEmailButton /></Panel>
      <Panel title="Alerts that are always on" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">{ALWAYS_ON.map((a) => <li key={a}>{a}</li>)}</ul>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">These involve money, access or legal handling, so they cannot be switched off here and they go to the owner alert address only.</p>
      </Panel>
      <Panel title="Email service status" className="mt-6">
        <ul className="divide-y divide-sand-200 text-sm">
          {rows.map(([l, ok, t]) => <li key={l} className="flex items-center justify-between gap-4 px-5 py-3"><div><p className="font-semibold text-forest-900">{l}</p><p className="text-xs">{t}</p></div><Badge tone={ok ? "good" : "warn"}>{ok ? "Configured" : "Missing"}</Badge></li>)}
          <li className="px-5 py-3"><p className="font-semibold text-forest-900">Sending address</p><p className="font-mono text-xs">{from}</p><p className="text-xs">Set by the EMAIL_FROM variable on a domain verified in Resend. Only the display name is editable here.</p></li>
        </ul>
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Sample-request confirmation emails so far: {stats.length ? stats.map((s) => `${s.n} ${s.status}`).join(", ") : "none recorded"}. This is the only email outcome the site records; other emails have no delivery log, and a successful send is shown only after Resend accepted it.</p>
      </Panel>
    </>
  );
}
