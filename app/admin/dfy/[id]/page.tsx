import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq } from "drizzle-orm";
import { Badge, PageHeader, Panel, usd } from "@/components/admin/ui";
import { DfyForm, inp } from "@/components/admin/dfy-form";
import { getDbFromEnv, schema } from "@/lib/db";
import { ADMIN_STAGES, LABEL, canMove, isStage } from "@/lib/dfy/state";
import { ASSET_STATUS, OWN_STATUS, STOP_RULES, assetsOf, evaluate, getDfy, latestCopy, launchGates, pageUrl } from "@/lib/dfy/store";
import { loadDfySettings } from "@/lib/dfy/settings";
import { dfyToken } from "@/lib/dfy/token";
import { gate } from "../../email-verification/gate";

export const dynamic = "force-dynamic";
export const metadata = { title: "DFY Outbound order", robots: { index: false, follow: false } };
const dt = (t: number | null) => (t ? new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—");
const lbl = "block text-sm font-semibold text-forest-900";
const Field = ({ n, l, v, t = "text" }: { n: string; l: string; v?: string | number; t?: string }) => <label className={lbl}>{l}<input name={n} type={t} defaultValue={v} className={inp} /></label>;

export default async function DfyDetail({ params }: { params: Promise<{ id: string }> }) {
  await gate();
  const { id } = await params;
  const { env } = getCloudflareContext(); const db = getDbFromEnv(env);
  const d = await getDfy(db, id).catch(() => null);
  if (!d) notFound();
  const s = await loadDfySettings(env);
  const [assets, copy, metrics, events, gates] = await Promise.all([assetsOf(db, id), latestCopy(db, id), db.select().from(schema.dfyMetrics).where(eq(schema.dfyMetrics.dfyId, id)).orderBy(desc(schema.dfyMetrics.id)), db.select().from(schema.dfyEvents).where(eq(schema.dfyEvents.dfyId, id)).orderBy(desc(schema.dfyEvents.id)).limit(40), launchGates(db, d)]);
  const stage = isStage(d.status) ? d.status : "awaiting_payment";
  const options = ADMIN_STAGES.filter((t) => canMove(stage, t));
  type Cap = { domains?: number; inboxes?: number; perInboxDaily?: number; sendingDays?: number; plannedMessages?: number; note?: string };
  let cap: Cap = {}; try { cap = d.capacityJson ? (JSON.parse(d.capacityJson) as Cap) : {}; } catch { /* none */ }
  type Onb = Record<string, string | boolean>; let onb: Onb | null = null; try { onb = d.onboardingJson ? (JSON.parse(d.onboardingJson) as Onb) : null; } catch { /* none */ }
  const form = { domains: cap.domains ?? 0, inboxes: cap.inboxes ?? 0, perInboxDaily: cap.perInboxDaily ?? s.perInboxDaily, sendingDays: cap.sendingDays ?? s.sendingDaysPerMonth, plannedMessages: cap.plannedMessages ?? 0, note: cap.note ?? "" };
  const ev = await evaluate(env, d, form);
  type Own = { status?: string; assets?: string; agreement?: string; restrictions?: string; acknowledged?: boolean; date?: string }; let own: Own = {}; try { own = d.ownershipJson ? (JSON.parse(d.ownershipJson) as Own) : {}; } catch { /* none */ }
  const token = await dfyToken(env, d.id);
  return (
    <>
      <PageHeader title={`${d.id} · ${d.packageName}`} text={`${d.email} · ${usd(d.monthlyCents)}/month · cycle ${d.cycle}`} actions={<Link className="text-sm font-semibold underline" href="/admin/dfy">Back to orders</Link>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Summary"><dl className="grid grid-cols-2 gap-2 p-4 text-sm">
          <dt>Stage</dt><dd><Badge tone="info">{LABEL[stage]}</Badge></dd><dt>Paid</dt><dd>{dt(d.paidAt)}</dd><dt>Renews</dt><dd>{dt(d.renewsAt)}{d.cancelRequested ? " (cancel requested)" : ""}</dd>
          <dt>Leads / initial / follow-ups</dt><dd>{d.leads.toLocaleString("en-US")} / {d.initialSends.toLocaleString("en-US")} / {d.followups}</dd>
          <dt>Theoretical ceiling</dt><dd>{d.ceiling.toLocaleString("en-US")} messages (not a promise)</dd><dt>Estimates</dt><dd>{d.domainsEst} domains, {d.inboxesEst} inboxes</dd>
          <dt>Ownership</dt><dd>{d.ownership ? `Yes, ${usd(d.ownershipCents)} one-time` : "No"}</dd><dt>Reporting</dt><dd className="capitalize">{d.reporting}</dd>
          <dt>Client page</dt><dd className="break-all"><a className="underline" href={pageUrl(token).replace("https://beigeleads.com", "")}>open</a></dd>
        </dl></Panel>
        <Panel title="Stage"><div className="space-y-4 p-4">
          <DfyForm id={id} op="stage" label="Move stage"><label className={lbl}>New stage<select name="to" className={inp}>{options.map((o) => <option key={o} value={o}>{LABEL[o]}</option>)}</select></label><label className={`${lbl} mt-2`}>Note for the customer email (optional, no passwords)<input name="detail" maxLength={200} className={inp} /></label></DfyForm>
          {gates.length > 0 && <p className="rounded-xl bg-sand-100 p-3 text-sm"><strong>Before Ready to Launch / Campaign Active:</strong> {gates.join(" ")}</p>}
          {stage === "paused" ? <DfyForm id={id} op="resume" label="Resume service" confirm="Resume the service?" /> : d.paidAt && !["cancelled", "completed"].includes(stage) ? <DfyForm id={id} op="pause" label="Pause service" confirm="Pause the service? Sending must stop."><Field n="detail" l="Reason" /></DfyForm> : null}
          <p className="text-xs">Stop rules: sending stops when {STOP_RULES.join(", ")}. This is done by hand.</p>
        </div></Panel>
      </div>
      {onb && <Panel title="Onboarding (submitted by the customer)" className="mt-5"><dl className="grid gap-2 p-4 text-sm sm:grid-cols-2">{Object.entries(onb).map(([k, v]) => <div key={k}><dt className="font-semibold text-forest-900">{k}</dt><dd className="whitespace-pre-wrap">{String(v)}</dd></div>)}</dl></Panel>}
      <Panel title={`Capacity plan ${d.capacityApproved ? "(approved)" : "(not approved)"}`} className="mt-5"><div className="p-4">
        <p className="text-sm">Enter what the team really confirms for this order. Allocations are never reduced silently; differences are recorded.</p>
        <DfyForm id={id} op="capacity" label="Save plan" hidden={{ approve: "0" }} className="mt-3"><div className="grid gap-3 sm:grid-cols-3"><Field n="domains" l="Confirmed domains" v={form.domains} t="number" /><Field n="inboxes" l="Confirmed inboxes" v={form.inboxes} t="number" /><Field n="perInboxDaily" l="Sends per inbox per day" v={form.perInboxDaily} t="number" /><Field n="sendingDays" l="Sending days per month" v={form.sendingDays} t="number" /><Field n="plannedMessages" l="Messages planned this cycle" v={form.plannedMessages} t="number" /><Field n="note" l="Note" v={form.note} /></div>
          <label className="mt-3 flex gap-2 text-sm"><input type="checkbox" name="accept" className="mt-1" />I accept the differences listed below</label></DfyForm>
        <DfyForm id={id} op="capacity" label="Approve capacity plan" confirm="Approve this plan with the numbers saved above? Re-enter them in the form first if you changed them." hidden={{ approve: "1", domains: String(form.domains), inboxes: String(form.inboxes), perInboxDaily: String(form.perInboxDaily), sendingDays: String(form.sendingDays), plannedMessages: String(form.plannedMessages), note: form.note }} className="mt-2"><label className="flex gap-2 text-sm"><input type="checkbox" name="accept" className="mt-1" />I accept these differences and approve anyway</label></DfyForm>
        <p className="mt-3 text-sm">Monthly capacity at confirmed numbers: <strong>{ev.monthlyCapacity.toLocaleString("en-US")}</strong> messages. Theoretical ceiling {ev.ceiling.toLocaleString("en-US")}.</p>
        {ev.issues.length > 0 ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">{ev.issues.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="mt-2 text-sm text-forest-700">No mismatch found.</p>}
      </div></Panel>
      <Panel title="Domains and inboxes" className="mt-5"><div className="space-y-3 p-4">
        <p className="text-sm">&ldquo;Verified&rdquo; needs a note saying how you verified it (for example DNS and authentication checks). Nothing is verified by the site.</p>
        {assets.map((a) => <DfyForm key={a.id} id={id} op="assetStatus" label="Update" hidden={{ assetId: String(a.id) }} className="grid items-end gap-2 sm:grid-cols-[1fr_9rem_1fr_auto]"><p className="text-sm"><strong>{a.kind}</strong> {a.name}</p><select name="status" defaultValue={a.status} className={inp}>{ASSET_STATUS.map((x) => <option key={x}>{x}</option>)}</select><input name="note" defaultValue={a.note} placeholder="How verified" className={inp} /></DfyForm>)}
        <DfyForm id={id} op="assetAdd" label="Add" className="flex flex-wrap items-end gap-2"><select name="kind" className={inp + " max-w-32"}><option value="domain">domain</option><option value="inbox">inbox</option></select><input name="name" placeholder="name (example.com or name@example.com)" className={inp + " max-w-sm"} /></DfyForm>
        <div className="flex flex-wrap gap-4"><DfyForm id={id} op="announce" label="Tell customer: domains done" hidden={{ kind: "domain" }} /><DfyForm id={id} op="announce" label="Tell customer: inboxes done" hidden={{ kind: "inbox" }} /></div>
      </div></Panel>
      <Panel title="Sequence copy" className="mt-5"><div className="space-y-3 p-4">
        {copy.map((c) => <div key={c.id} className="rounded-xl bg-sand-100 p-3 text-sm"><p className="font-semibold">{c.kind === "initial" ? "Initial" : `Follow-up ${c.step - 1}`} · {c.variant} · v{c.version} · <Badge tone={c.status === "approved" ? "good" : "info"}>{c.status}</Badge></p>{c.subject && <p>Subject: {c.subject}</p>}<p className="whitespace-pre-wrap">{c.body}</p>{c.clientNote && <p className="mt-1 text-amber-900">Customer: {c.clientNote}</p>}</div>)}
        <DfyForm id={id} op="copySave" label="Save as new version"><div className="grid gap-3 sm:grid-cols-3"><Field n="step" l="Step (1 = initial, 2+ = follow-ups)" v={1} t="number" /><Field n="variant" l="Variant (A, B)" v="A" /><Field n="subject" l="Subject" /></div><label className={`${lbl} mt-2`}>Message<textarea name="body" rows={5} className={inp} /></label></DfyForm>
        <DfyForm id={id} op="copySubmit" label="Send to customer for approval" confirm="Send the current copy to the customer for approval?" />
      </div></Panel>
      <Panel title="Metrics and reports" className="mt-5"><div className="space-y-3 p-4">
        <p className="text-sm">Enter real counts only. Sourced, verified, approved and contacted are separate. Reports stay private until published.</p>
        {metrics.map((m) => <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand-100 p-3 text-sm"><span>{m.period}: sourced {m.sourced}, verified {m.verified}, contacted {m.contacted}, sends {m.initialSends}+{m.followupSends}, replies {m.replies}, meetings {m.meetings} {m.published ? <Badge tone="good">published</Badge> : null}</span>{!m.published && <DfyForm id={id} op="publishReport" label="Publish to customer" hidden={{ metricId: String(m.id) }} confirm="Publish this report and email the customer?" />}</div>)}
        <DfyForm id={id} op="metrics" label="Save metrics"><div className="grid gap-3 sm:grid-cols-4"><Field n="period" l="Period (2026-11 or 2026-W47)" />{(["sourced", "verified", "approved", "contacted", "initialSends", "followupSends", "failures", "replies", "interested", "optouts", "meetings"] as const).map((k) => <Field key={k} n={k} l={k} v={0} t="number" />)}</div><Field n="note" l="Note" /></DfyForm>
      </div></Panel>
      {d.ownership === 1 && <Panel title="Ownership transfer" className="mt-5"><div className="p-4"><DfyForm id={id} op="ownership" label="Save ownership" ><div className="grid gap-3 sm:grid-cols-2"><label className={lbl}>Status<select name="status" defaultValue={own.status ?? "not_started"} className={inp}>{OWN_STATUS.map((x) => <option key={x}>{x}</option>)}</select></label><Field n="date" l="Transfer date" v={own.date} t="date" /><Field n="assets" l="Assets covered" v={own.assets} /><Field n="agreement" l="Agreement reference" v={own.agreement} /><Field n="restrictions" l="Provider restrictions" v={own.restrictions} /></div><label className="mt-2 flex gap-2 text-sm"><input type="checkbox" name="acknowledged" defaultChecked={own.acknowledged} />Customer acknowledged</label><p className="mt-2 text-xs">Never put passwords here or in emails.{s.ownershipAgreement ? " An agreement text is set in DFY settings." : ""}</p></DfyForm></div></Panel>}
      <Panel title="Internal note" className="mt-5"><div className="p-4"><DfyForm id={id} op="note" label="Save note"><textarea name="note" defaultValue={d.note} rows={3} className={inp} /></DfyForm></div></Panel>
      <Panel title="Activity" className="mt-5"><ul className="divide-y divide-sand-200 p-4 text-sm">{events.map((e) => <li key={e.id} className="py-1.5"><span className="text-forest-500">{dt(e.createdAt)}</span> · {e.actor} · <strong>{e.action}</strong> {e.detail}</li>)}</ul></Panel>
    </>
  );
}
