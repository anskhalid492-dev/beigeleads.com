"use server";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv } from "@/lib/db";
import { resolveResend } from "@/lib/email/credentials";
import { checkKey } from "@/lib/email/resend-api";
import { enrolEmail, runJourneys, sendFounder } from "@/lib/founder/engine";
import { SENDERS } from "@/lib/founder/config";
import { getCustomer } from "@/lib/founder/data";
import { recordReply, setNote, setRecOverride, setStatus, skipEmail } from "@/lib/founder/events";
import { goLiveBlockers, loadCs, saveCs } from "@/lib/founder/settings";
import { FOUNDER_TEMPLATES } from "@/lib/founder/templates";
import { getEditable, listEditable } from "@/lib/system-emails/store";

const go = (tab: string, msg: string, extra = ""): never => redirect(`/admin/customer-success?tab=${tab}${extra}&msg=${encodeURIComponent(msg)}`);
const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const on = (f: FormData, k: string) => f.get(k) === "on";
const keyOf = (f: FormData) => { const k = s(f, "key"); if (!FOUNDER_TEMPLATES.some((t) => t.key === k)) go("journeys", "Unknown email."); return k; };

export async function saveModeAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const mode = s(f, "mode") as "off" | "dry_run" | "live";
  if (!["off", "dry_run", "live"].includes(mode)) go("settings", "Unknown mode.");
  const cur = await loadCs(env);
  if (mode === "live") {
    const ed = await listEditable(getDbFromEnv(env));
    const enabled = FOUNDER_TEMPLATES.filter((t) => cur.enabled[t.key]).map((t) => t.key);
    const bl = goLiveBlockers(cur, Object.fromEntries(enabled.map((k) => [k, ed.get(k)?.version ?? -1])), enabled);
    if (bl.length) go("settings", `Not ready for live sending: ${bl.slice(0, 3).join(" ")}${bl.length > 3 ? ` (+${bl.length - 3} more)` : ""}`);
  }
  const r = await saveCs(env, a.email ?? "admin", { mode }, `mode:${mode}`);
  go("settings", r.ok ? `Mode is now ${mode}.` : r.error);
}

export async function saveSettingsAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const cur = await loadCs(env);
  const auto = on(f, "autoEnrollNew");
  const num = (k: string, d: number) => { const n = Number(s(f, k)); return Number.isFinite(n) ? n : d; };
  const r = await saveCs(env, a.email ?? "admin", {
    sendersConfirmed: { A: on(f, "sA"), B: on(f, "sB"), C: on(f, "sC") }, replyInboxConfirmed: on(f, "inbox"), autoEnrollNew: auto,
    enrollFrom: auto ? (cur.enrollFrom || Math.floor(Date.now() / 1000)) : cur.enrollFrom, maxPerRun: num("maxPerRun", cur.maxPerRun),
    caps: { firstWeekMax: num("firstWeekMax", 2), perWeekMax: num("perWeekMax", 1), per30Max: num("per30Max", 4), minGapHours: num("minGapHours", 72), reactivationMax: num("reactivationMax", 2) },
  }, "settings");
  go("settings", r.ok ? "Saved." : r.error);
}

export async function checkSendersAction() {
  await requireAdmin(); const { env } = getCloudflareContext();
  const cred = await resolveResend(env);
  if (!cred.key) go("settings", "No Resend key is configured (Admin > Settings > Integrations > Resend).");
  const r = await checkKey(cred.key!);
  const names = (r.domains ?? []).filter((d) => d.status === "verified").map((d) => d.name.toLowerCase());
  if (r.state === "valid_sending_only") go("settings", "This is a sending-only key: Resend cannot list domains with it. Confirm the senders by hand after checking the domain in the Resend dashboard.");
  if (!names.length) go("settings", `Resend: ${r.detail || r.state}. No verified domain was listed.`);
  const dom = Object.values(SENDERS).map((x) => x.email.split("@")[1]!);
  const ok = dom.every((d) => names.some((n) => d === n || d.endsWith(`.${n}`)));
  go("settings", ok ? `Resend lists beigeleads.com as a verified domain (${names.join(", ")}). You can now confirm the senders.` : `The sender domain is not in Resend's verified list (${names.join(", ")}).`);
}

