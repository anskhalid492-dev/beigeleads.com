import { contentSchema, type Campaign, type Status, STATUSES } from "./types";
import { DEFAULT_POPUPS } from "./defaults";

const KEY = "popups:pub:v1";
type Row = { id: string; name: string; stage: string; status: string; priority: number; content_json: string; version: number; updated_at: number };

function fromRow(r: Row): Campaign | null {
  try {
    const c = contentSchema.parse(JSON.parse(r.content_json));
    return { ...c, id: r.id, name: r.name, stage: r.stage as Campaign["stage"], status: r.status as Status, priority: r.priority, version: r.version };
  } catch { return null; } // a damaged row is skipped, never shown
}

/** Every campaign (admin). Never throws: before migration 0025 the list is empty. */
export async function listCampaigns(env: CloudflareEnv): Promise<{ ready: boolean; items: Campaign[] }> {
  try {
    const rs = (await env.DB.prepare("SELECT * FROM popup_campaigns ORDER BY priority DESC, id").all<Row>()).results;
    return { ready: true, items: rs.map(fromRow).filter((c): c is Campaign => !!c) };
  } catch { return { ready: false, items: [] }; }
}

/** Live campaigns for visitors, cached in KV for 60 s so pages never wait on D1. */
export async function livePopups(env: CloudflareEnv): Promise<Campaign[]> {
  try { const hit = await env.CACHE.get<Campaign[]>(KEY, "json"); if (hit) return hit; } catch { /* go to D1 */ }
  try {
    const rs = (await env.DB.prepare("SELECT * FROM popup_campaigns WHERE status = 'live'").all<Row>()).results;
    const out = rs.map(fromRow).filter((c): c is Campaign => !!c);
    try { await env.CACHE.put(KEY, JSON.stringify(out), { expirationTtl: 60 }); } catch { /* optional */ }
    return out;
  } catch { return []; }
}
export const clearPopupCache = (env: CloudflareEnv) => env.CACHE.delete(KEY).catch(() => undefined);

/** Copies the 12 built-in campaigns as drafts. Idempotent and never overwrites a campaign that exists. */
export async function importDefaults(env: CloudflareEnv): Promise<number> {
  let n = 0;
  for (const c of DEFAULT_POPUPS) {
    const { id, name, stage, status, priority, version: _v, ...content } = c;
    void _v; void status;
    const r = await env.DB.prepare("INSERT OR IGNORE INTO popup_campaigns (id, name, stage, status, priority, content_json) VALUES (?, ?, ?, 'draft', ?, ?)").bind(id, name, stage, priority, JSON.stringify(content)).run();
    n += r.meta.changes ?? 0;
  }
  return n;
}

export async function setStatus(env: CloudflareEnv, id: string, status: string): Promise<boolean> {
  if (!(STATUSES as readonly string[]).includes(status)) return false;
  const r = await env.DB.prepare("UPDATE popup_campaigns SET status = ?, updated_at = unixepoch(), version = version + 1 WHERE id = ?").bind(status, id).run();
  await clearPopupCache(env);
  return (r.meta.changes ?? 0) > 0;
}

export const EVENTS = ["impression", "click", "dismiss", "submit"] as const;
/** Anonymous counters only: campaign, event, page type, time. No IP, no id, no cookie. */
export async function recordEvent(env: CloudflareEnv, campaignId: string, event: string, pageType: string): Promise<boolean> {
  if (!(EVENTS as readonly string[]).includes(event)) return false;
  const ok = await env.DB.prepare("SELECT 1 AS x FROM popup_campaigns WHERE id = ? AND status = 'live'").bind(campaignId).first();
  if (!ok) return false;
  await env.DB.prepare("INSERT INTO popup_events (campaign_id, event, page_type) VALUES (?, ?, ?)").bind(campaignId, event, pageType.slice(0, 20)).run();
  return true;
}

export async function eventCounts(env: CloudflareEnv): Promise<Record<string, Record<string, number>>> {
  try {
    const rs = (await env.DB.prepare("SELECT campaign_id, event, COUNT(*) AS n FROM popup_events WHERE created_at >= unixepoch() - 2592000 GROUP BY campaign_id, event").all<{ campaign_id: string; event: string; n: number }>()).results;
    const out: Record<string, Record<string, number>> = {};
    for (const r of rs) (out[r.campaign_id] ??= {})[r.event] = r.n;
    return out;
  } catch { return {}; }
}
export async function purgeOldPopupEvents(env: CloudflareEnv): Promise<void> {
  await env.DB.prepare("DELETE FROM popup_events WHERE created_at < unixepoch() - 7776000").run(); // 90 days
}
