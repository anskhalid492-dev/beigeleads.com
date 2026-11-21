// Status of what Pilo can retrieve from the Help Center and the Glossary, for the admin "Content sync" tab.
// Pilo reads published content live (see glossary.ts and the Help tools), so "sync" means: caches are fresh and nothing stale is left behind.
import { getDbFromEnv, schema } from "@/lib/db";
import { loadAll } from "@/lib/help/store";
import { bustHelpCache } from "@/lib/help/store";
import { GLOSSARY_KV } from "./glossary";

type Env = { DB: D1Database; CACHE: KVNamespace };

async function sha(text: string): Promise<string> {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(b)].slice(0, 6).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export type SyncStatus = {
  help: { published: number; drafts: number; hash: string; outdated: { id: string; title: string; updated: string }[]; newest: number };
  glossary: { published: number; drafts: number; hash: string; newest: number };
  knowledgeDuplicates: { id: number; title: string; matches: string }[];
  checkedAt: number;
};

/** Counts, content fingerprints (change when any published text changes) and review hints. Never throws. */
export async function syncStatus(env: Env, now = Date.now()): Promise<SyncStatus> {
  const db = getDbFromEnv(env);
  const out: SyncStatus = { help: { published: 0, drafts: 0, hash: "", outdated: [], newest: 0 }, glossary: { published: 0, drafts: 0, hash: "", newest: 0 }, knowledgeDuplicates: [], checkedAt: now };
  try {
    const all = await loadAll(env);
    const arts = all?.articles ?? [];
    const pub = arts.filter((a) => a.status === "published");
    out.help.published = pub.length; out.help.drafts = arts.length - pub.length;
    out.help.hash = await sha(pub.map((a) => `${a.category}/${a.slug}|${a.title}|${a.updatedAtMs}|${JSON.stringify(a.body).length}`).sort().join("\n"));
    out.help.newest = Math.max(0, ...pub.map((a) => a.updatedAtMs ?? 0));
    const cutoff = new Date(now - 180 * 86400000).toISOString().slice(0, 10);
    out.help.outdated = pub.filter((a) => (a.updated ?? "9999") < cutoff).map((a) => ({ id: `${a.category}/${a.slug}`, title: a.title, updated: a.updated ?? "" })).slice(0, 50);
  } catch { /* tables missing */ }
  try {
    const rows = await db.select({ s: schema.glossaryTerms.slug, st: schema.glossaryTerms.status, u: schema.glossaryTerms.updatedAt, c: schema.glossaryTerms.content }).from(schema.glossaryTerms);
    const pub = rows.filter((r) => r.st === "published");
    out.glossary.published = pub.length; out.glossary.drafts = rows.length - pub.length;
    out.glossary.hash = await sha(pub.map((r) => `${r.s}|${r.u}|${r.c.length}`).sort().join("\n"));
    out.glossary.newest = Math.max(0, ...pub.map((r) => r.u * 1000));
  } catch { /* tables missing */ }
  try {
    const kb = (await env.DB.prepare("SELECT id, title FROM beigepilot_knowledge WHERE status='published'").all<{ id: number; title: string }>()).results;
    const all = await loadAll(env);
    const titles = new Map((all?.articles ?? []).filter((a) => a.status === "published").map((a) => [a.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), `${a.category}/${a.slug}`]));
    for (const k of kb) { const m = titles.get(k.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()); if (m) out.knowledgeDuplicates.push({ id: k.id, title: k.title, matches: m }); }
  } catch { /* optional */ }
  return out;
}

/** Clears every cache Pilo reads from, so the next question uses the newest published content. */
export async function refreshPilo(env: Env): Promise<void> {
  await bustHelpCache(env);
  for (const k of [GLOSSARY_KV, "beigepilot:kb:v1"]) { try { await env.CACHE.delete(k); } catch { /* ignore */ } }
}
