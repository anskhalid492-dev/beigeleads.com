// Reads the real facts for one customer (D1) and turns them into the pure `Facts` the journey rules use. Never invents data.
import { hydrateCatalog } from "@/lib/catalog-db";
import { getProduct } from "@/lib/catalog";
import { emailHash, optoutToken } from "@/lib/followups/tokens";
import { SITE } from "@/lib/system-emails/brand";
import { REAL_NETWORKS, SERVICE_SLUGS } from "./config";
import type { Facts, Sent } from "./journey";
import { replyUrl } from "./render";
import { FOUNDER_TEMPLATES } from "./templates";

type Env = Pick<CloudflareEnv, "DB"> & Partial<Pick<CloudflareEnv, "HASH_SALT" | "CACHE">>;
export type Customer = { id: number; email: string; firstName: string; company: string; status: "active" | "paused" | "cancelled"; enrolledAt: number; interests: string; recOverride: string[] };
const D = 86400;
const SVC = SERVICE_SLUGS.map((s) => `'${s}'`).join(",");
const NET = REAL_NETWORKS.map((s) => `'${s}'`).join(",");
export const lc = (s: string) => s.trim().toLowerCase();

export type PrefRow = { recs: boolean; products: boolean; founder: boolean; education: boolean; offers: boolean; frequency: "normal" | "less"; countries: string[]; industries: string[]; unsubAll: boolean };
export const DEFAULT_PREFS: PrefRow = { recs: true, products: true, founder: true, education: true, offers: true, frequency: "normal", countries: [], industries: [], unsubAll: false };

