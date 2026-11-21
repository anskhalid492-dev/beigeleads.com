import type { Metadata } from "next";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { desc, eq } from "drizzle-orm";
import { CopyReview, OnboardingForm, CancelRequest } from "@/components/dfy/order-client";
import { getDbFromEnv, schema } from "@/lib/db";
import { assetsOf, getDfyByToken, latestCopy, STOP_RULES } from "@/lib/dfy/store";
import { LABEL, STAGES, isStage } from "@/lib/dfy/state";
import { loadDfySettings } from "@/lib/dfy/settings";

import { fitMeta } from "@/lib/seo/fit";
export const dynamic = "force-dynamic";
const metadataRaw: Metadata = { title: "Your DFY Outbound order", robots: { index: false, follow: false }, referrer: "no-referrer" };
const card = "mt-6 rounded-2xl border border-sand-200 bg-white p-5 sm:p-6";
const OWN: Record<string, string> = { not_started: "Not started", preparing: "Preparing", ready: "Ready", transferred: "Transferred", restricted: "Limited by provider rules" };

export default async function DfyOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { env } = getCloudflareContext();
  const row = await getDfyByToken(env, token).catch(() => null);
  if (!row) return <Shell><p role="alert" className={card}>This link is not valid. Use the link from your email.</p></Shell>;
  const db = getDbFromEnv(env);
  const s = await loadDfySettings(env);
  const [assets, copy, reports] = await Promise.all([assetsOf(db, row.id), latestCopy(db, row.id), db.select().from(schema.dfyMetrics).where(eq(schema.dfyMetrics.dfyId, row.id)).orderBy(desc(schema.dfyMetrics.id))]);
  const stage = isStage(row.status) ? row.status : "awaiting_payment";
  const idx = STAGES.indexOf(stage);
  const paid = !!row.paidAt;
  let cap: { domains?: number; inboxes?: number } = {}; try { cap = row.capacityJson ? (JSON.parse(row.capacityJson) as typeof cap) : {}; } catch { /* none */ }
  let own: { status?: string } = {}; try { own = row.ownershipJson ? (JSON.parse(row.ownershipJson) as typeof own) : {}; } catch { /* none */ }
  const submitted = copy.filter((c) => c.status === "submitted");
  return (
    <Shell>
      <dl className="mt-6 grid gap-3 rounded-2xl border border-sand-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-forest-500">Order</dt><dd className="font-mono font-semibold text-forest-900">{row.id}</dd></div>
        <div><dt className="text-forest-500">Stage</dt><dd className="font-semibold text-forest-900">{LABEL[stage]}</dd></div>
        <div><dt className="text-forest-500">Package</dt><dd className="font-semibold text-forest-900">{row.packageName} · ${(row.monthlyCents / 100).toLocaleString("en-US")} one-time</dd></div>
        <div><dt className="text-forest-500">Allocation</dt><dd className="font-semibold text-forest-900">{row.leads.toLocaleString("en-US")} leads · {row.initialSends.toLocaleString("en-US")} initial sends · {row.followups} follow-ups</dd></div>
        <div><dt className="text-forest-500">Domains / inboxes</dt><dd className="font-semibold text-forest-900">{row.capacityApproved && cap.domains ? `${cap.domains} / ${cap.inboxes} (confirmed)` : `${row.domainsEst} / ${row.inboxesEst} (estimates, not yet confirmed)`}</dd></div>
      </dl>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-sand-200" role="progressbar" aria-valuenow={Math.max(0, Math.min(idx, 15))} aria-valuemin={0} aria-valuemax={15} aria-label="Progress"><div className="h-full bg-forest-500" style={{ width: `${Math.round((Math.min(idx, 15) / 15) * 100)}%` }} /></div>
      {!paid && <p role="status" className={card}>Your payment is not confirmed yet. This page unlocks as soon as it is.</p>}
      {stage === "cancelled" && <p role="status" className={card}>This service is cancelled.</p>}
      {stage === "awaiting_onboarding" && <section className={card}><h2 className="text-xl font-bold text-forest-900">Tell us about your outbound</h2><div className="mt-4"><OnboardingForm token={token} /></div></section>}
      {stage === "onboarding_submitted" && <p role="status" className={card}>Thanks, we received your onboarding. We are planning your infrastructure.</p>}
      {submitted.length > 0 && <section className={card}><h2 className="text-xl font-bold text-forest-900">Copy waiting for your approval</h2><p className="mt-1 text-sm">Nothing is sent until you approve.</p>
        <div className="mt-4 space-y-3">{submitted.map((c) => <article key={c.id} className="rounded-xl bg-sand-100 p-4 text-sm"><p className="font-semibold text-forest-900">{c.kind === "initial" ? "Initial message" : `Follow-up ${c.step - 1}`} · variant {c.variant}</p>{c.subject && <p className="mt-1">Subject: {c.subject}</p>}<p className="mt-2 whitespace-pre-wrap">{c.body}</p></article>)}</div><CopyReview token={token} /></section>}
      {assets.length > 0 && <section className={card}><h2 className="text-xl font-bold text-forest-900">Infrastructure status</h2><ul className="mt-3 divide-y divide-sand-200 text-sm">{assets.map((a) => <li key={a.id} className="flex justify-between gap-3 py-2"><span>{a.kind === "domain" ? "Domain" : "Inbox"}: {a.name}</span><span className="font-semibold capitalize text-forest-900">{a.status === "verified" ? "Ready (verified)" : a.status}</span></li>)}</ul></section>}
      {reports.some((r) => r.published) && <section className={card}><h2 className="text-xl font-bold text-forest-900">Reports</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><thead><tr className="border-b border-sand-200">{["Period", "Sourced", "Verified", "Contacted", "Initial", "Follow-up", "Failures", "Replies", "Interested", "Opt-outs", "Meetings"].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead><tbody>{reports.filter((r) => r.published).map((r) => <tr key={r.id} className="border-b border-sand-100">{[r.period, r.sourced, r.verified, r.contacted, r.initialSends, r.followupSends, r.failures, r.replies, r.interested, r.optouts, r.meetings].map((v, i) => <td key={i} className="py-2 pr-3">{typeof v === "number" ? v.toLocaleString("en-US") : v}</td>)}</tr>)}</tbody></table></div></section>}
      {row.ownership === 1 && <section className={card}><h2 className="text-xl font-bold text-forest-900">Infrastructure ownership</h2><p className="mt-2 text-sm">Status: <strong>{OWN[own.status ?? "not_started"] ?? "Not started"}</strong>. Transfers follow provider rules. We never send passwords by email.</p></section>}
      {paid && !["cancelled"].includes(stage) && <section className={card}><h2 className="text-xl font-bold text-forest-900">Billing</h2><p className="mt-2 text-sm">{s.billingTerms}</p><div className="mt-4"><CancelRequest token={token} cancelRequested={!!row.cancelRequested} /></div>{!!row.cancelRequested && <p className="mt-3 text-sm">Cancellation requested. Our team will confirm it by email.</p>}</section>}
      <p className="mt-8 text-xs">Sending stops for a contact when {STOP_RULES.join(", ")}. We do not promise inbox placement, replies, meetings or revenue. Need help? <a className="underline" href={`mailto:${s.supportEmail || "support@beigeleads.com"}?subject=${row.id}`}>Email support</a> and quote {row.id}.</p>
    </Shell>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return <section className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6"><h1 className="display text-5xl text-forest-900 sm:text-6xl">Your DFY Outbound order</h1>{children}</section>;
}

export const metadata: Metadata = fitMeta(metadataRaw);
