// Sample-to-purchase follow-up (section 170): ONE email per fulfilled sample request, tied to that request, with an opt-out link.
import { getDbFromEnv } from "@/lib/db";
import { getProduct } from "@/lib/catalog";
import { hydrateCatalog } from "@/lib/catalog-db";
import { sendOnce } from "@/lib/system-emails/triggers";
import { isOptedOut, optoutUrl } from "./tokens";
import { loadFollowups } from "./settings";

type Env = CloudflareEnv;
const SITE = "https://beigeleads.com";

/** Cron: samples fulfilled at least `sampleDays` ago for a specific list, where the person has not already bought that list and has not opted out. */
export async function sendSampleFollowups(env: Env, max = 10): Promise<number> {
  const st = await loadFollowups(env);
  if (!st.sampleOn) return 0;
  await hydrateCatalog(env);
  const cutoff = Date.now() - st.sampleDays * 86400_000;
  let rows: { id: number; email: string; slug: string }[] = [];
  try {
    rows = (await env.DB.prepare(`SELECT s.id AS id, s.email AS email, s.product_slug AS slug FROM sample_requests s
      WHERE s.status = 'fulfilled' AND s.product_slug IS NOT NULL AND s.updated_at IS NOT NULL AND s.updated_at <= ?
        AND NOT EXISTS (SELECT 1 FROM sample_followups f WHERE f.sample_request_id = s.id)
        AND NOT EXISTS (SELECT 1 FROM orders o JOIN order_items i ON i.order_id = o.id WHERE lower(o.email) = lower(s.email) AND o.status = 'paid' AND i.product_slug = s.product_slug)
      ORDER BY s.updated_at LIMIT ?`).bind(cutoff, max).all<{ id: number; email: string; slug: string }>()).results;
  } catch { return 0; }
  const db = getDbFromEnv(env);
  let n = 0;
  for (const r of rows) {
    const claim = async (status: string, reason = "") => (await env.DB.prepare("INSERT OR IGNORE INTO sample_followups (sample_request_id, status, reason) VALUES (?, ?, ?)").bind(r.id, status, reason).run().catch(() => null))?.meta.changes ?? 0;
    const p = getProduct(r.slug);
    if (!p) { await claim("skipped", "list not found"); continue; }
    if (await isOptedOut(env, r.email)) { await claim("skipped", "opted out"); continue; }
    if ((await claim("sent")) === 0) continue; // another run claimed it
    const res = await sendOnce(env, db, "sample_followup", r.email, { product_name: p.name, list_url: `${SITE}/lists/${p.slug}`, unsubscribe_url: await optoutUrl(env, r.email) }, `sample:${r.id}`);
    if (res === "sent" || res === "already-sent") n++;
    else await env.DB.prepare("UPDATE sample_followups SET status = 'not_sent', reason = ? WHERE sample_request_id = ?").bind(res, r.id).run().catch(() => null);
  }
  return n;
}