export async function loadPrefs(env: Env, email: string): Promise<PrefRow> {
  try {
    const r = await env.DB.prepare("SELECT * FROM cs_prefs WHERE email_hash = ?").bind(await emailHash(env, email)).first<Record<string, unknown>>();
    let optedOut = false;
    try { optedOut = !!(await env.DB.prepare("SELECT 1 AS x FROM courtesy_optouts WHERE email_hash = ?").bind(await emailHash(env, email)).first()); } catch { /* table missing */ }
    if (!r) return { ...DEFAULT_PREFS, unsubAll: optedOut };
    const l = (v: unknown) => String(v ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    return { recs: !!r.recs, products: !!r.products, founder: !!r.founder, education: !!r.education, offers: !!r.offers, frequency: r.frequency === "less" ? "less" : "normal", countries: l(r.countries), industries: l(r.industries), unsubAll: !!r.unsub_all || optedOut };
  } catch { return { ...DEFAULT_PREFS, unsubAll: true }; } // unknown = do not send optional email
}

type OrderRow = { id: string; paid_at: number };
export async function realOrders(env: Env, email: string): Promise<OrderRow[]> {
  try {
    const r = await env.DB.prepare(`SELECT o.id AS id, o.paid_at AS paid_at FROM orders o WHERE lower(o.email) = ? AND o.status = 'paid' AND o.paid_at IS NOT NULL
      AND EXISTS (SELECT 1 FROM payment_attempts a WHERE a.order_id = o.id AND a.status = 'paid' AND a.network IN (${NET}))
      AND EXISTS (SELECT 1 FROM order_items i WHERE i.order_id = o.id AND i.product_slug NOT IN (${SVC})) ORDER BY o.paid_at ASC`).bind(lc(email)).all<OrderRow>();
    return r.results ?? [];
  } catch { return []; }
}
export async function ownedSlugs(env: Env, email: string): Promise<string[]> {
  try {
    const r = await env.DB.prepare(`SELECT DISTINCT i.product_slug AS s FROM order_items i JOIN orders o ON o.id = i.order_id WHERE lower(o.email) = ? AND o.status = 'paid'`).bind(lc(email)).all<{ s: string }>();
    return (r.results ?? []).map((x) => x.s).filter((s) => !(SERVICE_SLUGS as readonly string[]).includes(s));
  } catch { return []; }
}

export async function getCustomer(env: Env, id: number): Promise<Customer | null> {
  try {
    const r = await env.DB.prepare("SELECT * FROM cs_customers WHERE id = ?").bind(id).first<Record<string, unknown>>();
    return r ? rowToCustomer(r) : null;
  } catch { return null; }
}
export function rowToCustomer(r: Record<string, unknown>): Customer {
  let ov: string[] = []; try { const j = JSON.parse(String(r.rec_override_json || "[]")); if (Array.isArray(j)) ov = j.filter((x) => typeof x === "string").slice(0, 3); } catch { /* none */ }
  return { id: Number(r.id), email: String(r.email), firstName: String(r.first_name ?? ""), company: String(r.company ?? ""), status: (["paused", "cancelled"].includes(String(r.status)) ? String(r.status) : "active") as Customer["status"], enrolledAt: Number(r.enrolled_at ?? 0), interests: String(r.interests_json ?? ""), recOverride: ov };
}

/** Everything the rules need. Each query is isolated: a missing table means "no data", never a crash and never an invented value. */
export async function gatherFacts(env: Env, c: Customer, now: number): Promise<{ facts: Facts; prefs: PrefRow }> {
  const q = async <T>(sql: string, ...b: unknown[]): Promise<T[]> => { try { return ((await env.DB.prepare(sql).bind(...b).all<T>()).results ?? []) as T[]; } catch { return []; } };
  const orders = await realOrders(env, c.email);
  const prefs = await loadPrefs(env, c.email);
  const hist = await q<{ template_key: string; reference: string; status: string; sent_at: number | null; created_at: number }>("SELECT template_key, reference, status, sent_at, created_at FROM cs_scheduled WHERE customer_id = ?", c.id);
  const history: Sent[] = hist.map((h) => ({ key: h.template_key, reference: h.reference, status: (["sent", "scheduled", "failed", "skipped", "cancelled"].includes(h.status) ? h.status : "skipped") as Sent["status"], at: h.sent_at ?? h.created_at, reactivation: FOUNDER_TEMPLATES.find((t) => t.key === h.template_key)?.founder?.reactivation }));
  const first = orders[0];
  const ful = first ? await q<{ sent_at: number | null }>("SELECT sent_at FROM deliveries WHERE order_id = ? AND status = 'sent'", first.id) : [];
  const firstFulfilledAt = ful[0]?.sent_at ?? null;
  const fb = await q<{ reference: string; satisfaction: number; wants_help: number; status: string; created_at: number }>("SELECT reference, satisfaction, wants_help, status, created_at FROM cs_feedback WHERE lower(email) = ? ORDER BY created_at DESC", lc(c.email));
  const inq = await q<{ reference: string; status: string; created_at: number; updated_at: number | null }>("SELECT reference, status, created_at, updated_at FROM contact_inquiries WHERE lower(email) = ?", lc(c.email));
  const evs = await q<{ kind: string; created_at: number }>("SELECT kind, created_at FROM cs_events WHERE customer_id = ?", c.id);
  const shared = (k: string) => evs.some((e) => e.kind === `shared:${k}`);
  const lastPaidAt = orders.length ? orders[orders.length - 1]!.paid_at : null;
  const lastEngaged = Math.max(0, ...evs.filter((e) => e.kind === "reply").map((e) => e.created_at), ...fb.map((f) => f.created_at));
  const events: Facts["events"] = {};
  const add = (k: string, reference: string, dueAt: number) => { (events[k] ??= []).push({ reference, dueAt }); };
  const k = (n: string) => FOUNDER_TEMPLATES.find((t) => t.founder?.id === `CS-${n}`)!.key;
  // 26 / 27: feedback
  for (const f of fb) add(f.wants_help ? k("27") : k("26"), f.reference, f.created_at);
  // 28: resolved cases, three days later, not if they wrote again since
  for (const i of inq) if (i.status === "resolved" && i.updated_at) add(k("28"), i.reference, i.updated_at + 3 * D);
  for (const f of fb) if (f.wants_help && f.status === "resolved") add(k("28"), f.reference, f.created_at + 3 * D);
  // 29 / 30: milestones
  if (orders[1]) add(k("29"), "-", orders[1].paid_at + D);
  if (orders[2]) add(k("30"), "-", orders[2].paid_at + D);
  // 31 / 32 / 33: inactivity since the last purchase (a purchase or reply resets it)
  if (lastPaidAt && lastEngaged <= lastPaidAt) { add(k("31"), String(lastPaidAt), lastPaidAt + 90 * D); add(k("32"), String(lastPaidAt), lastPaidAt + 120 * D); add(k("33"), String(lastPaidAt), lastPaidAt + 180 * D); }
  // 19 / 23: the customer's REAL second-purchase code (this system never creates a discount)
  const rw = await q<{ code: string; created_at: number; expires_at: number; status: string }>("SELECT code, created_at, expires_at, status FROM reward_codes WHERE lower(email) = ?", lc(c.email));
  const r0 = rw[0];
  if (r0 && r0.status === "active" && orders.length < 2) {
    if (r0.expires_at - now >= 3 * D) add(k("19"), r0.code, r0.created_at + 3 * D);
    const s19 = history.find((h) => h.key === k("19") && h.status === "sent");
    if (s19 && r0.expires_at - now >= 2 * D) add(k("23"), r0.code, s19.at + 5 * D);
  }
  // 17: published articles of the last 14 days, at least 14 days after the first delivery
  const arts = await q<{ slug: string; kind: string; published_at: number }>("SELECT slug, kind, published_at FROM blog_posts WHERE status = 'published' AND published_at IS NOT NULL AND published_at > ? AND noindex = 0 ORDER BY published_at DESC LIMIT 3", now - 14 * D);
  for (const a of arts) add(k("17"), a.slug, Math.max(a.published_at, (firstFulfilledAt ?? now) + 14 * D));
  // 34: founder updates approved by an administrator in the last 14 days
  const ups = await q<{ id: number; approved_at: number }>("SELECT id, approved_at FROM cs_updates WHERE approved_at > ? ORDER BY approved_at DESC LIMIT 2", now - 14 * D);
  for (const u of ups) add(k("34"), String(u.id), u.approved_at);
  // 36: only after the reactivation attempts reached the limit
  const reacts = history.filter((h) => h.reactivation && h.status === "sent" && h.key !== k("36") && h.at > (lastPaidAt ?? 0)).length;
  if (lastPaidAt && reacts >= 2) add(k("36"), "-", now);
  // 24: genuinely new on-sale products (first seen after the founder enabled enrolment)
  const hasResource = ((await q<{ n: number }>("SELECT COUNT(*) AS n FROM blog_posts WHERE status = 'published' AND kind IN ('guide','blog') AND noindex = 0"))[0]?.n ?? 0) > 0;
  const facts: Facts = {
    now, customer: { status: c.status, enrolledAt: c.enrolledAt }, firstPaidAt: first?.paid_at ?? null, firstFulfilledAt, paidAts: orders.map((o) => o.paid_at), lastPaidAt, history,
    unsubscribedAll: prefs.unsubAll, prefs: { recs: prefs.recs, products: prefs.products, founder: prefs.founder, education: prefs.education, offers: prefs.offers }, frequency: prefs.frequency,
    supportOpen: inq.some((i) => i.status === "new" || i.status === "in_progress") || fb.some((f) => f.wants_help && (f.status === "new" || f.status === "in_progress")),
    unhappy: fb.some((f) => f.satisfaction <= 2 && f.status !== "resolved" && f.status !== "closed"), feedbackGiven: fb.length > 0,
    shared: { business: shared("business"), audience: shared("audience") || prefs.countries.length > 0 || prefs.industries.length > 0, goals: shared("goals") },
    hasResource, segmentation: orders.length > 0, events,
  };
  return { facts, prefs };
}

/** Variables for one email. A value that cannot be known is left OUT, so the renderer drops it or the send is refused: never a placeholder. */
export async function buildVars(env: Env, c: Customer, key: string, reference: string, facts: Facts, extra: Record<string, string | undefined> = {}): Promise<Record<string, string | undefined>> {
  await hydrateCatalog(env as CloudflareEnv).catch(() => undefined);
  const t = FOUNDER_TEMPLATES.find((x) => x.key === key)!;
  const tok = await optoutToken(env, c.email);
  const e = encodeURIComponent(lc(c.email));
  const base = `${SITE}/email-preferences?e=${e}&t=${tok}`;
  const owned = await ownedSlugs(env, c.email);
  const last = owned.length ? getProduct(owned[owned.length - 1]!) : undefined;
  const orders = await realOrders(env, c.email);
  const total = (await env.DB.prepare("SELECT COALESCE(SUM(total_usd_cents),0) AS t FROM orders WHERE lower(email) = ? AND status = 'paid'").bind(lc(c.email)).first<{ t: number }>().catch(() => null))?.t ?? 0;
  const ref = orders[orders.length - 1]?.id ?? "";
  const days = facts.firstFulfilledAt ? Math.floor((facts.now - facts.firstFulfilledAt) / D) : facts.firstPaidAt ? Math.floor((facts.now - facts.firstPaidAt) / D) : undefined;
  const fmtDate = (s: number) => new Date(s * 1000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const subject = t.founder!.reply?.subject ?? "BeigeLeads";
  return {
    first_name: c.firstName || undefined, customer_name: c.firstName || undefined, customer_email: undefined, // never printed in the body
    product_name: last?.name, product_industry: undefined, order_id: ref || undefined,
    purchase_date: facts.firstPaidAt ? fmtDate(facts.firstPaidAt) : undefined, fulfillment_date: facts.firstFulfilledAt ? fmtDate(facts.firstFulfilledAt) : undefined,
    days_since_purchase: days != null ? String(days) : undefined, last_purchase_date: facts.lastPaidAt ? fmtDate(facts.lastPaidAt) : undefined, total_orders: String(orders.length),
    customer_lifetime_value: total ? `$${(total / 100).toLocaleString("en-US")}` : undefined,
    reply_url: replyUrl(subject.replace("{{support_reference}}", extra.support_reference ?? ""), ref ? `Order reference: ${ref}\n\n` : undefined),
    preferences_url: base, unsubscribe_url: `${SITE}/api/unsubscribe?e=${e}&t=${tok}`,
    feedback_url: `${SITE}/customer-feedback?e=${e}&t=${tok}${ref ? `&o=${encodeURIComponent(ref)}` : ""}`,
    support_url: `${SITE}/contact`,
    ...extra,
  };
}
