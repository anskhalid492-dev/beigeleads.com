import Link from "next/link";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, Empty, PageHeader, Panel, StatCard, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv } from "@/lib/db";
import { CLASS_LABEL, PREF_LABEL, SENDERS } from "@/lib/founder/config";
import { gatherFacts, getCustomer, lc, loadPrefs, realOrders, rowToCustomer } from "@/lib/founder/data";
import { senderOf } from "@/lib/founder/engine";
import { choose, plan } from "@/lib/founder/journey";
import { recommend, toCard } from "@/lib/founder/recs";
import { goLiveBlockers, loadCs } from "@/lib/founder/settings";
import { FOUNDER_TEMPLATES, GROUPS, INTERNAL_TEMPLATES } from "@/lib/founder/templates";
import { listEditable } from "@/lib/system-emails/store";
import { hydrateCatalog } from "@/lib/catalog-db";
import * as A from "./actions";

export const dynamic = "force-dynamic";
const TABS = [["overview", "Overview"], ["customers", "Customers"], ["journeys", "Customer Journeys"], ["templates", "Email Templates"], ["scheduled", "Scheduled Emails"], ["feedback", "Customer Feedback"], ["prefs", "Customer Preferences"], ["recs", "Recommendations"], ["activity", "Email Activity"], ["settings", "Settings"]] as const;
const field = "rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const day = (n: number) => (n % 24 === 0 ? `${n / 24} day${n === 24 ? "" : "s"}` : `${n} h`);
const ts = (n: number | null | undefined) => (n ? fmtDate(new Date(n * 1000)) : "—");

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string; c?: string; msg?: string; q?: string; e?: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const { env } = getCloudflareContext();
  const sp = await searchParams;
  const tab = TABS.find(([k]) => k === sp.tab)?.[0] ?? "overview";
  const db = getDbFromEnv(env);
  const [s, ed] = await Promise.all([loadCs(env), listEditable(db)]);
  const q = async <T,>(sql: string, ...b: unknown[]): Promise<T[]> => { try { return ((await env.DB.prepare(sql).bind(...b).all<T>()).results ?? []) as T[]; } catch { return []; } };
  const ready = (await q<{ n: number }>("SELECT COUNT(*) AS n FROM cs_customers")).length > 0;
  const enabledKeys = FOUNDER_TEMPLATES.filter((t) => s.enabled[t.key]).map((t) => t.key);
  const versions = Object.fromEntries(FOUNDER_TEMPLATES.map((t) => [t.key, ed.get(t.key)?.version ?? -1]));
  const blockers = goLiveBlockers(s, versions, enabledKeys);

  return (
    <>
      <PageHeader title="Customer Success" text="Founder-led emails after a purchase. Nothing is sent to customers until you approve each email, confirm the senders and switch the mode to live." />
      {sp.msg && <p role="status" className="mb-4 rounded-xl bg-forest-100 p-3 text-sm text-forest-900">{sp.msg}</p>}
      {!ready && <p role="alert" className="mb-5 rounded-xl bg-amber-100 p-3 text-sm text-amber-900">Run migration 0052_customer_success.sql in D1 (one statement at a time) to turn this on.</p>}
      <nav aria-label="Customer Success sections" className="mb-6 flex flex-wrap gap-2">
        {TABS.map(([k, l]) => <Link key={k} href={`/admin/customer-success?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === k ? "bg-forest-900 text-sand-50" : "bg-sand-100 text-forest-700"}`}>{l}</Link>)}
      </nav>

      {tab === "overview" && await Overview()}
      {tab === "customers" && (sp.c ? await Detail(Number(sp.c)) : await Customers(sp.q ?? ""))}
      {tab === "journeys" && Journeys()}
      {tab === "templates" && Templates()}
      {tab === "scheduled" && await Scheduled()}
      {tab === "feedback" && await Feedback()}
      {tab === "prefs" && await Prefs()}
      {tab === "recs" && await Recs(sp.e ?? "")}
      {tab === "activity" && await Activity()}
      {tab === "settings" && Settings()}
    </>
  );

  async function Overview() {
    const n = async (sql: string, ...b: unknown[]) => (await q<{ n: number }>(sql, ...b))[0]?.n ?? 0;
    const since = Math.floor(Date.now() / 1000) - 30 * 86400;
    const avg = (await q<{ a: number | null }>("SELECT AVG(satisfaction) AS a FROM cs_feedback"))[0]?.a;
    return (
      <>
        <div className="mb-5 grid gap-4 sm:grid-cols-4">
          <StatCard label="Mode" value={s.mode === "off" ? "Off" : s.mode === "dry_run" ? "Dry run" : "Live"} hint={s.mode === "live" ? "Sending to customers" : "No customer email is sent"} />
          <StatCard label="Customers enrolled" value={await n("SELECT COUNT(*) AS n FROM cs_customers")} hint={`${await n("SELECT COUNT(*) AS n FROM cs_customers WHERE status = 'paused'")} paused`} />
          <StatCard label="Founder emails sent (30 days)" value={await n("SELECT COUNT(*) AS n FROM cs_scheduled WHERE status = 'sent' AND sent_at > ?", since)} hint={`${await n("SELECT COUNT(*) AS n FROM cs_scheduled WHERE status = 'failed' AND updated_at > ?", since)} failed`} />
          <StatCard label="Feedback received" value={await n("SELECT COUNT(*) AS n FROM cs_feedback")} hint={avg != null ? `Average ${avg.toFixed(1)} of 5` : "None yet"} />
        </div>
        <Panel title="Before live sending">
          {blockers.length === 0 && s.mode === "live" ? <p className="p-5 text-sm">Everything required is in place.</p> : (
            <ul className="list-disc space-y-1 p-5 pl-9 text-sm">{(blockers.length ? blockers : ["All requirements are met. You can switch the mode to live in Settings."]).slice(0, 12).map((b) => <li key={b}>{b}</li>)}</ul>
          )}
        </Panel>
        <p className="mt-4 text-sm text-forest-500">Numbers come from real records only. Open and click rates are not tracked, so none are shown.</p>
      </>
    );
  }

  async function Customers(search: string) {
    const rows = (await q<Record<string, unknown>>("SELECT * FROM cs_customers WHERE (? = '' OR email LIKE ?) ORDER BY enrolled_at DESC LIMIT 100", search, `%${search.replace(/[%_]/g, "")}%`)).map(rowToCustomer);
    const past = await q<{ e: string }>(`SELECT DISTINCT lower(o.email) AS e FROM orders o WHERE o.status = 'paid' AND NOT EXISTS (SELECT 1 FROM cs_customers c WHERE c.email = lower(o.email)) LIMIT 50`);
    return (
      <>
        <Panel title="Enrol one customer">
          <form action={A.enrolAction} className="flex flex-wrap gap-2 p-5"><input name="email" type="email" required placeholder="customer@example.com" aria-label="Email" className={`${field} w-72`} /><input name="firstName" placeholder="First name (optional)" aria-label="First name" className={field} /><Button type="submit" size="sm">Enrol</Button></form>
          <p className="px-5 pb-4 text-xs text-forest-500">Customers are enrolled only by you, or automatically when you switch that on in Settings (new orders only).</p>
        </Panel>
        <div className="mt-6" />
        <Panel title={`Past customers who are not enrolled (${past.length})`}>
          {past.length === 0 ? <Empty title="None" text="Every customer with a paid order is already enrolled." /> : (
            <form action={A.enrolManyAction} className="space-y-3 p-5 text-sm">
              <div className="max-h-48 space-y-1 overflow-auto">{past.map((p) => <label key={p.e} className="flex gap-2"><input type="checkbox" name="e" value={p.e} />{p.e}</label>)}</div>
              <label className="flex gap-2 font-semibold"><input type="checkbox" name="approve" /> I approve enrolling the ticked customers in founder-led emails.</label>
              <Button type="submit" size="sm">Enrol ticked customers</Button>
            </form>
          )}
        </Panel>
        <div className="mt-6" />
        <form className="mb-3 flex gap-2"><input type="hidden" name="tab" value="customers" /><input name="q" defaultValue={search} placeholder="Search email" aria-label="Search" className={field} /><Button type="submit" size="sm" variant="secondary">Search</Button></form>
        <Panel title="Enrolled customers">
          {rows.length === 0 ? <Empty title="No customers enrolled yet" /> : (
            <table className="w-full text-left text-sm"><thead><tr className="text-xs text-forest-500"><th className="px-5 py-2">Customer</th><th>Status</th><th>Enrolled</th><th /></tr></thead><tbody>
              {rows.map((c) => <tr key={c.id} className="border-t border-sand-200"><td className="px-5 py-2">{c.firstName ? `${c.firstName} · ` : ""}{c.email}</td><td><Badge tone={c.status === "active" ? "good" : c.status === "paused" ? "warn" : "mute"}>{c.status}</Badge></td><td>{ts(c.enrolledAt)}</td><td><Link className="underline" href={`/admin/customer-success?tab=customers&c=${c.id}`}>Open</Link></td></tr>)}
            </tbody></table>
          )}
        </Panel>
      </>
    );
  }

  async function Detail(id: number) {
    const c = await getCustomer(env, id);
    if (!c) return <Empty title="Customer not found" />;
    await hydrateCatalog(env).catch(() => undefined);
    const now = Math.floor(Date.now() / 1000);
    const { facts } = await gatherFacts(env, c, now);
    const meta = new Map(FOUNDER_TEMPLATES.map((t) => [t.key, t.founder!]));
    const { due, skipped } = plan(FOUNDER_TEMPLATES.map((t) => ({ key: t.key, f: t.founder! })), facts, s);
    const { pick, held } = choose(due, meta, facts, s);
    const prefs = await loadPrefs(env, c.email);
    const orders = await realOrders(env, c.email);
    const evs = await q<{ kind: string; detail: string; actor: string; created_at: number }>("SELECT kind, detail, actor, created_at FROM cs_events WHERE customer_id = ? ORDER BY created_at DESC LIMIT 30", c.id);
    const hist = await q<{ template_key: string; reference: string; status: string; reason: string; sent_at: number | null; created_at: number }>("SELECT template_key, reference, status, reason, sent_at, created_at FROM cs_scheduled WHERE customer_id = ? ORDER BY created_at DESC LIMIT 40", c.id);
    return (
      <>
        <p className="mb-3 text-sm"><Link className="underline" href="/admin/customer-success?tab=customers">← All customers</Link></p>
        <Panel title={c.email}>
          <div className="space-y-3 p-5 text-sm">
            <p><Badge tone={c.status === "active" ? "good" : "warn"}>{c.status}</Badge> · {orders.length} real paid order(s) · {facts.unsubscribedAll ? "unsubscribed from optional emails" : "optional emails allowed"} · {facts.supportOpen ? "support request open" : "no open support request"}</p>
            <div className="flex flex-wrap gap-2">
              {(["pause", "resume", "cancel"] as const).map((op) => <form key={op} action={A.customerAction}><input type="hidden" name="id" value={c.id} /><Button name="op" value={op} size="sm" variant="secondary">{op === "pause" ? "Pause journey" : op === "resume" ? "Resume journey" : "Cancel journey"}</Button></form>)}
            </div>
            <form action={A.noteAction} className="flex gap-2"><input type="hidden" name="id" value={c.id} /><input name="note" aria-label="Internal note" placeholder="Internal note (never shown to the customer)" className={`${field} flex-1`} /><Button size="sm" variant="secondary">Save note</Button></form>
          </div>
        </Panel>
        <div className="mt-6" />
        <Panel title="What happens next">
          <div className="space-y-2 p-5 text-sm">
            <p>Next email: {pick ? <strong>{FOUNDER_TEMPLATES.find((t) => t.key === pick.key)?.name}</strong> : "none due right now"}.</p>
            {held.length > 0 && <p>Held back: {held.map((h) => `${meta.get(h.key)?.id} (${h.reason})`).join("; ")}.</p>}
            {skipped.length > 0 && <p className="text-forest-500">Skipped: {skipped.slice(0, 8).map((h) => `${meta.get(h.key)?.id} (${h.reason})`).join("; ")}.</p>}
            {due.length > 0 && <div className="flex flex-wrap gap-2 pt-2">{due.map((d) => <form key={d.key + d.reference} action={A.skipAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="key" value={d.key} /><input type="hidden" name="reference" value={d.reference} /><Button size="sm" variant="secondary">Skip {meta.get(d.key)?.id}</Button></form>)}</div>}
          </div>
        </Panel>
        <div className="mt-6" />
        <Panel title="Record a reply">
          <form action={A.replyAction} className="space-y-2 p-5 text-sm"><input type="hidden" name="id" value={c.id} />
            <p className="text-forest-500">Replies arrive in the shared inbox; there is no automatic sync. Record one here to pause optional emails until you resume them.</p>
            <div className="flex flex-wrap gap-4">{(["business", "audience", "goals"] as const).map((t) => <label key={t} className="flex gap-2"><input type="checkbox" name={t} /> Shared their {t}</label>)}</div>
            <input name="note" placeholder="Short note" aria-label="Note" className={`${field} w-full`} /><Button size="sm">Record reply and pause</Button></form>
        </Panel>
        <div className="mt-6" />
        <Panel title="Recommendations">
          <form action={A.recsAction} className="space-y-2 p-5 text-sm"><input type="hidden" name="id" value={c.id} />
            <p>Chosen automatically from real, on-sale lists the customer does not own. Override with up to three list slugs:</p>
            <input name="slugs" defaultValue={c.recOverride.join(", ")} aria-label="Slugs" className={`${field} w-full`} /><Button size="sm" variant="secondary">Save</Button></form>
          <ul className="space-y-1 px-5 pb-4 text-sm">{recommend([], { override: c.recOverride }).map(toCard).map((r) => <li key={r.url}>{r.name} <span className="text-forest-500">({r.meta})</span></li>)}</ul>
        </Panel>
        <div className="mt-6" />
        <Panel title="Preferences">
          <ul className="space-y-1 p-5 text-sm">{(Object.keys(PREF_LABEL) as (keyof typeof PREF_LABEL)[]).map((k) => <li key={k}>{prefs[k] ? "On" : "Off"} · {PREF_LABEL[k]}</li>)}<li>Frequency: {prefs.frequency}</li>{prefs.countries.length > 0 && <li>Countries: {prefs.countries.join(", ")}</li>}{prefs.industries.length > 0 && <li>Industries: {prefs.industries.join(", ")}</li>}</ul>
        </Panel>
        <div className="mt-6" />
        <Panel title="Email history">{hist.length === 0 ? <Empty title="Nothing sent or planned yet" /> : <ul className="divide-y divide-sand-200 text-sm">{hist.map((h, i) => <li key={i} className="px-5 py-2">{meta.get(h.template_key)?.id} · {h.status}{h.reason ? ` (${h.reason})` : ""} · {ts(h.sent_at ?? h.created_at)}</li>)}</ul>}</Panel>
        <div className="mt-6" />
        <Panel title="Activity log">{evs.length === 0 ? <Empty title="No activity yet" /> : <ul className="divide-y divide-sand-200 text-sm">{evs.map((e, i) => <li key={i} className="px-5 py-2">{ts(e.created_at)} · {e.kind} {e.detail} <span className="text-forest-500">{e.actor}</span></li>)}</ul>}</Panel>
      </>
    );
  }

  function Journeys() {
    return (
      <div className="space-y-8">
        <p className="text-sm text-forest-700">Each email is a step in the library, not a fixed sequence: a step is sent only when its conditions are met and the frequency limits allow it. Changes to delay, sender and on/off take effect on the next run.</p>
        {GROUPS.map((g) => (
          <section key={g} aria-label={g}><h2 className="mb-3 font-semibold text-forest-900">{g}</h2>
            <ol className="space-y-3">{FOUNDER_TEMPLATES.filter((t) => t.founder!.group === g).map((t) => {
              const f = t.founder!; const e = ed.get(t.key); const approved = s.approved[t.key] === (e?.version ?? -1);
              return (
                <li key={t.key} id={t.key} className="rounded-2xl border border-sand-200 bg-white p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><strong>{f.id} · {t.name}</strong><Badge tone="info">{CLASS_LABEL[f.klass]}</Badge><Badge tone={approved ? "good" : "warn"}>{approved ? "Approved" : "Not approved"}</Badge><Badge tone={s.enabled[t.key] ? "good" : "mute"}>{s.enabled[t.key] ? "On" : "Off"}</Badge>{t.connection === "not_connected" && <Badge tone="mute">Sent by hand</Badge>}</div>
                  <p className="mt-1 text-forest-500">{f.trigger} {f.eligibility}</p>
                  <form action={A.saveJourneyAction} className="mt-3 flex flex-wrap items-center gap-3"><input type="hidden" name="key" value={t.key} />
                    <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={!!s.enabled[t.key]} disabled={t.connection === "not_connected"} /> On</label>
                    <label className="flex items-center gap-2">Delay (hours) <input name="hours" type="number" min={0} defaultValue={s.delays[t.key] ?? f.delayHours} className={`${field} w-24`} /></label>
                    <span className="text-forest-500">= {day(s.delays[t.key] ?? f.delayHours)} after {f.anchor.replace("_", " ")}</span>
                    <label className="flex items-center gap-2">Sender <select name="sender" defaultValue={senderOf(t.key, s)} className={field}>{(["A", "B", "C"] as const).map((id) => <option key={id} value={id}>{SENDERS[id].email}</option>)}</select></label>
                    <Button size="sm" variant="secondary">Save</Button>
                  </form>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <form action={A.approveAction}><input type="hidden" name="key" value={t.key} /><Button size="sm">Approve current version</Button></form>
                    <form action={A.testSendAction}><input type="hidden" name="key" value={t.key} /><Button size="sm" variant="secondary">Send test to me</Button></form>
                    <Link className="inline-flex items-center rounded-xl border border-sand-300 px-3 text-sm" href={`/admin/system-emails/${t.key}`}>Edit and preview</Link>
                  </div>
                </li>
              );
            })}</ol></section>
        ))}
      </div>
    );
  }

  function Templates() {
    return (
      <div className="space-y-6">
        <Panel title="Customer emails (36)"><ul className="divide-y divide-sand-200 text-sm">{FOUNDER_TEMPLATES.map((t) => <li key={t.key} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2"><span>{t.founder!.id} · {t.name} <span className="text-forest-500">(layout {t.founder!.layout}, {t.founder!.group})</span></span><span className="flex gap-3"><Badge tone="mute">v{ed.get(t.key)?.version ?? 0}</Badge><Link className="underline" href={`/admin/system-emails/${t.key}`}>Edit</Link><Link className="underline" href={`/admin/system-emails/${t.key}/design`}>Designer</Link></span></li>)}</ul></Panel>
        <Panel title="Internal notifications (6)"><ul className="divide-y divide-sand-200 text-sm">{INTERNAL_TEMPLATES.map((t) => <li key={t.key} className="flex justify-between px-5 py-2"><span>{t.name}</span><Link className="underline" href={`/admin/system-emails/${t.key}`}>Edit</Link></li>)}</ul></Panel>
      </div>
    );
  }

  async function Scheduled() {
    const rows = await q<{ customer_id: number; template_key: string; reference: string; status: string; reason: string; sent_at: number | null; created_at: number; attempts: number }>("SELECT customer_id, template_key, reference, status, reason, sent_at, created_at, attempts FROM cs_scheduled ORDER BY created_at DESC LIMIT 100");
    const dry = await q<{ customer_id: number; detail: string; created_at: number }>("SELECT customer_id, detail, created_at FROM cs_events WHERE kind = 'dry_run' ORDER BY created_at DESC LIMIT 30");
    return (
      <>
        <form action={A.runNowAction} className="mb-4"><Button size="sm" variant="secondary">Run a dry run now (sends nothing)</Button></form>
        <Panel title="Dry-run plan (what would be sent)">{dry.length === 0 ? <Empty title="Nothing planned" text="Switch an email on, enrol a customer and run a dry run." /> : <ul className="divide-y divide-sand-200 text-sm">{dry.map((d, i) => <li key={i} className="px-5 py-2">{ts(d.created_at)} · customer {d.customer_id} · {d.detail}</li>)}</ul>}</Panel>
        <div className="mt-6" />
        <Panel title="Sent and failed">{rows.length === 0 ? <Empty title="No emails yet" /> : <table className="w-full text-left text-sm"><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-sand-200"><td className="px-5 py-2">{r.template_key}</td><td><Link className="underline" href={`/admin/customer-success?tab=customers&c=${r.customer_id}`}>#{r.customer_id}</Link></td><td><Badge tone={r.status === "sent" ? "good" : r.status === "failed" ? "bad" : "mute"}>{r.status}</Badge> {r.reason}</td><td>{ts(r.sent_at ?? r.created_at)}</td></tr>)}</tbody></table>}</Panel>
      </>
    );
  }

  async function Feedback() {
    const rows = await q<{ id: number; reference: string; email: string; satisfaction: number; product_experience: string; worked_well: string; improve: string; comments: string; wants_help: number; status: string; note: string; created_at: number }>("SELECT * FROM cs_feedback ORDER BY created_at DESC LIMIT 100");
    return (
      <Panel title="Customer feedback">
        {rows.length === 0 ? <Empty title="No feedback yet" text="It appears here after customers use the feedback link. Nothing is made up." /> : (
          <ul className="divide-y divide-sand-200">{rows.map((r) => (
            <li key={r.id} className="space-y-2 px-5 py-4 text-sm">
              <div className="flex flex-wrap items-center gap-3"><strong>{r.satisfaction}/5</strong><span className="font-mono text-xs">{r.reference}</span><span>{r.email}</span>{r.wants_help ? <Badge tone="warn">Asked for help</Badge> : null}<span className="text-xs">{ts(r.created_at)}</span></div>
              {(r.worked_well || r.improve || r.comments) && <p className="whitespace-pre-wrap rounded-xl bg-sand-50 p-3">{[r.worked_well && `Worked: ${r.worked_well}`, r.improve && `Improve: ${r.improve}`, r.comments].filter(Boolean).join("\n")}</p>}
              <form action={A.feedbackStatusAction} className="flex flex-wrap gap-2"><input type="hidden" name="id" value={r.id} />
                <select name="status" defaultValue={r.status} className={field} aria-label="Status"><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
                <input name="note" defaultValue={r.note} placeholder="Internal note" aria-label="Note" className={`${field} flex-1`} /><Button size="sm" variant="secondary">Save</Button></form>
            </li>
          ))}</ul>
        )}
      </Panel>
    );
  }

  async function Prefs() {
    const n = async (c: string) => (await q<{ n: number }>(`SELECT COUNT(*) AS n FROM cs_prefs WHERE ${c}`))[0]?.n ?? 0;
    const total = (await q<{ n: number }>("SELECT COUNT(*) AS n FROM cs_prefs"))[0]?.n ?? 0;
    return (
      <>
        <div className="mb-5 grid gap-4 sm:grid-cols-4"><StatCard label="Customers who set preferences" value={total} /><StatCard label="Unsubscribed from optional emails" value={await n("unsub_all = 1")} /><StatCard label="Want fewer emails" value={await n("frequency = 'less'")} /><StatCard label="Turned recommendations off" value={await n("recs = 0")} /></div>
        <p className="text-sm text-forest-500">Preferences are stored against a one-way hash of the address, so this page shows counts only. Open a customer to see theirs. One unsubscribe applies to all three sender addresses.</p>
      </>
    );
  }

  async function Recs(email: string) {
    await hydrateCatalog(env).catch(() => undefined);
    const owned = email ? (await q<{ s: string }>("SELECT DISTINCT i.product_slug AS s FROM order_items i JOIN orders o ON o.id = i.order_id WHERE lower(o.email) = ? AND o.status = 'paid'", lc(email))).map((r) => r.s) : [];
    return (
      <>
        <p className="mb-3 text-sm">Recommendations use the real catalog only: lists that are on sale, not already owned, at most three, real counts and prices. Nothing fictional or unavailable.</p>
        <form className="mb-4 flex gap-2"><input type="hidden" name="tab" value="recs" /><input name="e" defaultValue={email} type="email" placeholder="customer@example.com" aria-label="Customer email" className={`${field} w-72`} /><Button size="sm" variant="secondary">Preview</Button></form>
        {email && (["general", "country", "industry"] as const).map((k) => <Panel key={k} title={`${k === "general" ? "Related databases" : k === "country" ? "Another market" : "Another industry"}`}>{recommend(owned, { kind: k }).length === 0 ? <Empty title="No real match" text="No email of this kind would be sent." /> : <ul className="space-y-1 p-5 text-sm">{recommend(owned, { kind: k }).map(toCard).map((c) => <li key={c.url}>{c.name} <span className="text-forest-500">({c.meta}{c.records ? `, ${c.records} records` : ""}{c.price ? `, from ${c.price}` : ""})</span></li>)}</ul>}</Panel>)}
      </>
    );
  }

  async function Activity() {
    const rows = await q<{ template_key: string; recipient: string; subject: string; status: string; delivery_status: string; created_at: number; source: string }>("SELECT template_key, recipient, subject, status, delivery_status, created_at, source FROM email_delivery_logs WHERE template_key LIKE 'cs%' ORDER BY created_at DESC LIMIT 100");
    return (
      <Panel title="Founder email activity">{rows.length === 0 ? <Empty title="No emails yet" text="Delivered and bounced show here once the Resend webhook is connected." /> : (
        <table className="w-full text-left text-sm"><tbody>{rows.map((r, i) => <tr key={i} className="border-t border-sand-200"><td className="px-5 py-2">{r.template_key}</td><td>{r.recipient}</td><td>{r.source === "test" ? <Badge tone="info">Test</Badge> : null} <Badge tone={r.delivery_status === "bounced" || r.delivery_status === "complained" || r.status === "failed" ? "bad" : r.delivery_status === "delivered" ? "good" : "mute"}>{r.delivery_status || (r.status === "sent" ? "Accepted" : "Failed")}</Badge></td><td>{ts(r.created_at)}</td></tr>)}</tbody></table>
      )}</Panel>
    );
  }

  function Settings() {
    return (
      <div className="space-y-6">
        <Panel title="Mode">
          <div className="space-y-3 p-5 text-sm">
            <p>Off: nothing runs. Dry run: the engine records what it would send and sends nothing. Live: real customer emails, only for emails you approved, with confirmed senders and a confirmed inbox.</p>
            <form action={A.saveModeAction} className="flex flex-wrap gap-2">{(["off", "dry_run", "live"] as const).map((m) => <Button key={m} name="mode" value={m} size="sm" variant={s.mode === m ? "primary" : "secondary"}>{m === "dry_run" ? "Dry run" : m === "live" ? "Go live" : "Off"}</Button>)}</form>
            {blockers.length > 0 && <ul className="list-disc pl-5 text-forest-500">{blockers.slice(0, 6).map((b) => <li key={b}>{b}</li>)}</ul>}
          </div>
        </Panel>
        <Panel title="Senders, inbox and limits">
          <form action={A.saveSettingsAction} className="space-y-3 p-5 text-sm">
            <p>All three founder addresses use the display name “Anus — Founder, BeigeLeads”, reply to hello@beigeleads.com, and share one unsubscribe list. Confirm each address exists and can send.</p>
            {(["A", "B", "C"] as const).map((id) => <label key={id} className="flex gap-2"><input type="checkbox" name={`s${id}`} defaultChecked={s.sendersConfirmed[id]} /> {SENDERS[id].email} is confirmed ({SENDERS[id].use})</label>)}
            <label className="flex gap-2"><input type="checkbox" name="inbox" defaultChecked={s.replyInboxConfirmed} /> hello@beigeleads.com is a monitored inbox</label>
            <label className="flex gap-2"><input type="checkbox" name="autoEnrollNew" defaultChecked={s.autoEnrollNew} /> Enrol new customers automatically (only orders paid after you switch this on; past customers need your approval)</label>
            <div className="flex flex-wrap gap-3">{([["firstWeekMax", "Optional emails in the first 7 days", s.caps.firstWeekMax], ["perWeekMax", "Per week after that", s.caps.perWeekMax], ["per30Max", "Per rolling 30 days", s.caps.per30Max], ["minGapHours", "Minimum gap (hours)", s.caps.minGapHours], ["reactivationMax", "Reactivation attempts", s.caps.reactivationMax], ["maxPerRun", "Customers per run", s.maxPerRun]] as const).map(([k, l, v]) => <label key={k} className="flex flex-col">{l}<input name={k} type="number" min={0} defaultValue={v} className={`${field} w-28`} /></label>)}</div>
            <Button size="sm">Save settings</Button>
          </form>
          <form action={A.checkSendersAction} className="px-5 pb-5"><Button size="sm" variant="secondary">Check the sending domain with Resend</Button></form>
        </Panel>
        <Panel title="Approve a founder update (email CS-34)">
          <form action={A.publishUpdateAction} className="space-y-2 p-5 text-sm"><p>Only text you write and approve here is ever sent. Nothing is generated.</p>
            <input name="title" placeholder="Title" aria-label="Title" className={`${field} w-full`} /><textarea name="body" rows={4} placeholder="What you want customers to know" aria-label="Update" className={`${field} w-full`} /><input name="url" placeholder="https://beigeleads.com/… (optional)" aria-label="Link" className={`${field} w-full`} /><Button size="sm">Approve update</Button></form>
        </Panel>
      </div>
    );
  }
}
