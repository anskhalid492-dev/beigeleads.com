import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { BRAND } from "@/lib/system-emails/brand";
import { getBranding } from "@/lib/system-emails/branding";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { listEditable } from "@/lib/system-emails/store";
import { BrandingForm } from "./branding-form";
import { TemplatesTable, type Row } from "./dashboard-tables";
import { TestSend } from "./test-send";

export const dynamic = "force-dynamic";
const TABS = [["templates", "All templates"], ["drafts", "Drafts"], ["published", "Published"], ["activity", "Email activity"], ["triggers", "Automation triggers"], ["branding", "Branding"], ["tests", "Test emails"]] as const;
type LogRow = { id: number; template_key: string; source: string; recipient: string; subject: string; reference: string; status: string; provider_id: string; error: string; created_at: number; delivery_status?: string; delivery_detail?: string; status_at?: number | null };
const PAGE = 30;
const DELIVERY_LABEL: Record<string, string> = { sent: "Accepted", delivery_delayed: "Delayed", delivered: "Delivered", bounced: "Bounced", complained: "Marked as spam", failed: "Failed", opened: "Opened", clicked: "Clicked" };

export default async function SystemEmails({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string; source?: string; page?: string }> }) {
  await guardAdmin();
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "templates";
  const env = getCloudflareContext().env;
  const db = getDbFromEnv(env);
  const map = await listEditable(db);

  let ready = true;
  let stats = { sent: 0, failed: 0, tests: 0 };
  let logs: LogRow[] = [];
  let total = 0;
  const page = Math.max(1, Number(sp.page) || 1);
  try {
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;
    const s = await env.DB.prepare("SELECT SUM(CASE WHEN status='sent' AND source='live' THEN 1 ELSE 0 END) AS sent, SUM(CASE WHEN status='failed' AND source='live' THEN 1 ELSE 0 END) AS failed, SUM(CASE WHEN source='test' THEN 1 ELSE 0 END) AS tests FROM email_delivery_logs WHERE created_at >= ?").bind(since).first<{ sent: number | null; failed: number | null; tests: number | null }>();
    stats = { sent: s?.sent ?? 0, failed: s?.failed ?? 0, tests: s?.tests ?? 0 };
    if (tab === "activity" || tab === "tests") {
      const where = tab === "tests" ? "source='test'" : `source='live'${sp.status === "sent" || sp.status === "failed" ? ` AND status='${sp.status}'` : sp.status === "delivered" ? " AND delivery_status='delivered'" : sp.status === "problem" ? " AND delivery_status IN ('bounced','complained','failed')" : ""}`;
      total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM email_delivery_logs WHERE ${where}`).first<{ n: number }>())?.n ?? 0;
      logs = (await env.DB.prepare(`SELECT * FROM email_delivery_logs WHERE ${where} ORDER BY id DESC LIMIT ${PAGE} OFFSET ${(page - 1) * PAGE}`).all<LogRow>()).results;
    }
    await env.DB.prepare("SELECT name FROM email_templates LIMIT 1").first();
    await env.DB.prepare("SELECT 1 FROM email_branding LIMIT 1").first();
  } catch { ready = false; }

  // Webhook status needs migration 0024; before it everything above still works.
  let hook = { ready: false, delivered: 0, problems: 0, lastEvent: "" };
  try {
    const since2 = Math.floor(Date.now() / 1000) - 30 * 86400;
    const h = await env.DB.prepare("SELECT SUM(CASE WHEN delivery_status='delivered' THEN 1 ELSE 0 END) AS d, SUM(CASE WHEN delivery_status IN ('bounced','complained','failed') THEN 1 ELSE 0 END) AS p FROM email_delivery_logs WHERE source='live' AND created_at >= ?").bind(since2).first<{ d: number | null; p: number | null }>();
    const last = await env.DB.prepare("SELECT MAX(created_at) AS t FROM email_webhook_events").first<{ t: number | null }>();
    hook = { ready: true, delivered: h?.d ?? 0, problems: h?.p ?? 0, lastEvent: last?.t ? new Date(last.t * 1000).toISOString().slice(0, 16).replace("T", " ") : "" };
  } catch { /* 0024 not applied yet */ }
  const secretSet = !!env.RESEND_WEBHOOK_SECRET;

  const all = [...map.values()];
  const rows: Row[] = all.map((e) => ({ key: e.def.key, name: e.def.name, audience: e.def.audience, connection: e.def.connection, subject: (e.draft ?? e.published).subject, state: e.draft ? "draft" : e.custom ? "published" : "built-in", version: e.version, updatedAt: e.updatedAt, event: e.def.event, copy: e.copy }));
  const branding = await getBranding(db);
  const connected = TEMPLATES.filter((t) => t.connection === "connected").length;
  const name = (k: string) => map.get(k)?.def.name ?? k;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (extra: Record<string, string>) => `?${new URLSearchParams({ tab, ...(sp.status ? { status: sp.status } : {}), ...extra })}`;

  return (
    <>
      <PageHeader title="System Emails" text="Every automatic email BeigeLeads sends, in one place: wording, preview, test and delivery results. Customer emails are branded; sending logic is unchanged." />
      {!ready && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">Editing, versions, delivery logs, branding and copies need migrations 0022 and 0023 in D1. Until then every email uses its built-in version and nothing is logged. Sending is not affected.</p>}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Templates" value={TEMPLATES.length} hint={`${TEMPLATES.filter((t) => t.audience === "customer").length} customer, ${TEMPLATES.filter((t) => t.audience === "admin").length} admin alerts`} />
        <StatCard label="Connected to a real event" value={connected} hint="The rest are written but not sent yet." />
        <StatCard label="Sent, last 30 days" value={stats.sent} hint={`${stats.failed} not accepted by the email service`} />
        <StatCard label="Drafts waiting" value={rows.filter((r) => r.state === "draft").length} hint={`${stats.tests} test emails in 30 days`} />
      </div>
      <nav aria-label="System email sections" className="mb-4 flex flex-wrap gap-2">
        {TABS.map(([k, label]) => <Link key={k} href={`?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === k ? "border-forest-900 bg-forest-900 text-white" : "border-sand-300 bg-white text-forest-900 hover:bg-sand-100"}`}>{label}</Link>)}
      </nav>

      {(tab === "templates" || tab === "drafts" || tab === "published") && (
        <Panel><TemplatesTable rows={rows} initialState={tab === "drafts" ? "draft" : tab === "published" ? "published" : undefined} /></Panel>
      )}

      {tab === "activity" && (
        <Panel title="Delivery reports (webhook)">
          <div className="space-y-3 px-5 py-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone={secretSet ? "good" : "warn"}>{secretSet ? "Signing secret set" : "Signing secret missing"}</Badge>
              <Badge tone={hook.ready ? "good" : "warn"}>{hook.ready ? "Database ready" : "Migration 0024 not applied"}</Badge>
              <Badge tone={hook.lastEvent ? "good" : "mute"}>{hook.lastEvent ? `Last report received ${hook.lastEvent} UTC` : "No report received yet"}</Badge>
            </div>
            <p>Last 30 days: <strong>{hook.delivered}</strong> confirmed delivered, <strong>{hook.problems}</strong> bounced, marked as spam or failed. Problems also email the owner once.</p>
            {(!secretSet || !hook.lastEvent) && <p className="rounded-xl bg-amber-100 px-4 py-3 text-amber-900">To turn this on: in Resend open Webhooks, add endpoint <code>https://beigeleads.com/api/webhooks/resend</code>, tick the email.* events (sent, delivered, delivery_delayed, bounced, complained, failed), copy the signing secret and save it in Cloudflare as the secret <code>RESEND_WEBHOOK_SECRET</code>.</p>}
          </div>
        </Panel>
      )}
      {(tab === "activity" || tab === "tests") && (
        <>
          {tab === "tests" && <Panel title="Send a test email" className="mb-5"><TestSend options={all.map((e) => ({ key: e.def.key, name: e.def.name, content: e.published }))} /></Panel>}
          <Panel title={tab === "tests" ? "Recent test emails" : "Delivery log"}>
            {tab === "activity" && <form className="flex gap-2 border-b border-sand-200 p-4 text-sm"><input type="hidden" name="tab" value="activity" /><select name="status" defaultValue={sp.status ?? ""} aria-label="Result" className="rounded-xl border border-sand-300 bg-white px-3 py-2"><option value="">All results</option><option value="sent">Accepted by the email service</option><option value="failed">Not accepted</option><option value="delivered">Delivered (confirmed)</option><option value="problem">Bounced, complained or failed</option></select><button className="rounded-full border border-sand-300 bg-white px-4 font-semibold">Filter</button></form>}
            {logs.length === 0 ? <Empty title={ready ? "Nothing logged yet" : "Delivery logs are not available yet"} text={ready ? "Emails sent through a template appear here with the real answer from the email service. Nothing on this page is simulated." : "Run migration 0022 in D1 first."} /> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-forest-700"><tr><th className="px-5 py-2">Time (UTC)</th><th>Template</th><th>To</th><th>Subject</th><th>Result</th></tr></thead><tbody className="divide-y divide-sand-200">
                {logs.map((l) => <tr key={l.id} className="align-top"><td className="whitespace-nowrap px-5 py-3">{new Date(l.created_at * 1000).toISOString().slice(0, 16).replace("T", " ")}</td><td>{name(l.template_key)}{l.reference && <span className="block text-xs">{l.reference}</span>}</td><td className="whitespace-nowrap">{l.recipient}</td><td className="max-w-xs truncate">{l.subject}</td><td><Badge tone={l.status !== "sent" || ["bounced", "complained", "failed"].includes(l.delivery_status ?? "") ? "bad" : l.delivery_status === "delivered" ? "good" : "info"}>{l.status !== "sent" ? "Not accepted" : l.delivery_status ? DELIVERY_LABEL[l.delivery_status] ?? l.delivery_status : "Accepted"}</Badge>{l.delivery_detail && <span className="mt-1 block max-w-xs text-xs">{l.delivery_detail}</span>}{l.error && <span className="mt-1 block max-w-xs text-xs">{l.error}</span>}{l.provider_id && <span className="block text-xs">ID {l.provider_id}</span>}</td></tr>)}
              </tbody></table></div>
            )}
            {pages > 1 && <div className="flex items-center justify-between border-t border-sand-200 px-5 py-3 text-sm"><span>Page {page} of {pages}</span><span className="flex gap-3">{page > 1 && <Link className="underline" href={href({ page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className="underline" href={href({ page: String(page + 1) })}>Next</Link>}</span></div>}
            <p className="border-t border-sand-200 px-5 py-3 text-xs">&quot;Accepted&quot; means the email service took the message. Delivered, Bounced, Delayed and Marked as spam appear only after the email service reports them through the webhook (see the box above). Opens are not tracked.</p>
          </Panel>
        </>
      )}

      {tab === "triggers" && (
        <Panel title="Which emails a real event sends today">
          <ul className="divide-y divide-sand-200">
            {TEMPLATES.map((t) => (
              <li key={t.key} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="max-w-xl"><p className="font-bold text-forest-900">{t.name}</p><p className="text-sm">{t.event}</p>{t.connection === "not_connected" && <p className="mt-1 text-xs">{t.connectionNote}</p>}</div>
                <div className="flex gap-2"><Badge tone={t.audience === "customer" ? "info" : "mute"}>{t.audience === "customer" ? "Customer" : "Admin alert"}</Badge><Badge tone={t.connection === "connected" ? "good" : "warn"}>{t.connection === "connected" ? "Connected" : "Not connected"}</Badge></div>
              </li>
            ))}
          </ul>
          <p className="border-t border-sand-200 px-5 py-3 text-xs">Connected emails are sent once per event: duplicates are blocked by the same checks as before (one delivery row per order, one saved row per identical form submission). If a template cannot be rendered, the previous plain-text email is sent instead. Payment and delivery-failure alerts to the owner are unchanged and cannot be switched off here.</p>
        </Panel>
      )}

      {tab === "branding" && (
        <Panel title="Shared email branding">
          <BrandingForm initial={branding} colors={[["Page background", BRAND.sand50], ["Cards", BRAND.sand100], ["Borders", BRAND.sand200], ["Notes", BRAND.forest100], ["Secondary text", BRAND.forest500], ["Body text", BRAND.forest700], ["Headings, dark mode", BRAND.forest900], ["Button", BRAND.purple600]]} ready={ready} />
        </Panel>
      )}
    </>
  );
}
