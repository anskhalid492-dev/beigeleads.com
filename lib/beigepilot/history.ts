// Saved conversations (ONLY when the owner turns "Save conversations" on), satisfaction ratings and analytics.
// Visitor text is redacted before it is stored: emails, phone-like numbers and key-like strings are replaced.
type Env = CloudflareEnv;

export const RETENTION_CHOICES = [30, 90, 180, 365] as const;
export function redact(t: string): string {
  return t.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]").replace(/\d[\d\s().-]{7,}\d/g, "[number]").replace(/\b(?:sk|pk|key|token)[-_][A-Za-z0-9_-]{8,}/gi, "[key]").slice(0, 2000);
}
export const validCid = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(v);

export async function recordTurn(env: Env, cid: string, page: string, user: string, a: { text: string; tools: string[]; provider: string; tokens: number; handoff: boolean }): Promise<void> {
  try {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO beigepilot_conversations (id, page, messages, handoff) VALUES (?1, ?2, 2, ?3) ON CONFLICT(id) DO UPDATE SET messages = messages + 2, last_at = unixepoch(), handoff = MAX(handoff, ?3)").bind(cid, page.slice(0, 80), a.handoff ? 1 : 0),
      env.DB.prepare("INSERT INTO beigepilot_messages (conv_id, role, text) VALUES (?1, 'user', ?2)").bind(cid, redact(user)),
      env.DB.prepare("INSERT INTO beigepilot_messages (conv_id, role, text, tools, provider, tokens) VALUES (?1, 'assistant', ?2, ?3, ?4, ?5)").bind(cid, a.text.slice(0, 4000), [...new Set(a.tools)].join(","), a.provider, a.tokens),
    ]);
  } catch { /* history is best effort */ }
}

export type Conv = { id: string; page: string; messages: number; handoff: boolean; startedAt: number; lastAt: number };
export type Message = { id: number; role: "user" | "assistant"; text: string; tools: string; provider: string; tokens: number; at: number };
export async function listConversations(env: Env, filter: string, offset = 0): Promise<{ ready: boolean; items: Conv[]; total: number }> {
  try {
    const where = filter === "handoff" ? "WHERE handoff = 1" : "";
    const rows = (await env.DB.prepare(`SELECT * FROM beigepilot_conversations ${where} ORDER BY last_at DESC LIMIT 25 OFFSET ?1`).bind(offset).all<{ id: string; page: string; messages: number; handoff: number; started_at: number; last_at: number }>()).results;
    const total = (await env.DB.prepare(`SELECT COUNT(*) AS n FROM beigepilot_conversations ${where}`).first<{ n: number }>())?.n ?? 0;
    return { ready: true, total, items: rows.map((r) => ({ id: r.id, page: r.page, messages: r.messages, handoff: !!r.handoff, startedAt: r.started_at, lastAt: r.last_at })) };
  } catch { return { ready: false, items: [], total: 0 }; }
}
export async function getConversation(env: Env, id: string): Promise<{ conv: Conv | null; messages: Message[] }> {
  try {
    const c = await env.DB.prepare("SELECT * FROM beigepilot_conversations WHERE id = ?1").bind(id).first<{ id: string; page: string; messages: number; handoff: number; started_at: number; last_at: number }>();
    const m = (await env.DB.prepare("SELECT * FROM beigepilot_messages WHERE conv_id = ?1 ORDER BY id LIMIT 200").bind(id).all<{ id: number; role: string; text: string; tools: string; provider: string; tokens: number; created_at: number }>()).results;
    return { conv: c ? { id: c.id, page: c.page, messages: c.messages, handoff: !!c.handoff, startedAt: c.started_at, lastAt: c.last_at } : null, messages: m.map((x) => ({ id: x.id, role: x.role === "user" ? "user" : "assistant", text: x.text, tools: x.tools, provider: x.provider, tokens: x.tokens, at: x.created_at })) };
  } catch { return { conv: null, messages: [] }; }
}
export async function deleteConversation(env: Env, id: string): Promise<void> {
  await env.DB.batch([env.DB.prepare("DELETE FROM beigepilot_messages WHERE conv_id = ?1").bind(id), env.DB.prepare("DELETE FROM beigepilot_conversations WHERE id = ?1").bind(id)]);
}
export async function deleteAllConversations(env: Env): Promise<void> {
  await env.DB.batch([env.DB.prepare("DELETE FROM beigepilot_messages"), env.DB.prepare("DELETE FROM beigepilot_conversations")]);
}
/** Cron: removes conversations older than the retention window and old ratings (kept 1 year). Never throws. */
export async function purgeHistory(env: Env, days: number): Promise<void> {
  try {
    const cut = Math.floor(Date.now() / 1000) - days * 86400;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM beigepilot_messages WHERE conv_id IN (SELECT id FROM beigepilot_conversations WHERE last_at < ?1)").bind(cut),
      env.DB.prepare("DELETE FROM beigepilot_conversations WHERE last_at < ?1").bind(cut),
      env.DB.prepare("DELETE FROM beigepilot_feedback WHERE day < ?1").bind(new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10)),
    ]);
  } catch { /* before migration */ }
}

