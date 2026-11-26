// The journey engine (CLAUDE.md section 173). Runs from the 15-minute cron. Pull model: for each enrolled customer it computes
// what is due from real facts, applies the frequency limits, and sends at most ONE optional email per customer per run.
// Modes: off (nothing), dry_run (records what it WOULD send, sends nothing), live (needs founder approval, confirmed senders, confirmed inbox).
import { getDbFromEnv } from "@/lib/db";
import { emailConfigured } from "@/lib/email/credentials";
import { sendEmailDetailed } from "@/lib/forms/email";
import { SITE } from "@/lib/system-emails/brand";
import { getBranding } from "@/lib/system-emails/branding";
import { exampleVars, getEditable } from "@/lib/system-emails/store";
import { renderEmail } from "@/lib/system-emails/render";
import { systemVars } from "@/lib/system-emails/mail";
import { REAL_NETWORKS, REPLY_TO, SERVICE_SLUGS, fromHeader } from "./config";
import { buildVars, gatherFacts, getCustomer, lc, rowToCustomer, type Customer } from "./data";
import { choose, plan } from "./journey";
import { recommend, toCard, productUrl, type RecKind } from "./recs";
import { loadCs, type CsSettings } from "./settings";
import { FOUNDER_TEMPLATES, INTERNAL_TEMPLATES } from "./templates";

type Env = CloudflareEnv;
const meta = new Map(FOUNDER_TEMPLATES.map((t) => [t.key, t.founder!]));
const metaList = FOUNDER_TEMPLATES.map((t) => ({ key: t.key, f: t.founder! }));
const num = (n: string) => FOUNDER_TEMPLATES.find((t) => t.founder?.id === `CS-${n}`)!.key;
const RECS: Record<string, RecKind> = { [num("20")]: "general", [num("21")]: "country", [num("22")]: "industry", [num("24")]: "general" };

export type SendResult = { ok: boolean; reason?: string; providerId?: string; subject?: string };
export const senderOf = (key: string, s: CsSettings) => (s.senderOverride[key] ?? meta.get(key)?.sender ?? "A") as "A" | "B" | "C";

