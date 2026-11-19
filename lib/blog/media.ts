import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { BlogError } from "./taxonomy";

type Env = CloudflareEnv;
export const MAX_UPLOAD = 5 * 1024 * 1024;
const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as const;
export type AllowedMime = keyof typeof TYPES;

/** The file type is decided from the file's own bytes, never from the name or the browser's claim. SVG is refused on purpose (it can carry scripts). */
export function sniff(b: Uint8Array): AllowedMime | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "image/webp";
  if (b.length > 6 && String.fromCharCode(...b.slice(0, 4)) === "GIF8") return "image/gif";
  if (b.length > 16 && String.fromCharCode(...b.slice(4, 8)) === "ftyp" && ["avif", "avis"].includes(String.fromCharCode(...b.slice(8, 12)))) return "image/avif";
  return null;
}

export function dimensions(b: Uint8Array, mime: AllowedMime): { width: number; height: number } | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  try {
    if (mime === "image/png") return { width: dv.getUint32(16), height: dv.getUint32(20) };
    if (mime === "image/gif") return { width: dv.getUint16(6, true), height: dv.getUint16(8, true) };
    if (mime === "image/jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { height: dv.getUint16(i + 5), width: dv.getUint16(i + 7) };
        i += 2 + dv.getUint16(i + 2);
      }
      return null;
    }
    if (mime === "image/avif") {
      // The image size sits in the "ispe" box near the start of the file.
      const head = b.subarray(0, Math.min(b.length, 4096));
      for (let i = 4; i + 16 < head.length; i++) if (head[i] === 0x69 && head[i + 1] === 0x73 && head[i + 2] === 0x70 && head[i + 3] === 0x65) return { width: dv.getUint32(i + 8), height: dv.getUint32(i + 12) };
      return null;
    }
    const chunk = String.fromCharCode(...b.slice(12, 16));
    if (chunk === "VP8X") return { width: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), height: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    if (chunk === "VP8 ") return { width: dv.getUint16(26, true) & 0x3fff, height: dv.getUint16(28, true) & 0x3fff };
    if (chunk === "VP8L") { const bits = dv.getUint32(21, true); return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }; }
  } catch { /* fall through */ }
  return null;
}

export const safeFilename = (name: string) => name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 60) || "image";

export const MIN_WIDTH = 400;
export const MAX_SIDE = 8000;

/** Rejects images that are unreadable, tiny or absurdly large. Unknown dimensions (rare formats) are allowed through. */
export function checkDimensions(d: { width: number; height: number } | null) {
  if (!d) return;
  if (d.width < MIN_WIDTH) throw new BlogError(`The image is too small (${d.width} px wide). Use at least ${MIN_WIDTH} px.`);
  if (d.width > MAX_SIDE || d.height > MAX_SIDE) throw new BlogError(`The image is too large (${d.width} x ${d.height}). Keep each side under ${MAX_SIDE} px.`);
}

export async function saveUpload(env: Env, actor: string, file: { name: string; bytes: Uint8Array }, opts: { originalId?: number } = {}) {
  if (file.bytes.length === 0) throw new BlogError("That file is empty.");
  if (file.bytes.length > MAX_UPLOAD) throw new BlogError("Images can be up to 5 MB. Make it smaller and try again.");
  const mime = sniff(file.bytes);
  if (!mime) throw new BlogError("Only JPEG, PNG, WebP, AVIF and GIF images are allowed.");
  const d = dimensions(file.bytes, mime);
  checkDimensions(d);
  const year = new Date().getUTCFullYear();
  const key = `blog/media/${year}/${crypto.randomUUID()}.${TYPES[mime]}`;
  await env.LISTS.put(key, file.bytes, { httpMetadata: { contentType: mime, cacheControl: "public, max-age=3600" } });
  const [row] = await getDbFromEnv(env).insert(schema.blogMedia).values({ key, filename: `${safeFilename(file.name)}.${TYPES[mime]}`, mime, size: file.bytes.length, width: d?.width ?? null, height: d?.height ?? null, originalId: opts.originalId ?? null, uploadedBy: actor }).returning();
  return { ...row, url: mediaUrl(key) };
}

export const mediaUrl = (key: string) => key.replace(/^blog/, "");