/* ---------- satisfaction ---------- */
export async function saveFeedback(env: Env, cid: string, idx: number, rating: 1 | -1): Promise<boolean> {
  try {
    await env.DB.prepare("INSERT INTO beigepilot_feedback (conv_id, idx, rating, day) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(conv_id, idx) DO UPDATE SET rating = ?3").bind(cid, Math.max(0, Math.min(200, idx)), rating, new Date().toISOString().slice(0, 10)).run();
    return true;
  } catch { return false; }
}

/* ---------- analytics (real data only) ---------- */
export type Day = { day: string; requests: number; tokens: number; errors: number };
export type Stats = { ready: boolean; days: Day[]; up: number; down: number; conversations: number; handoffs: number; leads: number; unanswered: number };
export async function analytics(env: Env, span = 14): Promise<Stats> {
  const out: Stats = { ready: true, days: [], up: 0, down: 0, conversations: 0, handoffs: 0, leads: 0, unanswered: 0 };
  const from = new Date(Date.now() - (span - 1) * 864e5).toISOString().slice(0, 10);
  const one = async (sql: string, ...b: unknown[]) => { try { return (await env.DB.prepare(sql).bind(...b).first<{ n: number }>())?.n ?? 0; } catch { return 0; } };
  try {
    const rows = (await env.DB.prepare("SELECT day, SUM(requests) AS r, SUM(tokens_in + tokens_out) AS t, SUM(errors) AS e FROM beigepilot_usage WHERE day >= ?1 GROUP BY day").bind(from).all<{ day: string; r: number; t: number; e: number }>()).results;
    const m = new Map(rows.map((r) => [r.day, r]));
    for (let i = span - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); const r = m.get(d); out.days.push({ day: d, requests: r?.r ?? 0, tokens: r?.t ?? 0, errors: r?.e ?? 0 }); }
  } catch { out.ready = false; }
  out.up = await one("SELECT COUNT(*) AS n FROM beigepilot_feedback WHERE rating = 1 AND day >= ?1", from);
  out.down = await one("SELECT COUNT(*) AS n FROM beigepilot_feedback WHERE rating = -1 AND day >= ?1", from);
  out.conversations = await one("SELECT COUNT(*) AS n FROM beigepilot_conversations WHERE last_at >= ?1", Math.floor(Date.now() / 1000) - span * 86400);
  out.handoffs = await one("SELECT COUNT(*) AS n FROM beigepilot_conversations WHERE handoff = 1 AND last_at >= ?1", Math.floor(Date.now() / 1000) - span * 86400);
  out.leads = await one("SELECT COUNT(*) AS n FROM beigepilot_leads WHERE created_at >= ?1", Math.floor(Date.now() / 1000) - span * 86400);
  out.unanswered = await one("SELECT COUNT(*) AS n FROM beigepilot_unanswered WHERE status = 'new'");
  return out;
}
