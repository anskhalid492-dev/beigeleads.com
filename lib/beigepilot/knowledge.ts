// Owner-written knowledge for BeigePilot: answers it may use (kind "faq") and claims it must never make (kind "restricted").
// Search is plain keyword scoring (no embeddings). Everything never throws before migration 0038.
export type KKind = "faq" | "restricted";
export type KStatus = "draft" | "published";
export type Entry = { id: number; kind: KKind; title: string; answer: string; keywords: string; status: KStatus; updatedAt: number };
type Env = CloudflareEnv;
type Raw = { id: number; kind: string; title: string; answer: string; keywords: string; status: string; updated_at: number };
const toEntry = (r: Raw): Entry => ({ id: r.id, kind: r.kind === "restricted" ? "restricted" : "faq", title: r.title, answer: r.answer, keywords: r.keywords, status: r.status === "published" ? "published" : "draft", updatedAt: r.updated_at });

export const LIMITS = { title: 160, answer: 1500, keywords: 200 };
export function cleanEntry(v: { kind?: string; title?: string; answer?: string; keywords?: string; status?: string }): { ok: true; v: Omit<Entry, "id" | "updatedAt"> } | { ok: false; error: string } {
  const title = (v.title ?? "").trim().slice(0, LIMITS.title), answer = (v.answer ?? "").trim().slice(0, LIMITS.answer);
  const kind: KKind = v.kind === "restricted" ? "restricted" : "faq";
  if (title.length < 4) return { ok: false, error: kind === "faq" ? "Write the question (at least 4 characters)." : "Describe the claim (at least 4 characters)." };
  if (answer.length < 10) return { ok: false, error: kind === "faq" ? "The answer is too short." : "Explain what the assistant must say instead." };
  if (/https?:\/\/(?!(www\.)?beigeleads\.com)/i.test(answer)) return { ok: false, error: "Only beigeleads.com links are allowed in answers." };
  const keywords = (v.keywords ?? "").split(/[,\n]/).map((k) => k.trim().toLowerCase()).filter(Boolean).join(", ").slice(0, LIMITS.keywords);
  return { ok: true, v: { kind, title, answer, keywords, status: v.status === "published" ? "published" : "draft" } };
}

export async function listEntries(env: Env): Promise<{ ready: boolean; items: Entry[] }> {
  try { return { ready: true, items: (await env.DB.prepare("SELECT * FROM beigepilot_knowledge ORDER BY updated_at DESC LIMIT 500").all<Raw>()).results.map(toEntry) }; } catch { return { ready: false, items: [] }; }
}
export async function getEntry(env: Env, id: number): Promise<Entry | null> {
  try { const r = await env.DB.prepare("SELECT * FROM beigepilot_knowledge WHERE id = ?1").bind(id).first<Raw>(); return r ? toEntry(r) : null; } catch { return null; }
}
export async function saveEntry(env: Env, id: number | null, v: Omit<Entry, "id" | "updatedAt">): Promise<number> {
  let out = id;
  if (id) await env.DB.prepare("UPDATE beigepilot_knowledge SET kind=?2, title=?3, answer=?4, keywords=?5, status=?6, updated_at=unixepoch() WHERE id=?1").bind(id, v.kind, v.title, v.answer, v.keywords, v.status).run();
  else out = (await env.DB.prepare("INSERT INTO beigepilot_knowledge (kind,title,answer,keywords,status) VALUES (?1,?2,?3,?4,?5) RETURNING id").bind(v.kind, v.title, v.answer, v.keywords, v.status).first<{ id: number }>())!.id;
  try { await env.CACHE.delete("beigepilot:kb:v1"); } catch { /* optional */ }
  return out!;
}
export async function deleteEntry(env: Env, id: number): Promise<void> {
  await env.DB.prepare("DELETE FROM beigepilot_knowledge WHERE id = ?1").bind(id).run();
  try { await env.CACHE.delete("beigepilot:kb:v1"); } catch { /* optional */ }
}

/** Published entries only, cached 60 s in KV. */
export async function publishedEntries(env: Env): Promise<Entry[]> {
  try { const c = await env.CACHE.get("beigepilot:kb:v1", "json"); if (Array.isArray(c)) return c as Entry[]; } catch { /* ignore */ }
  let items: Entry[] = [];
  try { items = (await env.DB.prepare("SELECT * FROM beigepilot_knowledge WHERE status='published' ORDER BY id LIMIT 300").all<Raw>()).results.map(toEntry); } catch { return []; }
  try { await env.CACHE.put("beigepilot:kb:v1", JSON.stringify(items), { expirationTtl: 60 }); } catch { /* ignore */ }
  return items;
}

const STOP = new Set(["the", "a", "an", "is", "are", "do", "does", "you", "your", "i", "we", "to", "of", "and", "or", "for", "in", "on", "it", "my", "can", "how", "what", "with", "me", "be"]);
const tok = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));

/** Keyword score: title words weigh 3, keywords 3, answer words 1. Pure, tested. */
export function searchEntries(items: Entry[], query: string, limit = 3): Entry[] {
  const q = [...new Set(tok(query))];
  if (!q.length) return [];
  return items.filter((e) => e.kind === "faq").map((e) => {
    const t = new Set(tok(e.title)), k = new Set(tok(e.keywords)), a = new Set(tok(e.answer));
    let score = 0; for (const w of q) score += (t.has(w) ? 3 : 0) + (k.has(w) ? 3 : 0) + (a.has(w) ? 1 : 0);
    return { e, score };
  }).filter((x) => x.score >= Math.min(3, q.length * 2)).sort((x, y) => y.score - x.score).slice(0, limit).map((x) => x.e);
}