export async function saveJourneyAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const key = keyOf(f);
  const cur = await loadCs(env);
  const hours = Number(s(f, "hours"));
  const sender = s(f, "sender");
  const r = await saveCs(env, a.email ?? "admin", {
    enabled: { ...cur.enabled, [key]: on(f, "enabled") },
    delays: Number.isFinite(hours) && hours >= 0 ? { ...cur.delays, [key]: Math.round(hours) } : cur.delays,
    senderOverride: ["A", "B", "C"].includes(sender) ? { ...cur.senderOverride, [key]: sender as "A" } : cur.senderOverride,
  }, `journey:${key}`);
  go("journeys", r.ok ? `Saved ${key}.` : r.error, `#${key}`);
}
export async function approveAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const key = keyOf(f);
  const ed = await getEditable(getDbFromEnv(env), key);
  if (!ed) go("journeys", "Template not found.");
  const cur = await loadCs(env);
  const r = await saveCs(env, a.email ?? "admin", { approved: { ...cur.approved, [key]: ed!.version } }, `approve:${key}`);
  go("journeys", r.ok ? `Approved ${key} at version ${ed!.version}. Any later edit needs a new approval.` : r.error);
}
export async function testSendAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const key = keyOf(f);
  const to = (a.email ?? "").toLowerCase();
  if (!to) go("journeys", "Your admin email is not known.");
  const cust = { id: 0, email: to, firstName: "Alex", company: "", status: "active" as const, enrolledAt: 0, interests: "", recOverride: [] };
  const r = await sendFounder(env, cust, key, `test-${Date.now()}`, await loadCs(env), { to, test: true });
  go("journeys", r.ok ? `Test sent to your own address (${to}). It is labelled [TEST] and uses example values.` : `Test not sent: ${r.reason}`);
}

export async function enrolAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const r = await enrolEmail(env, s(f, "email"), a.email ?? "admin", s(f, "firstName"));
  go("customers", r.ok ? "Customer enrolled." : r.error ?? "Could not enrol.");
}
export async function enrolManyAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  if (!on(f, "approve")) go("customers", "Tick the approval box first. Past customers are never enrolled without it.");
  let n = 0;
  for (const e of f.getAll("e").map(String).slice(0, 200)) if ((await enrolEmail(env, e, `approved:${a.email ?? "admin"}`)).ok) n++;
  go("customers", `${n} customer(s) enrolled with your approval.`);
}
export async function customerAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const id = Number(s(f, "id")); const op = s(f, "op");
  const to = op === "resume" ? "active" : op === "cancel" ? "cancelled" : "paused";
  const ok = await setStatus(env, id, to, a.email ?? "admin", s(f, "reason") || "set by admin");
  go("customers", ok ? `Customer ${to}.` : "Customer not found.", `&c=${id}`);
}
export async function replyAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const id = Number(s(f, "id"));
  const tags = (["business", "audience", "goals"] as const).filter((t) => on(f, t));
  const ok = await recordReply(env, id, a.email ?? "admin", tags, s(f, "note"));
  go("customers", ok ? "Reply recorded. Optional emails are paused until you resume them." : "Customer not found.", `&c=${id}`);
}
export async function skipAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const id = Number(s(f, "id"));
  await skipEmail(env, id, keyOf(f), s(f, "reference") || "-", a.email ?? "admin");
  go("customers", "Email skipped for this customer.", `&c=${id}`);
}
export async function noteAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const id = Number(s(f, "id"));
  await setNote(env, id, s(f, "note"), a.email ?? "admin");
  go("customers", "Note saved.", `&c=${id}`);
}
export async function recsAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext(); const id = Number(s(f, "id"));
  const slugs = s(f, "slugs").split(/[\s,]+/).filter(Boolean);
  await setRecOverride(env, id, slugs, a.email ?? "admin");
  go("customers", "Recommendations saved. Only real, on-sale lists are used; others are ignored.", `&c=${id}`);
}
export async function feedbackStatusAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const st = s(f, "status");
  if (!["new", "in_progress", "resolved", "closed"].includes(st)) go("feedback", "Unknown status.");
  await env.DB.prepare("UPDATE cs_feedback SET status = ?, note = ? WHERE id = ?").bind(st, s(f, "note").slice(0, 1000), Number(s(f, "id"))).run().catch(() => null);
  void a; go("feedback", "Saved.");
}
export async function publishUpdateAction(f: FormData) {
  const a = await requireAdmin(); const { env } = getCloudflareContext();
  const title = s(f, "title"), body = s(f, "body"), url = s(f, "url");
  if (title.length < 3 || body.length < 20) go("settings", "Write a title and an update of at least 20 characters.");
  if (url && !/^https:\/\/beigeleads\.com\//.test(url)) go("settings", "The link must start with https://beigeleads.com/.");
  await env.DB.prepare("INSERT INTO cs_updates (title, body, url, approved_by) VALUES (?, ?, ?, ?)").bind(title.slice(0, 120), body.slice(0, 1500), url, a.email ?? "admin").run().catch(() => null);
  go("settings", "Update approved. Customers who allow founder updates can receive it (email CS-34) when that email is switched on.");
}
export async function runNowAction() {
  await requireAdmin(); const { env } = getCloudflareContext();
  const r = await runJourneys(env, { mode: "dry_run" });
  go("scheduled", `Dry run finished: ${r.customers} customer(s) checked, ${r.planned} email(s) would be sent. Nothing was sent.${r.notes.length ? ` ${r.notes[0]}` : ""}`);
}
export { getCustomer };
