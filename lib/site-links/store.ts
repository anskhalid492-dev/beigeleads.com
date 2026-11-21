// Storage for the bottom footer, AI shortcuts and llms.txt. No migration: three keys in `system_settings`
// (site.social, site.ai, site.llms), every change appended to `settings_audit_log` (category "website").
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { LLMS_DEFAULT } from "./llms-default";
import { checkLlms } from "./store-rules";
import { defaultAi, parseAi, parseSocial, publicFooter, type AiConfig, type FooterConfig, type SocialLink } from "./types";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const FOOTER_KEY = "sitelinks:pub:v1";
export const LLMS_KEY = "llms:pub:v1";
const K = { social: "site.social", ai: "site.ai", llms: "site.llms" } as const;

async function raw(env: Env, key: string): Promise<{ value: string; at: number } | null> {
  try {
    const r = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, key)).limit(1);
    return r[0] ? { value: r[0].value, at: r[0].updatedAt.getTime() } : null;
  } catch { return null; }
}

async function put(env: Env, actor: string, key: string, value: string, oldSummary: string, newSummary: string, result = "saved") {
  const db = getDbFromEnv(env); const now = new Date();
  await db.batch([
    db.insert(schema.systemSettings).values({ key, value, updatedBy: actor, updatedAt: now }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value, updatedBy: actor, updatedAt: now } }),
    db.insert(schema.settingsAuditLog).values({ actor, category: "website", settingKey: key, oldValue: oldSummary.slice(0, 1500), newValue: newSummary.slice(0, 1500), result }),
  ] as unknown as Parameters<typeof db.batch>[0]);
  try { await Promise.all([env.CACHE.delete(FOOTER_KEY), env.CACHE.delete(LLMS_KEY)]); } catch { /* entries expire within a minute */ }
}

export const loadSocial = async (env: Env): Promise<SocialLink[]> => parseSocial((await raw(env, K.social))?.value);
export const loadAi = async (env: Env): Promise<AiConfig> => parseAi((await raw(env, K.ai))?.value);

export async function saveSocial(env: Env, actor: string, rows: SocialLink[]) {
  const old = await loadSocial(env);
  const s = (l: SocialLink[]) => JSON.stringify(l.map((x) => [x.platform, x.url, x.enabled]));
  await put(env, actor, K.social, JSON.stringify(rows), s(old), s(rows));
}
export async function saveAi(env: Env, actor: string, cfg: AiConfig) {
  const old = await loadAi(env);
  const s = (c: AiConfig) => JSON.stringify({ h: c.heading, p: c.prompt.length, pl: c.platforms.map((x) => [x.name, x.enabled, !!x.promptUrl]) });
  await put(env, actor, K.ai, JSON.stringify(cfg), s(old), s(cfg));
}

/** What the public footer needs. KV for 60 s; any failure gives the safe default (no social links, default AI shortcuts). */
export async function getFooterConfig(env: Env): Promise<FooterConfig> {
  try { const hit = await env.CACHE.get<FooterConfig>(FOOTER_KEY, "json"); if (hit) return hit; } catch { /* D1 below */ }
  const out = publicFooter(await loadSocial(env), await loadAi(env));
  try { await env.CACHE.put(FOOTER_KEY, JSON.stringify(out), { expirationTtl: 60 }); } catch { /* optional */ }
  return out;
}
export const fallbackFooter = (): FooterConfig => publicFooter([], defaultAi());

// ---- llms.txt: draft / published / revisions ----
export type LlmsRev = { at: number; by: string; text: string };
export type LlmsState = { draft: string; published: string; publishedAt: number; publishedBy: string; revisions: LlmsRev[]; custom: boolean };

export function parseLlms(rawValue: string | null | undefined): LlmsState {
  const base: LlmsState = { draft: LLMS_DEFAULT, published: LLMS_DEFAULT, publishedAt: 0, publishedBy: "", revisions: [], custom: false };
  if (!rawValue) return base;
  try {
    const j = JSON.parse(rawValue) as Partial<LlmsState>;
    const pub = typeof j.published === "string" && j.published.trim() ? j.published : LLMS_DEFAULT;
    return {
      published: pub, draft: typeof j.draft === "string" ? j.draft : pub, publishedAt: Number(j.publishedAt) || 0, publishedBy: typeof j.publishedBy === "string" ? j.publishedBy : "",
      revisions: Array.isArray(j.revisions) ? j.revisions.filter((r) => typeof r?.text === "string").slice(0, 20).map((r) => ({ at: Number(r.at) || 0, by: String(r.by ?? ""), text: r.text })) : [],
      custom: typeof j.published === "string" && j.published.trim() !== "",
    };
  } catch { return base; }
}

export async function loadLlms(env: Env): Promise<LlmsState & { ready: boolean }> {
  const r = await raw(env, K.llms);
  return { ...parseLlms(r?.value), ready: true };
}

/** The exact text served at /llms.txt. KV 60 s. Never throws: falls back to the built-in text. */
export async function getPublishedLlms(env: Env): Promise<string> {
  try { const hit = await env.CACHE.get(LLMS_KEY); if (hit) return hit; } catch { /* D1 */ }
  const text = parseLlms((await raw(env, K.llms))?.value).published;
  try { await env.CACHE.put(LLMS_KEY, text, { expirationTtl: 60 }); } catch { /* optional */ }
  return text;
}

export async function saveLlmsDraft(env: Env, actor: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = checkLlms(text); if (!c.ok) return c;
  const cur = await loadLlms(env);
  await put(env, actor, K.llms, JSON.stringify({ ...cur, draft: c.value, custom: cur.custom, published: cur.published, ready: undefined }), `${cur.draft.length} chars`, `draft ${c.value.length} chars`, "draft saved");
  return { ok: true };
}

export async function publishLlms(env: Env, actor: string, text: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = checkLlms(text); if (!c.ok) return c;
  const cur = await loadLlms(env);
  const revisions = [{ at: Date.now(), by: actor, text: cur.published }, ...cur.revisions].slice(0, 20);
  await put(env, actor, K.llms, JSON.stringify({ draft: c.value, published: c.value, publishedAt: Date.now(), publishedBy: actor, revisions }), `${cur.published.length} chars`, `${c.value.length} chars`, "published");
  return { ok: true };
}

/** Puts an older version (or the built-in text) into the draft. Publishing stays a separate step. */
export async function restoreLlmsDraft(env: Env, actor: string, text: string) {
  const cur = await loadLlms(env);
  await put(env, actor, K.llms, JSON.stringify({ ...cur, draft: text, ready: undefined }), `${cur.draft.length} chars`, `draft restored ${text.length} chars`, "draft restored");
}
