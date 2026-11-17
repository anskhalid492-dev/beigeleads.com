import { desc, eq, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { sendEmail } from "@/lib/forms/email";
import { SITE_URL } from "@/lib/site";

type Env = CloudflareEnv;
const t = schema.newsletterSubscribers;

/** The signup form is shown only when the owner switches it on (var NEWSLETTER_ENABLED=true). */
export const newsletterOn = (env: { NEWSLETTER_ENABLED?: string }) => env.NEWSLETTER_ENABLED === "true";

const newToken = () => { const b = new Uint8Array(24); crypto.getRandomValues(b); return [...b].map((x) => x.toString(16).padStart(2, "0")).join(""); };
export const validToken = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{48}$/.test(v);
export const unsubscribeUrl = (token: string) => `${SITE_URL}/newsletter/unsubscribe?token=${token}`;

/**
 * Starts a double opt-in signup. Always behaves the same for the caller (no hint whether the address already exists).
 * Nobody is "confirmed" until they click the link in the email. Already confirmed addresses are left untouched.
 */
export async function subscribe(env: Env, email: string) {
  const db = getDbFromEnv(env);
  const found = await db.select().from(t).where(eq(t.email, email)).limit(1);
  let token = found[0]?.token ?? newToken();
  if (found[0]?.status === "confirmed") return;
  if (found[0]) await db.update(t).set({ status: "pending", unsubscribedAt: null }).where(eq(t.id, found[0].id));
  else { try { await db.insert(t).values({ email, token }); } catch { token = (await db.select().from(t).where(eq(t.email, email)).limit(1))[0]?.token ?? token; } }
  await sendEmail(env, {
    to: email,
    subject: "Confirm your BeigeLeads blog subscription",
    text: `Someone (hopefully you) asked to get new BeigeLeads articles by email.\n\nConfirm here: ${SITE_URL}/newsletter/confirm?token=${token}\n\nIf this was not you, ignore this email and nothing will be sent.\n\nBeigeLeads LLC, 215 W Pershing Rd, Kansas City, MO 64108`,
  });
}

export async function confirm(env: Env, token: string): Promise<boolean> {
  if (!validToken(token)) return false;
  const r = await getDbFromEnv(env).update(t).set({ status: "confirmed", confirmedAt: new Date(), unsubscribedAt: null }).where(eq(t.token, token)).returning({ id: t.id });
  return r.length > 0;
}

export async function unsubscribe(env: Env, token: string): Promise<boolean> {
  if (!validToken(token)) return false;
  const r = await getDbFromEnv(env).update(t).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(t.token, token)).returning({ id: t.id });
  return r.length > 0;
}

export async function newsletterStats(env: Env) {
  const db = getDbFromEnv(env);
  const [by, recent] = await Promise.all([
    db.select({ status: t.status, n: sql<number>`count(*)` }).from(t).groupBy(t.status),
    db.select({ email: t.email, status: t.status, createdAt: t.createdAt, confirmedAt: t.confirmedAt }).from(t).orderBy(desc(t.id)).limit(50),
  ]);
  const n = (s: string) => by.find((x) => x.status === s)?.n ?? 0;
  return { confirmed: n("confirmed"), pending: n("pending"), unsubscribed: n("unsubscribed"), recent };
}

/** CSV cells starting with = + - @ are prefixed so spreadsheets do not run them as formulas. */
export const csvCell = (v: string) => { const s = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export async function confirmedCsv(env: Env): Promise<string> {
  const rows = await getDbFromEnv(env).select().from(t).where(eq(t.status, "confirmed")).orderBy(desc(t.confirmedAt));
  return ["email,confirmed_at,unsubscribe_url", ...rows.map((r) => [csvCell(r.email), r.confirmedAt?.toISOString() ?? "", unsubscribeUrl(r.token)].join(","))].join("\n") + "\n";
}
