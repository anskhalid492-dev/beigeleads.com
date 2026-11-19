import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc } from "drizzle-orm";
import { Badge, Empty, PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv, schema } from "@/lib/db";
import { SESSION_SECONDS } from "@/lib/admin/session";

export const dynamic = "force-dynamic";
const count = (v?: string) => (v ? v.split(",").map((x) => x.trim()).filter(Boolean).length : 0);

export default async function SecurityPage() {
  const me = await guardAdmin();
  const env = getCloudflareContext().env;
  const db = getDbFromEnv(env);
  const [s, w, o] = await Promise.all([
    db.select().from(schema.settingsAuditLog).orderBy(desc(schema.settingsAuditLog.id)).limit(8).catch(() => []),
    db.select({ actor: schema.walletAuditLog.actor, action: schema.walletAuditLog.action, at: schema.walletAuditLog.createdAt }).from(schema.walletAuditLog).orderBy(desc(schema.walletAuditLog.id)).limit(8).catch(() => []),
    db.select({ actor: schema.orderAuditLog.actor, action: schema.orderAuditLog.action, at: schema.orderAuditLog.createdAt }).from(schema.orderAuditLog).orderBy(desc(schema.orderAuditLog.id)).limit(8).catch(() => []),
  ]);
  const events = [
    ...s.map((x) => ({ at: x.createdAt, actor: x.actor, text: `Settings: ${x.category}.${x.settingKey} (${x.result})` })),
    ...w.map((x) => ({ at: x.at, actor: x.actor, text: `Wallet: ${x.action}` })),
    ...o.map((x) => ({ at: x.at, actor: x.actor, text: `Order: ${x.action}` })),
  ].sort((a, b) => +b.at - +a.at).slice(0, 15);
  const rows: [string, boolean, string][] = [
    ["Layer 1: Cloudflare Access", !!env.ACCESS_TEAM_DOMAIN && !!env.ACCESS_AUD, "Every admin request carries a signed Access token that the Worker verifies. You are here, so it passed."],
    ["Layer 2: password and 6-digit code", !!env.ADMIN_PASSWORD_HASH && !!env.ADMIN_TOTP_SECRET && !!env.ADMIN_SESSION_SECRET, `Required for full admin. Sessions last ${SESSION_SECONDS / 60} minutes.`],
    ["Extra admin allow-list", !!env.ADMIN_EMAILS, env.ADMIN_EMAILS ? `${count(env.ADMIN_EMAILS)} address(es) allowed.` : "Not set: any identity Access lets through and that completes layer 2 is an admin."],
  ];
  return (
    <>
      <PageHeader title="Security & Access" text="How the admin is protected today. This page only reports; sign-in is changed in Cloudflare Access and the admin setup script." actions={<Link href="/admin/settings" className="text-sm underline">All settings</Link>} />
      <Panel title="You"><p className="px-5 py-4 text-sm">Signed in as <b>{me.email}</b> with full admin rights. Blog editors configured: {count(env.BLOG_EDITOR_EMAILS)} (they can only reach Blog and Media).</p></Panel>
      <Panel title="Protection layers" className="mt-6">
        <ul className="divide-y divide-sand-200 text-sm">{rows.map(([l, ok, t]) => <li key={l} className="flex items-center justify-between gap-4 px-5 py-3"><div><p className="font-semibold text-forest-900">{l}</p><p className="text-xs">{t}</p></div><Badge tone={ok ? "good" : "warn"}>{ok ? "Active" : "Not set"}</Badge></li>)}</ul>
      </Panel>
      <Panel title="Sensitive actions" className="mt-6">
        <ul className="list-disc space-y-1 px-9 py-4 text-sm">
          <li>Wallet changes: 24-hour activation delay, owner email alert, audit entry, fresh login.</li>
          <li>Manual order decisions need a ticked confirmation and are logged.</li>
          <li>Settings saves, test emails and checks are admin-only, rate limited and logged where they change something.</li>
        </ul>
      </Panel>
      <Panel title="Recent configuration changes" className="mt-6">
        {events.length === 0 ? <Empty title="No changes recorded" /> : <ul className="divide-y divide-sand-200 text-sm">{events.map((e, i) => <li key={i} className="flex flex-wrap justify-between gap-2 px-5 py-2"><span>{e.text}</span><span className="text-xs">{e.actor} · {fmtDate(e.at)}</span></li>)}</ul>}
        <p className="border-t border-sand-200 px-5 py-3 text-xs">Failed sign-in attempts are not recorded by the site (only rate-limited). Access sign-in logs are in Cloudflare Zero Trust. <Link href="/admin/settings/audit" className="underline">Full settings history</Link></p>
      </Panel>
    </>
  );
}
