// Unanswered questions and human handoff requests. Stored only with what the visitor chose to give (leads) or
// anonymised question text (no emails, no long numbers) for unanswered questions.
type Env = CloudflareEnv;

/* ---------- unanswered questions ---------- */
export type Unanswered = { id: number; question: string; times: number; page: string; status: "new" | "resolved" | "ignored"; knowledgeId: number | null; lastAt: number };
export const looksPrivate = (q: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(q) || /\d[\d\s().-]{7,}\d/.test(q) || /\b(sk|pk|key|token)[-_][a-z0-9]{8,}/i.test(q);
export const qKey = (q: string) => q.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

/** Best effort and silent. Returns false when the text was refused (private-looking) or storage is not ready. */
export async function logUnanswered(env: Env, question: string, page: string): Promise<boolean> {
  const q = question.trim().slice(0, 200);
  if (q.length < 6 || looksPrivate(q)) return false;
  try {
    await env.DB.prepare("INSERT INTO beigepilot_unanswered (question, qkey, page) VALUES (?1, ?2, ?3) ON CONFLICT(qkey) DO UPDATE SET times = times + 1, last_at = unixepoch(), status = CASE WHEN status = 'resolved' THEN 'new' ELSE status END")
      .bind(q, qKey(q), page.slice(0, 80)).run();
    return true;
  } catch { return false; }
}
type URaw = { id: number; question: string; times: number; page: string; status: string; knowledge_id: number | null; last_at: number };
export async function listUnanswered(env: Env, status: string): Promise<{ ready: boolean; items: Unanswered[] }> {
  try {
    const where = ["new", "resolved", "ignored"].includes(status) ? "WHERE status = ?1" : "WHERE ?1 = ?1";
    const rows = (await env.DB.prepare(`SELECT * FROM beigepilot_unanswered ${where} ORDER BY times DESC, last_at DESC LIMIT 200`).bind(status).all<URaw>()).results;
    return { ready: true, items: rows.map((r) => ({ id: r.id, question: r.question, times: r.times, page: r.page, status: r.status as Unanswered["status"], knowledgeId: r.knowledge_id, lastAt: r.last_at })) };
  } catch { return { ready: false, items: [] }; }
}
export async function setUnanswered(env: Env, id: number, status: string, knowledgeId?: number): Promise<void> {
  if (!["new", "resolved", "ignored"].includes(status)) return;
  await env.DB.prepare("UPDATE beigepilot_unanswered SET status = ?2, knowledge_id = COALESCE(?3, knowledge_id) WHERE id = ?1").bind(id, status, knowledgeId ?? null).run();
}
export async function deleteUnanswered(env: Env, id: number): Promise<void> { await env.DB.prepare("DELETE FROM beigepilot_unanswered WHERE id = ?1").bind(id).run(); }
export async function purgeUnanswered(env: Env, days = 180): Promise<void> {
  try { await env.DB.prepare("DELETE FROM beigepilot_unanswered WHERE last_at < unixepoch() - ?1").bind(days * 86400).run(); } catch { /* before migration */ }
}

/* ---------- handoff leads ---------- */
export type Lead = { id: number; reference: string; name: string; email: string; message: string; page: string; consent: boolean; status: "new" | "contacted" | "closed"; note: string; ownerNotify: string; createdAt: number };
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const newLeadReference = (b: Uint8Array = crypto.getRandomValues(new Uint8Array(8))) => "BP-" + Array.from(b, (x) => ALPHABET[x % ALPHABET.length]).join("");

export async function createLead(env: Env, v: { name: string; email: string; message: string; page: string; consent: boolean }): Promise<{ reference: string } | null> {
  if (!v.consent) return null;
  const reference = newLeadReference();
  try {
    await env.DB.prepare("INSERT INTO beigepilot_leads (reference, name, email, message, page, consent) VALUES (?1,?2,?3,?4,?5,1)").bind(reference, v.name.trim().slice(0, 120), v.email.trim().toLowerCase().slice(0, 200), v.message.trim().slice(0, 2000), v.page.slice(0, 80)).run();
    return { reference };
  } catch { return null; }
}
export async function setLeadNotify(env: Env, reference: string, s: "sent" | "failed" | "skipped"): Promise<void> {
  try { await env.DB.prepare("UPDATE beigepilot_leads SET owner_notify = ?2 WHERE reference = ?1").bind(reference, s).run(); } catch { /* ignore */ }
}
type LRaw = { id: number; reference: string; name: string; email: string; message: string; page: string; consent: number; status: string; note: string; owner_notify: string; created_at: number };
const toLead = (r: LRaw): Lead => ({ id: r.id, reference: r.reference, name: r.name, email: r.email, message: r.message, page: r.page, consent: !!r.consent, status: r.status as Lead["status"], note: r.note, ownerNotify: r.owner_notify, createdAt: r.created_at });
export async function listLeads(env: Env, status: string): Promise<{ ready: boolean; items: Lead[] }> {
  try {
    const where = ["new", "contacted", "closed"].includes(status) ? "WHERE status = ?1" : "WHERE ?1 = ?1";
    return { ready: true, items: (await env.DB.prepare(`SELECT * FROM beigepilot_leads ${where} ORDER BY created_at DESC LIMIT 200`).bind(status).all<LRaw>()).results.map(toLead) };
  } catch { return { ready: false, items: [] }; }
}
export async function updateLead(env: Env, id: number, status: string, note: string): Promise<void> {
  if (!["new", "contacted", "closed"].includes(status)) return;
  await env.DB.prepare("UPDATE beigepilot_leads SET status = ?2, note = ?3 WHERE id = ?1").bind(id, status, note.slice(0, 1000)).run();
}
export async function deleteLead(env: Env, id: number): Promise<void> { await env.DB.prepare("DELETE FROM beigepilot_leads WHERE id = ?1").bind(id).run(); }
