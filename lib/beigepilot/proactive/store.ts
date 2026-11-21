// Proactive Pilo: settings (key/value row in beigepilot_settings, cached in KV) and anonymous analytics. Never throws before migration 0046.
import { DEFAULT_PRO, parsePro, type ProSettings, type Stage } from "./types";

const KEY = "beigepilot:proactive:v1";
type Env = CloudflareEnv;
import { EVENTS, type ProEvent } from "./events";
export { EVENTS };
export type { ProEvent };

export async function getPro(env: Env): Promise<ProSettings> {
  try { const hit = await env.CACHE.get(KEY); if (hit) return parsePro(hit); } catch { /* go to D1 */ }
  let raw = "";
  try { raw = (await env.DB.prepare("SELECT value FROM beigepilot_settings WHERE key = 'proactive'").first<{ value: string }>())?.value ?? ""; } catch { return DEFAULT_PRO; }
  const s = parsePro(raw);
  try { await env.CACHE.put(KEY, JSON.stringify(s), { expirationTtl: 60 }); } catch { /* optional */ }
  return s;
}

export async function savePro(env: Env, s: ProSettings): Promise<void> {
  const json = JSON.stringify(s);
  await env.DB.prepare("INSERT INTO beigepilot_settings (key, value, updated_at) VALUES ('proactive', ?1, unixepoch()) ON CONFLICT(key) DO UPDATE SET value = ?1, updated_at = unixepoch()").bind(json).run();
  for (const k of [KEY, "beigepilot:config:v5"]) try { await env.CACHE.delete(k); } catch { /* optional */ }
}

/** One row per (session, stage, event): the unique index makes repeats harmless. Returns true when a new row was written. */
export async function recordEvent(env: Env, e: { sid: string; stage: Stage; event: ProEvent; template: string; page: string }): Promise<boolean> {
  try {
    const r = await env.DB.prepare("INSERT OR IGNORE INTO beigepilot_proactive_events (session_id, stage, event, template_id, page_type) VALUES (?1, ?2, ?3, ?4, ?5)").bind(e.sid, e.stage, e.event, e.template.slice(0, 40), e.page.slice(0, 20)).run();
    return (r.meta.changes ?? 0) > 0;
  } catch { return false; }
}

export type StageStats = Record<ProEvent, number>;
const zero = (): StageStats => Object.fromEntries(EVENTS.map((e) => [e, 0])) as StageStats;
/** Counts per stage for the last `days` days. Everything is a count of sessions; nothing is estimated. */
export async function proStats(env: Env, days = 30): Promise<{ ready: boolean; stages: Record<Stage, StageStats>; templates: { id: string; impressions: number; clicks: number }[] }> {
  const stages: Record<Stage, StageStats> = { 1: zero(), 2: zero(), 3: zero() };
  try {
    const rs = (await env.DB.prepare("SELECT stage, event, COUNT(*) AS n FROM beigepilot_proactive_events WHERE created_at >= unixepoch() - ?1 GROUP BY stage, event").bind(days * 86400).all<{ stage: number; event: ProEvent; n: number }>()).results;
    for (const r of rs) if (stages[r.stage as Stage] && EVENTS.includes(r.event)) stages[r.stage as Stage][r.event] = r.n;
    const ts = (await env.DB.prepare("SELECT template_id AS id, SUM(event = 'impression') AS impressions, SUM(event = 'click') AS clicks FROM beigepilot_proactive_events WHERE created_at >= unixepoch() - ?1 AND template_id != '' GROUP BY template_id ORDER BY impressions DESC").bind(days * 86400).all<{ id: string; impressions: number; clicks: number }>()).results;
    return { ready: true, stages, templates: ts };
  } catch { return { ready: false, stages, templates: [] }; }
}

export async function purgeProEvents(env: Env): Promise<void> {
  await env.DB.prepare("DELETE FROM beigepilot_proactive_events WHERE created_at < unixepoch() - 7776000").run().catch(() => undefined); // 90 days
}
