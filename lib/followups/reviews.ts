// "How was your list?" (section 170). Only real, buyer-written responses are stored. Nothing is invented, edited or counted from anywhere else.
import { z } from "zod";
import { getDbFromEnv } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { isOptedOut, optoutUrl, reviewToken, reviewTokenHash, validTok } from "./tokens";
import { loadFollowups } from "./settings";

type Env = CloudflareEnv;
const SITE = "https://beigeleads.com";

/** Shape of the public review form (ApiForm sends strings; a ticked checkbox arrives as "yes"). */
export const reviewInput = z.object({
  token: z.string().refine(validTok, "This link is not valid."),
  rating: z.coerce.number().int("Choose a rating from 1 to 5.").min(1, "Choose a rating from 1 to 5.").max(5, "Choose a rating from 1 to 5."),
  comment: z.string().trim().max(1200, "Please keep your comment under 1,200 characters.").default(""),
  displayName: z.string().trim().max(40, "Use 40 characters or fewer for your name.").default(""),
  allowPublic: z.string().optional().transform((v) => v === "yes"),
  turnstileToken: z.string().min(1, "Please complete the check."),
  website: z.string().optional(),
});

export type ReviewRow = { id: number; order_id: string; product_slug: string; product_name: string; status: string; rating: number | null; comment: string; display_name: string; requested_at: number; submitted_at: number | null };

/**
 * Cron: for REAL-MONEY paid orders delivered at least `reviewDays` ago, create the review row (with a private token) and email the request once.
 * Skipped for: opted-out buyers, test-network orders, services (verification, DFY), missing tables, switched-off setting.
 */
export async function sendReviewRequests(env: Env, max = 10): Promise<number> {
  const st = await loadFollowups(env);
  if (!st.reviewsOn) return 0;
  await hydrateCatalog(env);
  const cutoff = Math.floor(Date.now() / 1000) - st.reviewDays * 86400;
  let rows: { order_id: string; email: string; sent: number }[] = [];
  try {
    rows = (await env.DB.prepare(`SELECT d.order_id AS order_id, o.email AS email, d.sent_at AS sent FROM deliveries d JOIN orders o ON o.id = d.order_id
      WHERE d.status = 'sent' AND d.sent_at IS NOT NULL AND d.sent_at <= ? AND o.status = 'paid'
        AND NOT EXISTS (SELECT 1 FROM list_reviews r WHERE r.order_id = d.order_id)
        AND EXISTS (SELECT 1 FROM payment_attempts a WHERE a.order_id = o.id AND a.status = 'paid' AND a.network IN ('mainnet','TRC20','ERC20','ethereum'))
      ORDER BY d.sent_at LIMIT ?`).bind(cutoff, max).all<{ order_id: string; email: string; sent: number }>()).results;
  } catch { return 0; }
  const db = getDbFromEnv(env);
  let n = 0;
  for (const r of rows) {
    if (await isOptedOut(env, r.email)) { await skip(env, r.order_id); continue; }
    const item = await env.DB.prepare("SELECT product_slug FROM order_items WHERE order_id = ? AND product_slug NOT IN ('email-verification','dfy-outbound','dfy-ownership') ORDER BY id LIMIT 1").bind(r.order_id).first<{ product_slug: string }>().catch(() => null);
    if (!item) { await skip(env, r.order_id); continue; }
    const count = (await env.DB.prepare("SELECT COUNT(*) AS n FROM order_items WHERE order_id = ? AND product_slug NOT IN ('email-verification','dfy-outbound','dfy-ownership')").bind(r.order_id).first<{ n: number }>().catch(() => null))?.n ?? 1;
    const name = count > 1 ? "BeigeLeads" : getProduct(item.product_slug)?.name ?? item.product_slug;
    const token = await reviewToken(env, r.order_id);
    const th = await reviewTokenHash(token);
    const ins = await env.DB.prepare("INSERT OR IGNORE INTO list_reviews (order_id, token_hash, product_slug, product_name, status) VALUES (?, ?, ?, ?, 'requested')").bind(r.order_id, th, count > 1 ? "" : item.product_slug, name).run().catch(() => null);
    if (!ins || ins.meta.changes === 0) continue;
    const res = await sendOnce(env, db, "review_request", r.email, { order_number: r.order_id, product_name: name, review_url: `${SITE}/review/${token}`, unsubscribe_url: await optoutUrl(env, r.email) }, r.order_id);
    if (res === "sent" || res === "already-sent") n++;
    else await env.DB.prepare("UPDATE list_reviews SET status = 'not_sent' WHERE order_id = ?").bind(r.order_id).run().catch(() => null); // no template / email off: never retried, never shown
  }
  return n;
}
async function skip(env: Env, orderId: string) { await env.DB.prepare("INSERT OR IGNORE INTO list_reviews (order_id, token_hash, status) VALUES (?, ?, 'skipped')").bind(orderId, `skip:${orderId}`).run().catch(() => null); }