/** Renders and (unless `dryRender`) sends one founder email. Every refusal has a plain reason. */
export async function sendFounder(env: Env, c: Customer, key: string, reference: string, s: CsSettings, o: { to?: string; test?: boolean; dryRender?: boolean; vars?: Record<string, string | undefined> } = {}): Promise<SendResult> {
  const def = FOUNDER_TEMPLATES.find((t) => t.key === key);
  if (!def?.founder) return { ok: false, reason: "unknown template" };
  const db = getDbFromEnv(env);
  const t = await getEditable(db, key);
  if (!t) return { ok: false, reason: "template not found" };
  const now = Math.floor(Date.now() / 1000);
  const { facts, prefs } = await gatherFacts(env, c, now);
  const vars = await buildVars(env, c, key, reference, facts, o.vars);
  // Real, on-sale recommendations only (never fictional, unavailable or already owned).
  const owned = (await import("./data")).ownedSlugs;
  let cards: ReturnType<typeof toCard>[] = [];
  if (RECS[key]) {
    const picks = recommend(await owned(env, c.email), { kind: RECS[key], override: c.recOverride, prefCountries: prefs.countries, prefIndustries: prefs.industries });
    if (!picks.length && !o.test) return { ok: false, reason: "no real recommendation available" };
    cards = picks.length ? picks.map(toCard) : [{ name: "Example database", meta: "Example | Test only", url: `${SITE}/lists`, records: "1,000", price: "$99" }];
    vars.recommended_products = cards.map((x) => x.name).join(", ");
    if (picks[0]) {
      vars.recommended_product_name = picks[0].name; vars.recommended_url = productUrl(picks[0]);
      if (RECS[key] === "country") vars.related_country = (await import("@/lib/catalog")).getCountry(picks[0].countrySlug)?.name;
      if (RECS[key] === "industry") vars.related_industry = (await import("@/lib/catalog")).getCategory(picks[0].categorySlug)?.name;
    }
  }
  await addResource(env, key, reference, vars);
  await addReward(env, c, key, reference, vars);
  // A test email fills every value the customer does not have with a labelled example, so the whole layout can be reviewed.
  const ex = o.test ? Object.fromEntries(Object.entries(exampleVars(def)).filter(([k]) => !vars[k]?.trim())) : {};
  const all = { ...systemVars(), ...ex, ...vars };
  if (def.required.some((k) => !all[k]?.trim())) return { ok: false, reason: `a required value is missing (${def.required.filter((k) => !all[k]?.trim()).join(", ")})` };
  const br = await getBranding(db);
  const r = renderEmail(t.published, all, { branding: br, founder: def.founder, cards });
  if (r.issues.missing.length || r.issues.unknown.length || r.issues.badUrl || !r.subject) return { ok: false, reason: `render check failed (${[...r.issues.missing, ...r.issues.unknown].join(", ") || "unsafe link"})` };
  if (o.dryRender) return { ok: true, subject: r.subject };
  if (!(await emailConfigured(env))) return { ok: false, reason: "email sending is not configured" };
  const sid = senderOf(key, s);
  const opt = def.founder.klass === "lifecycle" || def.founder.klass === "promotional";
  const un = all.unsubscribe_url;
  const res = await sendEmailDetailed(env, {
    to: o.to ?? c.email, subject: o.test ? `[TEST] ${r.subject}` : r.subject, text: r.text, html: r.html, templateKey: key, reference, source: o.test ? "test" : "live",
    from: fromHeader(sid), replyTo: REPLY_TO,
    ...(opt && un ? { headers: { "List-Unsubscribe": `<${un}>, <mailto:hello@beigeleads.com?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
  });
  return res.ok ? { ok: true, providerId: res.id, subject: r.subject } : { ok: false, reason: res.error ?? "the email service refused the message" };
}

async function addResource(env: Env, key: string, reference: string, vars: Record<string, string | undefined>) {
  const f = meta.get(key); if (!f) return;
  if (!f.resourceCta && !["CS-13", "CS-14", "CS-17"].includes(f.id)) return;
  try {
    const row = f.id === "CS-17" && reference !== "-"
      ? await env.DB.prepare("SELECT slug, title, kind FROM blog_posts WHERE slug = ? AND status = 'published' AND noindex = 0").bind(reference).first<{ slug: string; title: string; kind: string }>()
      : await env.DB.prepare("SELECT slug, title, kind FROM blog_posts WHERE status = 'published' AND noindex = 0 AND kind IN ('guide','blog') ORDER BY (kind = 'guide') DESC, published_at DESC LIMIT 1").first<{ slug: string; title: string; kind: string }>();
    if (row) { vars.resource_title = row.title; vars.resource_url = `${SITE}/${row.kind === "guide" ? "guides" : "blog"}/${row.slug}`; }
  } catch { /* no resource: the CTA falls back to Reply to Anus, or the send is refused when the template needs one */ }
}
async function addReward(env: Env, c: Customer, key: string, reference: string, vars: Record<string, string | undefined>) {
  if (![num("19"), num("23")].includes(key)) return;
  try {
    const r = await env.DB.prepare("SELECT code, percent, expires_at, max_discount_cents FROM reward_codes WHERE lower(email) = ? AND code = ? AND status = 'active' AND expires_at > unixepoch()").bind(lc(c.email), reference).first<{ code: string; percent: number; expires_at: number; max_discount_cents: number | null }>();
    if (!r) return;
    vars.discount_code = r.code; vars.discount_percentage = `${r.percent}%`;
    vars.discount_expiration = new Date(r.expires_at * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
    vars.discount_terms = `Valid for one order on eligible databases${r.max_discount_cents ? ` (up to $${Math.floor(r.max_discount_cents / 100)} off)` : ""}. Single use, tied to your email address. Cannot be combined with other discounts.`;
  } catch { /* no valid code: the email's required values stop the send */ }
}

/** Internal team notices. Never carry a customer email address, only a reference and plain facts. */
export async function notifyInternal(env: Env, key: string, ref: string, details: string): Promise<boolean> {
  if (!env.NOTIFY_EMAIL) return false;
  const def = INTERNAL_TEMPLATES.find((t) => t.key === key);
  if (!def) return false;
  try {
    const t = await getEditable(getDbFromEnv(env), key);
    const r = renderEmail(t?.published ?? def.content, { ...systemVars(), request_reference: ref, details, admin_url: `${SITE}/admin/customer-success`, timestamp: new Date().toISOString() }, {});
    if (r.issues.missing.length || r.issues.badUrl) return false;
    return (await sendEmailDetailed(env, { to: env.NOTIFY_EMAIL, subject: `[BeigeLeads] ${r.subject}`, text: r.text, html: r.html, templateKey: key, reference: ref })).ok;
  } catch { return false; }
}

/** Customers with a paid real-money order who are not enrolled yet. Enrolment needs the founder's switch; past customers always need an explicit approval. */
export async function enrolNew(env: Env, s: CsSettings): Promise<number> {
  if (!s.autoEnrollNew || !s.enrollFrom) return 0;
  const svc = SERVICE_SLUGS.map((x) => `'${x}'`).join(",");
  const net = REAL_NETWORKS.map((x) => `'${x}'`).join(",");
  try {
    const r = await env.DB.prepare(`SELECT DISTINCT lower(o.email) AS e FROM orders o WHERE o.status = 'paid' AND o.paid_at >= ?
      AND EXISTS (SELECT 1 FROM payment_attempts a WHERE a.order_id = o.id AND a.status = 'paid' AND a.network IN (${net}))
      AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.product_slug NOT IN (${svc}))
      AND NOT EXISTS (SELECT 1 FROM cs_customers c WHERE c.email = lower(o.email)) LIMIT 50`).bind(s.enrollFrom).all<{ e: string }>();
    let n = 0;
    for (const x of r.results ?? []) { const q = await env.DB.prepare("INSERT OR IGNORE INTO cs_customers (email, enrolled_by) VALUES (?, 'auto')").bind(x.e).run(); n += q.meta.changes ?? 0; }
    return n;
  } catch { return 0; }
}
export async function enrolEmail(env: Env, email: string, actor: string, firstName = ""): Promise<{ ok: boolean; error?: string }> {
  const e = lc(email);
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(e)) return { ok: false, error: "Enter one valid email address." };
  try {
    await env.DB.prepare("INSERT INTO cs_customers (email, first_name, enrolled_by) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET status = CASE WHEN status = 'cancelled' THEN 'active' ELSE status END").bind(e, firstName.trim().slice(0, 60), actor.slice(0, 80)).run();
    return { ok: true };
  } catch { return { ok: false, error: "Could not enrol. Has migration 0052 been run?" }; }
}

/** Why a founder email may not go to a customer yet (live mode, founder approval, confirmed sender and inbox). null = allowed. */
export async function gateReason(env: Env, s: CsSettings, key: string): Promise<string | null> {
  if (s.mode !== "live") return s.mode === "off" ? "Customer Success is switched off" : "dry-run mode sends nothing";
  const ed = await getEditable(getDbFromEnv(env), key);
  if (!ed) return "template missing";
  if (s.approved[key] !== ed.version) return "not approved at its current version";
  if (!s.sendersConfirmed[senderOf(key, s)]) return "sender not confirmed";
  if (!s.replyInboxConfirmed) return "reply inbox not confirmed";
  return null;
}

export type RunReport = { mode: string; customers: number; planned: number; sent: number; failed: number; blocked: number; notes: string[] };
export async function runJourneys(env: Env, o: { now?: number; mode?: CsSettings["mode"] } = {}): Promise<RunReport> {
  const s = await loadCs(env);
  const mode = o.mode ?? s.mode;
  const rep: RunReport = { mode, customers: 0, planned: 0, sent: 0, failed: 0, blocked: 0, notes: [] };
  if (mode === "off") return rep;
  const now = o.now ?? Math.floor(Date.now() / 1000);
  await enrolNew(env, s);
  let rows: Record<string, unknown>[] = [];
  try { rows = (await env.DB.prepare("SELECT * FROM cs_customers WHERE status = 'active' ORDER BY last_run_at ASC LIMIT ?").bind(s.maxPerRun).all<Record<string, unknown>>()).results ?? []; } catch { rep.notes.push("cs_customers is missing: run migration 0052."); return rep; }
  for (const row of rows) {
    const c = rowToCustomer(row); rep.customers++;
    try {
      const { facts } = await gatherFacts(env, c, now);
      const { due } = plan(metaList, facts, s);
      const { pick } = choose(due, meta, facts, s);
      await env.DB.prepare("UPDATE cs_customers SET last_run_at = ? WHERE id = ?").bind(now, c.id).run();
      if (!pick) continue;
      rep.planned++;
      if (mode === "dry_run") { await env.DB.prepare("INSERT INTO cs_events (customer_id, kind, detail, actor, created_at) VALUES (?, 'dry_run', ?, 'engine', ?)").bind(c.id, `${pick.key} (${pick.reference})`, now).run(); continue; }
      // Live: founder approval, confirmed sender and inbox, template enabled. Anything missing = held, with a reason.
      if (await gateReason(env, { ...s, mode: "live" }, pick.key)) { rep.blocked++; continue; }
      const ins = await env.DB.prepare("INSERT OR IGNORE INTO cs_scheduled (customer_id, template_key, reference, status, sender, attempts, created_at, updated_at) VALUES (?, ?, ?, 'scheduled', ?, 1, ?, ?)").bind(c.id, pick.key, pick.reference, senderOf(pick.key, s), now, now).run();
      if (!ins.meta.changes) {
        const re = await env.DB.prepare("UPDATE cs_scheduled SET status = 'scheduled', attempts = attempts + 1, updated_at = ? WHERE customer_id = ? AND template_key = ? AND reference = ? AND status = 'failed' AND attempts < 3 AND updated_at < ?").bind(now, c.id, pick.key, pick.reference, now - 3600).run();
        if (!re.meta.changes) continue;
      }
      const res = await sendFounder(env, c, pick.key, pick.reference, s);
      if (res.ok) { rep.sent++; await env.DB.prepare("UPDATE cs_scheduled SET status = 'sent', sent_at = ?, provider_id = ?, reason = '', updated_at = ? WHERE customer_id = ? AND template_key = ? AND reference = ?").bind(now, res.providerId ?? "", now, c.id, pick.key, pick.reference).run(); }
      else {
        rep.failed++;
        const refused = /missing|no real|render check|not configured/.test(res.reason ?? "");
        await env.DB.prepare("UPDATE cs_scheduled SET status = ?, reason = ?, updated_at = ? WHERE customer_id = ? AND template_key = ? AND reference = ?").bind(refused ? "skipped" : "failed", (res.reason ?? "").slice(0, 200), now, c.id, pick.key, pick.reference).run();
        if (!refused) await notifyInternal(env, "csi4_journey_failed", `JF-${c.id}-${pick.key.slice(0, 4)}`, `${pick.key} could not be sent: ${res.reason ?? "unknown"}.`);
      }
    } catch (e) { rep.failed++; rep.notes.push(`customer ${c.id}: ${(e as Error).message.slice(0, 80)}`); }
  }
  return rep;
}

export { getCustomer };
