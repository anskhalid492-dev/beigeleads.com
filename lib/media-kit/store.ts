import { desc, eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { DEFAULT_CONTENT, FIELDS, type FieldKey, type KitContent } from "./fields";
export { FIELDS, DEFAULT_CONTENT };
export type { FieldKey, KitContent };

type Env = CloudflareEnv;
export class MediaKitError extends Error {}

const KEYS = Object.keys(FIELDS) as FieldKey[];
const KV_KEY = "mediakit:pub:v1";

export type KitFile = { id: number; label: string; description: string; filename: string; contentType: string; bytes: number; published: boolean };
export type PublishedKit = { content: KitContent; files: KitFile[] };

const toFile = (r: typeof schema.mediaKitFiles.$inferSelect): KitFile => ({ id: r.id, label: r.label, description: r.description, filename: r.filename, contentType: r.contentType, bytes: r.bytes, published: r.published });

/** What visitors see: published text over the built-in defaults, plus published extra files. Never throws (before migration 0018 the defaults show). */
export async function getPublishedKit(env: Env): Promise<PublishedKit> {
  try {
    const hit = await env.CACHE.get(KV_KEY, "json").catch(() => null);
    if (hit) return hit as PublishedKit;
    const db = getDbFromEnv(env);
    const rows = await db.select().from(schema.mediaKitContent);
    const content = { ...DEFAULT_CONTENT };
    for (const r of rows) if ((KEYS as string[]).includes(r.key) && r.published) content[r.key as FieldKey] = r.published;
    const files = (await db.select().from(schema.mediaKitFiles).where(eq(schema.mediaKitFiles.published, true)).orderBy(desc(schema.mediaKitFiles.id))).map(toFile);
    const out = { content, files };
    await env.CACHE.put(KV_KEY, JSON.stringify(out), { expirationTtl: 300 }).catch(() => {});
    return out;
  } catch { return { content: { ...DEFAULT_CONTENT }, files: [] }; }
}

const bust = (env: Env) => env.CACHE.delete(KV_KEY).catch(() => {});
const audit = (env: Env, actor: string, key: string, value: string) =>
  getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor, category: "media-kit", settingKey: key, newValue: value, result: "saved" }).catch(() => {});

export type AdminKit = { published: KitContent; draft: KitContent; hasDraft: boolean; files: KitFile[] };

/** Admin view: draft where one exists, else published, else default. Throws if migration 0018 is missing. */
export async function getAdminKit(env: Env): Promise<AdminKit> {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.mediaKitContent);
  const published = { ...DEFAULT_CONTENT }, draft = { ...DEFAULT_CONTENT };
  let hasDraft = false;
  for (const r of rows) {
    if (!(KEYS as string[]).includes(r.key)) continue;
    const k = r.key as FieldKey;
    if (r.published) published[k] = r.published;
    draft[k] = r.draft ?? r.published ?? DEFAULT_CONTENT[k];
    if (r.draft !== null && r.draft !== (r.published ?? DEFAULT_CONTENT[k])) hasDraft = true;
  }
  const files = (await db.select().from(schema.mediaKitFiles).orderBy(desc(schema.mediaKitFiles.id))).map(toFile);
  return { published, draft, hasDraft, files };
}

function validate(input: Partial<Record<string, unknown>>): KitContent {
  const out = {} as KitContent;
  for (const k of KEYS) {
    const v = String(input[k] ?? "").replace(/\r\n/g, "\n").trim();
    if (!v) throw new MediaKitError(`${FIELDS[k].label}: this cannot be empty.`);
    if (v.length > FIELDS[k].max) throw new MediaKitError(`${FIELDS[k].label}: use at most ${FIELDS[k].max} characters.`);
    out[k] = v;
  }
  return out;
}

export async function saveDraft(env: Env, actor: string, input: Partial<Record<string, unknown>>) {
  const v = validate(input);
  const db = getDbFromEnv(env);
  for (const k of KEYS) {
    await db.insert(schema.mediaKitContent).values({ key: k, draft: v[k], updatedBy: actor })
      .onConflictDoUpdate({ target: schema.mediaKitContent.key, set: { draft: v[k], updatedBy: actor, updatedAt: new Date() } });
  }
  await audit(env, actor, "draft", "draft saved");
}

/** Publishes the saved draft (call saveDraft first with the form values). */
export async function publishDraft(env: Env, actor: string) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.mediaKitContent);
  for (const r of rows) if (r.draft !== null) await db.update(schema.mediaKitContent).set({ published: r.draft, updatedBy: actor, updatedAt: new Date() }).where(eq(schema.mediaKitContent.key, r.key));
  await bust(env);
  await audit(env, actor, "content", "published");
}

/** Throws the draft away: the draft goes back to what is published. */
export async function discardDraft(env: Env, actor: string) {
  const db = getDbFromEnv(env);
  await db.update(schema.mediaKitContent).set({ draft: null, updatedBy: actor, updatedAt: new Date() });
  await audit(env, actor, "draft", "discarded");
}

/* ---------- extra files ---------- */
export const MAX_FILE = 10 * 1024 * 1024;
const ascii = (b: Uint8Array, a: number, n: number) => String.fromCharCode(...b.slice(a, a + n));

