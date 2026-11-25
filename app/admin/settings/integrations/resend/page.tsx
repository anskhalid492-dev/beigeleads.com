import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { credentialStatus, resolveResend, type Status } from "@/lib/email/credentials";
import { checkKey, type KeyCheck } from "@/lib/email/resend-api";
import { EMPTY_SENDERS, SENDER_CATEGORIES, envFromAddress, loadSenders } from "@/lib/email/senders";
import { ACTIVITY_PAGE, ACTIVITY_STATUSES, activity, isFresh, eventRegistry, retryHistory, retryState, usage, type LogRow } from "@/lib/email/admin";
import { SITE } from "@/lib/system-emails/brand";
import { TEMPLATES } from "@/lib/system-emails/defaults";
import { LOG_RETENTION_DAYS, WEBHOOK_EVENT_DAYS } from "@/lib/system-emails/webhook";
import { CopyButton, DomainCard, EventToggle, RetryButton, SecretForm, SendersForm, TestConnection, TestEmail } from "./controls";

export const dynamic = "force-dynamic";
const TABS = [["overview", "Overview"], ["config", "Configuration"], ["events", "Email Events"], ["activity", "Email Activity"], ["webhooks", "Webhooks"]] as const;
const when = (t: number | null | undefined) => (t ? new Date(t * (t < 1e12 ? 1000 : 1)).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—");
const STATE_LABEL: Record<string, [string, "good" | "warn" | "bad" | "mute"]> = {
  valid_full: ["Connected", "good"], valid_sending_only: ["Connected (sending only)", "good"], invalid: ["Invalid API key", "bad"], insufficient_permissions: ["Insufficient permissions", "warn"],
  rate_limited: ["Connection failed (rate limited)", "warn"], provider_error: ["Connection failed (Resend problem)", "bad"], network_error: ["Connection failed", "bad"], not_configured: ["Not configured", "mute"],
};
const SRC = { admin: "Saved in this admin (encrypted)", env: "RESEND_API_KEY variable in Cloudflare", none: "None" } as const;
const DS: Record<string, [string, "good" | "warn" | "bad" | "mute"]> = { "": ["Accepted", "mute"], sent: ["Sent", "mute"], delivered: ["Delivered", "good"], delivery_delayed: ["Delayed", "warn"], bounced: ["Bounced", "bad"], complained: ["Marked as spam", "bad"], failed: ["Failed", "bad"] };
const statusOf = (l: LogRow): [string, "good" | "warn" | "bad" | "mute"] => (l.status === "failed" ? ["Failed to send", "bad"] : DS[l.delivery_status ?? ""] ?? ["Accepted", "mute"]);

function connectionBadge(st: Status): [string, "good" | "warn" | "bad" | "mute"] {
  if (st.source === "none") return STATE_LABEL.not_configured!;
  if (!st.lastCheck) return ["Configured, not tested yet", "warn"];
  return STATE_LABEL[st.lastCheck.state] ?? ["Unknown", "mute"];
}

export default async function ResendPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await guardAdmin();
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "overview";
  const env = getCloudflareContext().env;
  const st = await credentialStatus(env);
  const [label, tone] = connectionBadge(st);

  let body: React.ReactNode = null;

  if (tab === "overview") {
    const u = await usage(env);
    const acts = await activity(env, { page: 1 });
    body = (
      <div className="space-y-6">
        <Panel title="Integration status"><div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><p className="text-xs">Connection</p><p className="mt-1"><Badge tone={tone}>{label}</Badge></p><p className="mt-1 text-xs">{st.lastCheck ? `Last checked ${when(st.lastCheck.at)}: ${st.lastCheck.detail}` : "No connection check has been run yet."}</p></div>
          <div><p className="text-xs">API key source</p><p className="mt-1 text-sm font-semibold">{SRC[st.source]}</p>{st.adminBroken && <p className="text-xs text-red-700">The saved key could not be decrypted (EMAIL_KEY_SECRET changed?). The variable is used instead.</p>}</div>
          <div><p className="text-xs">Sending address</p><p className="mt-1 font-mono text-sm">{(await loadSenders(env)).defaultEmail || envFromAddress(env)}</p><p className="mt-1 text-xs">Domain verification is shown on the Configuration tab.</p></div>
          <div><p className="text-xs">Webhook</p><p className="mt-1 text-sm font-semibold">{st.webhookSource === "none" ? "Not configured" : "Signing secret set"}</p><p className="mt-1 text-xs">See the Webhooks tab for the last verified event.</p></div>
        </div><div className="border-t border-sand-200 p-5"><TestConnection /></div></Panel>
        <div><h2 className="mb-3 text-lg font-bold text-forest-900">Email usage (this site only)</h2>
          {!u.ready ? <Empty title="No email log yet" text="Run migrations 0022 and 0024 in D1 to track activity." /> : (
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Accepted today" value={u.acceptedToday} /><StatCard label="Delivered today" value={u.deliveredToday} hint="Needs the webhook" /><StatCard label="Accepted this month" value={u.sentMonth} />
              <StatCard label="Failed (30 days)" value={u.failed30} /><StatCard label="Bounced (30 days)" value={u.bounced30} />
              <StatCard label="Delivery rate (30 days)" value={u.rate === null ? "No data" : `${u.rate}%`} hint="Delivered ÷ (delivered + bounced + spam reports)" />
            </div>)}
          <p className="mt-3 text-xs">These numbers come from emails this website sent and the events Resend reported back. Account-wide totals and your plan&apos;s quota are not available through the API: see <a className="underline" href="https://resend.com/overview" target="_blank" rel="noopener noreferrer">your Resend dashboard</a>.</p>
        </div>
        <Panel title="Recent emails">{acts.rows.length === 0 ? <Empty title="No emails yet" /> : <ul className="divide-y divide-sand-200 text-sm">{acts.rows.slice(0, 8).map((l) => { const [t, tn] = statusOf(l); return <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2"><span>{when(l.created_at)} · {l.subject.slice(0, 60)}</span><Badge tone={tn}>{t}</Badge></li>; })}</ul>}</Panel>
      </div>
    );
  }

  if (tab === "config") {
    const cred = await resolveResend(env);
    const chk: KeyCheck | null = cred.key ? await checkKey(cred.key) : null;
    const senders = (await loadSenders(env)) ?? EMPTY_SENDERS;
    body = (
      <div className="space-y-6">
        <Panel title="API key"><div className="space-y-4 p-5">
          <p className="text-sm">Active source: <b>{SRC[st.source]}</b>. Priority: a valid saved key, then the <span className="font-mono">RESEND_API_KEY</span> variable. {st.source === "admin" && st.apiKeyHint && <>Saved key <span className="font-mono">{st.apiKeyHint}</span>, updated {when(st.apiKeyUpdatedAt)} by {st.apiKeyUpdatedBy}.</>}</p>
          {!st.encryptionReady && <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">To save keys here, add the secret <span className="font-mono">EMAIL_KEY_SECRET</span> (32+ random characters) in Cloudflare. It is separate from every other key. Until then the variable keeps working.</p>}
          {!st.tableReady && <p role="alert" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run <span className="font-mono">drizzle/0050_resend_integration.sql</span> in D1 (one statement at a time).</p>}
          <p className="text-xs">A new key is checked with Resend first. The saved key is replaced only if Resend accepts the new one. A sending-only key is enough and is the safest choice. The key is never shown again after saving.</p>
          <SecretForm kind="key" hint={st.apiKeyHint} canRemove={st.source === "admin"} />
        </div></Panel>
        <Panel title="Sender settings"><div className="space-y-3 p-5">
          <p className="text-sm">Every email uses these settings. Empty fields keep the current behaviour (sending address from <span className="font-mono">EMAIL_FROM</span>: {envFromAddress(env)}). Addresses must be on a domain Resend shows as verified (or your configured one).</p>
          <p className="text-xs">Internal notification email: <span className="font-mono">{env.NOTIFY_EMAIL ?? "not set"}</span> (set in Cloudflare on purpose, so a changed admin login cannot redirect payment and delivery alerts).</p>
          <SendersForm initial={senders} cats={SENDER_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} />
        </div></Panel>
        <Panel title="Sending domains"><div className="space-y-3 p-5">
          {!chk && <Empty title="No API key" text="Add a key to see your domains." />}
          {chk?.state === "valid_sending_only" && <p className="text-sm">This key is restricted to sending, so Resend does not let it read domain details. Check verification in <a className="underline" href="https://resend.com/domains" target="_blank" rel="noopener noreferrer">your Resend dashboard</a>. A sending-only key is the recommended setup.</p>}
          {chk && chk.state !== "valid_full" && chk.state !== "valid_sending_only" && <p role="alert" className="text-sm text-red-800">{chk.detail}</p>}
          {chk?.domains && (chk.domains.length === 0 ? <Empty title="No domains in this Resend account" /> : chk.domains.map((d) => <DomainCard key={d.id} id={d.id} name={d.name} status={d.status} region={d.region} />))}
        </div></Panel>
        <Panel title="Send a test email"><div className="p-5"><TestEmail defaultTo={admin.email} /><p className="mt-3 text-xs">Uses the real sender settings above and is logged under Email Activity as a test. Limit: 5 per hour.</p></div></Panel>
      </div>
    );
  }

  if (tab === "events") {
    const ev = await eventRegistry(env);
    body = (
      <Panel title="Email events"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-sand-200 text-xs text-forest-700"><th className="p-3">Event</th><th>Recipient</th><th>Sender group</th><th>Status</th><th>Last triggered</th><th>Last result</th><th>Sends</th></tr></thead><tbody>
        {ev.map((e) => (
          <tr key={e.key} className="border-b border-sand-100 align-top">
            <td className="p-3"><p className="font-semibold text-forest-900">{e.name}</p><p className="max-w-md text-xs">{e.description}</p><Link href={`/admin/system-emails/${e.key}`} className="text-xs underline">Edit template</Link></td>
            <td>{e.recipient}</td><td className="text-xs">{e.group}</td>
            <td>{!e.connected ? <Badge tone="mute">Not connected</Badge> : <EventToggle k={e.key} enabled={e.enabled} canDisable={e.canDisable} />}</td>
            <td className="text-xs">{when(e.lastAt)}</td><td className="text-xs">{e.lastResult || "—"}</td><td>{e.count30}</td>
          </tr>))}
      </tbody></table></div><p className="p-4 text-xs">Only optional emails can be switched off. Order, payment, delivery and security emails are always on. Alerts sent as plain text to the team (payments, wallets, delivery problems) are not listed here because they have no template; they cannot be disabled. Subjects, wording and branding are edited in System Emails.</p></Panel>
    );
  }

  if (tab === "activity") {
    const page = Math.max(1, Number(sp.page) || 1);
    const { rows, total } = await activity(env, { q: sp.q, event: sp.event, status: sp.status, from: sp.from, to: sp.to, page });
    const sel = sp.log ? rows.find((r) => String(r.id) === sp.log) : undefined;
    const detail = sel ? { st: await retryState(env, sel), hist: await retryHistory(env, sel.id) } : null;
    const pages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE));
    const keep = (o: Record<string, string>) => `?${new URLSearchParams(Object.fromEntries(Object.entries({ tab, q: sp.q, event: sp.event, status: sp.status, from: sp.from, to: sp.to, ...o }).filter(([, v]) => v) as [string, string][]))}`;
    body = (
      <div className="space-y-4">
        <form className="grid gap-2 rounded-2xl border border-sand-200 bg-white p-4 sm:grid-cols-6" method="get">
          <input type="hidden" name="tab" value="activity" />
          <input name="q" defaultValue={sp.q} placeholder="Search recipient, subject, reference, ID" className="rounded-xl border border-sand-300 px-3 py-2 text-sm sm:col-span-2" />
          <select name="event" defaultValue={sp.event ?? ""} className="rounded-xl border border-sand-300 px-2 py-2 text-sm"><option value="">All events</option>{TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}</select>
          <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-sand-300 px-2 py-2 text-sm"><option value="">All statuses</option>{ACTIVITY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input type="date" name="from" defaultValue={sp.from} aria-label="From date" className="rounded-xl border border-sand-300 px-2 py-2 text-sm" /><input type="date" name="to" defaultValue={sp.to} aria-label="To date" className="rounded-xl border border-sand-300 px-2 py-2 text-sm" />
          <button className="rounded-xl bg-forest-900 px-4 py-2 text-sm font-bold text-sand-50 sm:col-span-6 sm:w-fit">Filter</button>
        </form>
        {rows.length === 0 ? <Empty title="No emails match" text="Emails appear here once the site sends one through a template." /> : (
          <Panel><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-sand-200 text-xs text-forest-700"><th className="p-3">Time</th><th>Recipient</th><th>Event</th><th>Subject</th><th>Reference</th><th>Status</th></tr></thead><tbody>
            {rows.map((l) => { const [t, tn] = statusOf(l); return <tr key={l.id} className="border-b border-sand-100"><td className="p-3 text-xs">{when(l.created_at)}</td><td className="font-mono text-xs">{l.recipient}</td><td className="text-xs">{TEMPLATES.find((x) => x.key === l.template_key)?.name ?? l.template_key}{l.source === "test" ? " (test)" : ""}</td><td className="max-w-[16rem] truncate">{l.subject}</td><td className="text-xs">{l.reference || "—"}</td><td><Link href={keep({ log: String(l.id), page: String(page) })}><Badge tone={tn}>{t}</Badge></Link></td></tr>; })}
          </tbody></table></div></Panel>
        )}
        <div className="flex items-center justify-between text-sm"><span>{total} emails · page {page} of {pages}</span><span className="flex gap-3">{page > 1 && <Link className="underline" href={keep({ page: String(page - 1) })}>Previous</Link>}{page < pages && <Link className="underline" href={keep({ page: String(page + 1) })}>Next</Link>}</span></div>
        {sel && detail && (
          <Panel title={`Email details #${sel.id}`}><div className="space-y-2 p-5 text-sm">
            <p><b>Subject:</b> {sel.subject}</p><p><b>Recipient (masked):</b> {sel.recipient}</p><p><b>Template:</b> {sel.template_key} · <b>Reference:</b> {sel.reference || "—"}</p>
            <p><b>Provider message ID:</b> <span className="font-mono">{sel.provider_id || "—"}</span></p><p><b>Accepted by Resend:</b> {sel.status === "sent" ? "Yes" : "No"} · <b>Delivery status:</b> {statusOf(sel)[0]} {sel.status_at ? `(${when(sel.status_at)})` : ""}</p>
            {(sel.error || sel.delivery_detail) && <p className="text-red-800"><b>Detail:</b> {sel.error || sel.delivery_detail}</p>}
            <p className="text-xs">The email body and private links are not stored in the log.</p>
            {detail.hist.length > 0 && <div><p className="font-semibold">Retry history</p><ul className="list-disc pl-5 text-xs">{detail.hist.map((h, i) => <li key={i}>{when(h.created_at)} · {h.actor} · {h.result} · “{h.reason}”</li>)}</ul></div>}
            {detail.st.allowed ? <RetryButton id={sel.id} tries={detail.st.tries} /> : <p className="text-xs">Retry unavailable: {detail.st.reason}</p>}
          </div></Panel>
        )}
        <p className="text-xs">Statuses come from what Resend reports through the webhook. Logs are kept {LOG_RETENTION_DAYS} days. “Queued locally” does not exist: emails are sent immediately.</p>
      </div>
    );
  }

  if (tab === "webhooks") {
    let events: { id: string; type: string; matched: number; created_at: number }[] = [], last: number | null = null, ready = true;
    try {
      events = (await env.DB.prepare("SELECT id, type, matched, created_at FROM email_webhook_events ORDER BY created_at DESC LIMIT 15").all<{ id: string; type: string; matched: number; created_at: number }>()).results;
      last = (await env.DB.prepare("SELECT MAX(created_at) AS t FROM email_webhook_events").first<{ t: number | null }>())?.t ?? null;
    } catch { ready = false; }
    const fresh = isFresh(last);
    const url = `${SITE}/api/webhooks/resend`;
    body = (
      <div className="space-y-6">
        <Panel title="Status"><div className="space-y-2 p-5 text-sm">
          <p><Badge tone={fresh ? "good" : st.webhookSource === "none" ? "mute" : "warn"}>{fresh ? "Receiving verified events" : st.webhookSource === "none" ? "Not configured" : "Secret set, no event received yet"}</Badge></p>
          <p>Marked working only when a correctly signed event has actually arrived in the last 30 days. Last event: {when(last)}.</p>
          {!ready && <p className="text-amber-900">Run migration 0024 in D1 to record events.</p>}
        </div></Panel>
        <Panel title="Set up"><div className="space-y-3 p-5 text-sm">
          <p>Endpoint URL: <span className="font-mono">{url}</span> <CopyButton text={url} /></p>
          <ol className="list-decimal space-y-1 pl-5"><li>In Resend, open Webhooks and add the endpoint above.</li><li>Tick these events: email.sent, email.delivered, email.delivery_delayed, email.bounced, email.complained, email.failed.</li><li>Copy the signing secret (starts with whsec_) and save it below, or set <span className="font-mono">RESEND_WEBHOOK_SECRET</span> in Cloudflare.</li><li>Send a test email from Configuration and watch its status change to Delivered.</li></ol>
          <p className="text-xs">Signing secret: {st.webhookSource === "none" ? "not set" : st.webhookSource === "admin" ? `saved here (${st.webhookHint})` : "set as a Cloudflare variable"}.</p>
          <SecretForm kind="hook" hint={st.webhookHint} />
        </div></Panel>
        <Panel title="Recent events">{events.length === 0 ? <Empty title="No events yet" /> : <ul className="divide-y divide-sand-200 text-sm">{events.map((e) => <li key={e.id} className="flex flex-wrap justify-between gap-2 px-5 py-2"><span>{when(e.created_at)} · {e.type}</span><span className="text-xs">{e.matched ? "matched an email" : "no matching email"}</span></li>)}</ul>}<p className="p-4 text-xs">Invalid signatures are rejected with 401 and not stored. Duplicate events are ignored. Event records are kept {WEBHOOK_EVENT_DAYS} days.</p></Panel>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Resend" text="Credentials, senders, connection health, events and delivery for every transactional email." actions={<Link href="/admin/settings/integrations" className="text-sm underline">All integrations</Link>} />
      <nav aria-label="Resend sections" className="mb-6 flex flex-wrap gap-2">{TABS.map(([k, n]) => <Link key={k} href={`?tab=${k}`} aria-current={k === tab ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${k === tab ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-900 hover:bg-sand-200"}`}>{n}</Link>)}</nav>
      {body}
    </>
  );
}