export async function reviewByToken(env: Env, token: string): Promise<ReviewRow | null> {
  if (!validTok(token)) return null;
  try { return await env.DB.prepare("SELECT id, order_id, product_slug, product_name, status, rating, comment, display_name, requested_at, submitted_at FROM list_reviews WHERE token_hash = ?").bind(await reviewTokenHash(token)).first<ReviewRow>(); } catch { return null; }
}

/** Stores the buyer's answer once. Public display needs BOTH the buyer's permission and an admin approval. */
export async function submitReview(env: Env, d: Pick<z.infer<typeof reviewInput>, "token" | "rating" | "comment" | "displayName" | "allowPublic">): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await reviewByToken(env, d.token);
  if (!row || row.status === "skipped" || row.status === "not_sent") return { ok: false, error: "This link is not valid. Use the link from your latest email." };
  if (row.status !== "requested") return { ok: false, error: "This review was already sent. Thank you." };
  const status = d.allowPublic ? "submitted" : "private"; // private = stored for the team, never shown
  const r = await env.DB.prepare("UPDATE list_reviews SET status = ?, rating = ?, comment = ?, display_name = ?, submitted_at = unixepoch() WHERE id = ? AND status = 'requested'").bind(status, d.rating, d.comment, d.allowPublic ? d.displayName : "", row.id).run();
  if (r.meta.changes === 0) return { ok: false, error: "This review was already sent. Thank you." };
  return { ok: true };
}

export async function listReviews(env: Env, filter: "all" | "submitted" | "approved" | "hidden" | "private" = "all", limit = 100) {
  try {
    const q = filter === "all" ? "WHERE status IN ('submitted','approved','hidden','private')" : "WHERE status = ?";
    const st = env.DB.prepare(`SELECT id, order_id, product_slug, product_name, status, rating, comment, display_name, requested_at, submitted_at FROM list_reviews ${q} ORDER BY submitted_at DESC LIMIT ${Math.min(500, limit)}`);
    return { ready: true as const, rows: (await (filter === "all" ? st : st.bind(filter)).all<ReviewRow>()).results };
  } catch { return { ready: false as const, rows: [] as ReviewRow[] }; }
}
export async function counts(env: Env) {
  try {
    const rs = (await env.DB.prepare("SELECT status, COUNT(*) AS n FROM list_reviews GROUP BY status").all<{ status: string; n: number }>()).results;
    const n = (s: string) => rs.find((x) => x.status === s)?.n ?? 0;
    return { requested: n("requested"), submitted: n("submitted"), approved: n("approved"), hidden: n("hidden"), private: n("private") };
  } catch { return null; }
}
export async function moderate(env: Env, id: number, to: "approved" | "hidden", actor: string): Promise<boolean> {
  const r = await env.DB.prepare("UPDATE list_reviews SET status = ?, moderated_at = unixepoch(), moderated_by = ? WHERE id = ? AND status IN ('submitted','approved','hidden')").bind(to, actor, id).run();
  if (r.meta.changes > 0) await env.CACHE.delete("reviews:pub:v1").catch(() => null);
  return r.meta.changes > 0;
}

export type PublicReviews = { count: number; average: number | null; items: { rating: number; comment: string; name: string; product: string; date: number }[] };
/** What visitors may see: approved reviews only, shown only once the admin's minimum is reached. The average appears with the same minimum. */
export async function publicReviews(env: Env, productSlug?: string): Promise<PublicReviews | null> {
  const st = await loadFollowups(env);
  if (!st.showPublic) return null;
  try {
    const rows = (await env.DB.prepare("SELECT rating, comment, display_name, product_slug, product_name, submitted_at FROM list_reviews WHERE status = 'approved' AND rating IS NOT NULL ORDER BY submitted_at DESC LIMIT 200").all<{ rating: number; comment: string; display_name: string; product_slug: string; product_name: string; submitted_at: number }>()).results;
    const use = productSlug ? rows.filter((r) => r.product_slug === productSlug) : rows;
    if (use.length < st.minToShow) return null;
    const avg = Math.round((use.reduce((a, r) => a + r.rating, 0) / use.length) * 10) / 10;
    return { count: use.length, average: avg, items: use.filter((r) => r.comment.trim()).slice(0, 6).map((r) => ({ rating: r.rating, comment: r.comment, name: r.display_name || "Verified buyer", product: r.product_name, date: r.submitted_at })) };
  } catch { return null; }
}