export async function replaceUpload(env: Env, id: number, file: { bytes: Uint8Array }) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.blogMedia).where(eq(schema.blogMedia.id, id)).limit(1);
  if (!rows[0]) throw new BlogError("Image not found.");
  if (file.bytes.length === 0 || file.bytes.length > MAX_UPLOAD) throw new BlogError("Images can be up to 5 MB.");
  const mime = sniff(file.bytes);
  if (mime !== rows[0].mime) throw new BlogError("Use the same image type as the original so every article keeps working.");
  const d = dimensions(file.bytes, mime);
  checkDimensions(d);
  await env.LISTS.put(rows[0].key, file.bytes, { httpMetadata: { contentType: mime, cacheControl: "public, max-age=3600" } });
  await db.update(schema.blogMedia).set({ size: file.bytes.length, width: d?.width ?? null, height: d?.height ?? null }).where(eq(schema.blogMedia.id, id));
}

export async function listMedia(env: Env, o: { q?: string; page?: number; per?: number }) {
  const db = getDbFromEnv(env);
  const per = o.per ?? 24, page = Math.max(1, o.page ?? 1);
  const q = o.q ? `%${o.q.replace(/[%_]/g, "").slice(0, 60)}%` : null;
  const w = q ? or(like(schema.blogMedia.filename, q), like(schema.blogMedia.alt, q)) : undefined;
  const [rows, total, uses] = await Promise.all([
    db.select().from(schema.blogMedia).where(w).orderBy(desc(schema.blogMedia.id)).limit(per).offset((page - 1) * per),
    db.select({ n: sql<number>`count(*)` }).from(schema.blogMedia).where(w),
    db.select({ id: schema.blogPostMedia.mediaId, n: sql<number>`count(*)` }).from(schema.blogPostMedia).groupBy(schema.blogPostMedia.mediaId),
  ]);
  return { rows: rows.map((r) => ({ ...r, url: mediaUrl(r.key), used: uses.find((u) => u.id === r.id)?.n ?? 0 })), total: total[0]?.n ?? 0, per, page };
}

export async function mediaUsage(env: Env, id: number) {
  return getDbFromEnv(env).select({ id: schema.blogPosts.id, title: schema.blogPosts.title }).from(schema.blogPostMedia).innerJoin(schema.blogPosts, eq(schema.blogPosts.id, schema.blogPostMedia.postId)).where(eq(schema.blogPostMedia.mediaId, id));
}

export async function setAlt(env: Env, id: number, alt: string) {
  await getDbFromEnv(env).update(schema.blogMedia).set({ alt: alt.trim().slice(0, 300) }).where(eq(schema.blogMedia.id, id));
}

export async function deleteMedia(env: Env, id: number, force: boolean) {
  const db = getDbFromEnv(env);
  const rows = await db.select().from(schema.blogMedia).where(eq(schema.blogMedia.id, id)).limit(1);
  if (!rows[0]) return;
  const used = await mediaUsage(env, id);
  if (used.length && !force) throw new BlogError(`This image is used in ${used.length} article(s): ${used.map((u) => u.title).join(", ")}.`);
  await env.LISTS.delete(rows[0].key);
  await db.delete(schema.blogPostMedia).where(eq(schema.blogPostMedia.mediaId, id));
  await db.delete(schema.blogMedia).where(and(eq(schema.blogMedia.id, id)));
}

export type MediaMeta = { alt: string; title: string; description: string; attribution: string };

export async function setMediaMeta(env: Env, id: number, m: Partial<MediaMeta>) {
  const c = (v: string | undefined, max: number) => (v ?? "").trim().slice(0, max);
  const set: Record<string, string> = {};
  if (m.alt !== undefined) set.alt = c(m.alt, 300);
  if (m.title !== undefined) set.title = c(m.title, 200);
  if (m.description !== undefined) set.description = c(m.description, 1000);
  if (m.attribution !== undefined) set.attribution = c(m.attribution, 300);
  if (!Object.keys(set).length) return;
  await getDbFromEnv(env).update(schema.blogMedia).set(set).where(eq(schema.blogMedia.id, id));
}

/** Library record for a public /media/... path (used for credits and structured data). */
export async function mediaByUrl(env: Env, url: string | null) {
  if (!url || !url.startsWith("/media/")) return null;
  const rows = await getDbFromEnv(env).select().from(schema.blogMedia).where(eq(schema.blogMedia.key, `blog${url}`)).limit(1);
  return rows[0] ? { ...rows[0], url } : null;
}

/** Public path of the untouched original that a crop was made from. */
export async function originalUrlOf(env: Env, id: number) {
  const r = await getDbFromEnv(env).select({ key: schema.blogMedia.key }).from(schema.blogMedia).where(eq(schema.blogMedia.id, id)).limit(1);
  return r[0] ? mediaUrl(r[0].key) : null;
}
