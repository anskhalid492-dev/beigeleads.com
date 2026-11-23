// Pilo 2.0 analytics (anonymous, CLAUDE.md section 122): random chat id + event name + short detail (language code, page type). No message text.
export const PILO_EVENTS = ["chat_open", "conversation_start", "language", "followup_click", "recommendation", "add_to_cart", "exit_impression", "exit_click", "exit_dismiss", "discount_inquiry", "offer_issued", "offer_accepted", "offer_kept_volume", "memory_cleared", "conversation_new"] as const;
export type PiloEvent = (typeof PILO_EVENTS)[number];
export const isPiloEvent = (v: unknown): v is PiloEvent => typeof v === "string" && (PILO_EVENTS as readonly string[]).includes(v);

/** One row per (session, event, detail) at most: repeats are ignored so counts are never inflated. Never throws. */
export async function piloEvent(env: CloudflareEnv, sid: string, event: PiloEvent, detail = "", page = ""): Promise<void> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(sid)) return;
  try {
    const d = detail.replace(/[^\w .:-]/g, "").slice(0, 30), pg = page.replace(/[^\w-]/g, "").slice(0, 20);
    const has = await env.DB.prepare("SELECT 1 AS x FROM pilo_events WHERE session_id = ?1 AND event = ?2 AND detail = ?3 AND (?2 NOT IN ('recommendation','add_to_cart','offer_issued','discount_inquiry','followup_click')) LIMIT 1").bind(sid, event, d).first();
    if (has) return;
    await env.DB.prepare("INSERT INTO pilo_events (session_id, event, detail, page_type) VALUES (?1, ?2, ?3, ?4)").bind(sid, event, d, pg).run();
  } catch { /* before migration 0047 */ }
}

export type PiloStats = { ready: boolean; sessions: number; byEvent: Record<string, { events: number; sessions: number }>; languages: { lang: string; n: number }[]; exit: { shown: number; clicked: number; dismissed: number } };
export async function piloStats(env: CloudflareEnv, days = 30): Promise<PiloStats> {
  const out: PiloStats = { ready: false, sessions: 0, byEvent: {}, languages: [], exit: { shown: 0, clicked: 0, dismissed: 0 } };
  try {
    const t = days * 86400;
    for (const r of (await env.DB.prepare("SELECT event, COUNT(*) AS events, COUNT(DISTINCT session_id) AS sessions FROM pilo_events WHERE created_at >= unixepoch() - ?1 GROUP BY event").bind(t).all<{ event: string; events: number; sessions: number }>()).results) out.byEvent[r.event] = { events: r.events, sessions: r.sessions };
    out.languages = (await env.DB.prepare("SELECT detail AS lang, COUNT(DISTINCT session_id) AS n FROM pilo_events WHERE event = 'language' AND created_at >= unixepoch() - ?1 GROUP BY detail ORDER BY n DESC").bind(t).all<{ lang: string; n: number }>()).results;
    out.sessions = (await env.DB.prepare("SELECT COUNT(DISTINCT session_id) AS n FROM pilo_events WHERE created_at >= unixepoch() - ?1").bind(t).first<{ n: number }>())?.n ?? 0;
    out.exit = { shown: out.byEvent.exit_impression?.sessions ?? 0, clicked: out.byEvent.exit_click?.sessions ?? 0, dismissed: out.byEvent.exit_dismiss?.sessions ?? 0 };
    out.ready = true;
  } catch { /* not migrated */ }
  return out;
}