/** File type from the bytes, never from the name. SVG must be clean text with no scripts; every download is sent as an attachment anyway. */
export function sniffFile(b: Uint8Array): { mime: string; ext: string } | null {
  if (b.length < 8) return null;
  if (ascii(b, 0, 4) === "%PDF") return { mime: "application/pdf", ext: "pdf" };
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return { mime: "application/zip", ext: "zip" };
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") return { mime: "image/png", ext: "png" };
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return { mime: "image/webp", ext: "webp" };
  const head = new TextDecoder().decode(b.slice(0, Math.min(b.length, 200))).trimStart().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    const all = new TextDecoder().decode(b).toLowerCase();
    if (/<script|<foreignobject|javascript:|\son[a-z]+\s*=/.test(all)) throw new MediaKitError("That SVG contains scripts or event handlers and was refused.");
    if (all.includes("<svg")) return { mime: "image/svg+xml", ext: "svg" };
  }
  return null;
}

const cleanLabel = (s: unknown, max: number) => String(s ?? "").trim().slice(0, max);
const safeName = (n: string, ext: string) => (n.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 60) || "file") + "." + ext;

export async function addFile(env: Env, actor: string, f: { name: string; bytes: Uint8Array }, meta: { label: string; description?: string }) {
  if (f.bytes.length === 0) throw new MediaKitError("That file is empty.");
  if (f.bytes.length > MAX_FILE) throw new MediaKitError("Files can be up to 10 MB.");
  const t = sniffFile(f.bytes);
  if (!t) throw new MediaKitError("Allowed files: PDF, ZIP, PNG, JPEG, WebP or SVG.");
  const label = cleanLabel(meta.label, 80);
  if (!label) throw new MediaKitError("Give the file a name that visitors will see.");
  const key = `media-kit/${crypto.randomUUID()}.${t.ext}`;
  await env.LISTS.put(key, f.bytes, { httpMetadata: { contentType: t.mime } });
  const [row] = await getDbFromEnv(env).insert(schema.mediaKitFiles).values({ label, description: cleanLabel(meta.description, 200), r2Key: key, filename: safeName(f.name, t.ext), contentType: t.mime, bytes: f.bytes.length, published: false, updatedBy: actor }).returning();
  await audit(env, actor, `file:${row.id}`, `uploaded ${row.filename} (hidden until published)`);
  return toFile(row);
}

export async function replaceFile(env: Env, actor: string, id: number, f: { name: string; bytes: Uint8Array }) {
  if (f.bytes.length === 0 || f.bytes.length > MAX_FILE) throw new MediaKitError("Files must be between 1 byte and 10 MB.");
  const t = sniffFile(f.bytes);
  if (!t) throw new MediaKitError("Allowed files: PDF, ZIP, PNG, JPEG, WebP or SVG.");
  const db = getDbFromEnv(env);
  const [old] = await db.select().from(schema.mediaKitFiles).where(eq(schema.mediaKitFiles.id, id)).limit(1);
  if (!old) throw new MediaKitError("File not found.");
  const key = `media-kit/${crypto.randomUUID()}.${t.ext}`;
  await env.LISTS.put(key, f.bytes, { httpMetadata: { contentType: t.mime } });
  await db.update(schema.mediaKitFiles).set({ r2Key: key, filename: safeName(f.name, t.ext), contentType: t.mime, bytes: f.bytes.length, updatedBy: actor, updatedAt: new Date() }).where(eq(schema.mediaKitFiles.id, id));
  await env.LISTS.delete(old.r2Key).catch(() => {});
  await bust(env);
  await audit(env, actor, `file:${id}`, "file replaced");
}

export async function updateFile(env: Env, actor: string, id: number, v: { label: string; description: string }) {
  const label = cleanLabel(v.label, 80);
  if (!label) throw new MediaKitError("Give the file a name that visitors will see.");
  await getDbFromEnv(env).update(schema.mediaKitFiles).set({ label, description: cleanLabel(v.description, 200), updatedBy: actor, updatedAt: new Date() }).where(eq(schema.mediaKitFiles.id, id));
  await bust(env);
  await audit(env, actor, `file:${id}`, "details edited");
}

export async function setFilePublished(env: Env, actor: string, id: number, published: boolean) {
  await getDbFromEnv(env).update(schema.mediaKitFiles).set({ published, updatedBy: actor, updatedAt: new Date() }).where(eq(schema.mediaKitFiles.id, id));
  await bust(env);
  await audit(env, actor, `file:${id}`, published ? "published" : "hidden");
}

export async function deleteFile(env: Env, actor: string, id: number) {
  const db = getDbFromEnv(env);
  const [old] = await db.select().from(schema.mediaKitFiles).where(eq(schema.mediaKitFiles.id, id)).limit(1);
  if (!old) return;
  await db.delete(schema.mediaKitFiles).where(eq(schema.mediaKitFiles.id, id));
  await env.LISTS.delete(old.r2Key).catch(() => {});
  await bust(env);
  await audit(env, actor, `file:${id}`, `deleted ${old.filename}`);
}

/** For the public download route: only published files. */
export async function getPublishedFile(env: Env, id: number) {
  const [r] = await getDbFromEnv(env).select().from(schema.mediaKitFiles).where(eq(schema.mediaKitFiles.id, id)).limit(1);
  return r && r.published ? r : null;
}
