import { eq } from "drizzle-orm";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";

type Db = ReturnType<typeof getDbFromEnv>;
export type GeoContent = { seoTitle: string; metaDescription: string; intro: string; primaryKeyword: string; secondaryKeywords: string };
export const EMPTY: GeoContent = { seoTitle: "", metaDescription: "", intro: "", primaryKeyword: "", secondaryKeywords: "" };

/** Owner-written copy for one geography page. Never throws: before migration 0029 every page uses the generated copy. */
export async function getGeoContent(db: Db, path: string): Promise<GeoContent> {
  try {
    const [r] = await db.select().from(schema.geoPageContent).where(eq(schema.geoPageContent.path, path));
    return r ? { seoTitle: r.seoTitle, metaDescription: r.metaDescription, intro: r.intro, primaryKeyword: r.primaryKeyword, secondaryKeywords: r.secondaryKeywords } : EMPTY;
  } catch { return EMPTY; }
}

export function cleanGeoContent(raw: Partial<Record<keyof GeoContent, unknown>>): { value?: GeoContent; error?: string } {
  const s = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").trim().slice(0, n);
  const v: GeoContent = { seoTitle: s(raw.seoTitle, 90), metaDescription: s(raw.metaDescription, 200), intro: s(raw.intro, 900), primaryKeyword: s(raw.primaryKeyword, 100), secondaryKeywords: s(raw.secondaryKeywords, 300) };
  if (v.seoTitle && v.seoTitle.length < 10) return { error: "The SEO title is too short." };
  if (v.metaDescription && v.metaDescription.length < 50) return { error: "The meta description is too short (at least 50 characters)." };
  return { value: v };
}

export async function saveGeoContent(db: Db, path: string, v: GeoContent): Promise<void> {
  const empty = !v.seoTitle && !v.metaDescription && !v.intro && !v.primaryKeyword && !v.secondaryKeywords;
  if (empty) { await db.delete(schema.geoPageContent).where(eq(schema.geoPageContent.path, path)); return; }
  await db.insert(schema.geoPageContent).values({ path, ...v }).onConflictDoUpdate({ target: schema.geoPageContent.path, set: { ...v, updatedAt: Math.floor(Date.now() / 1000) } });
}

export async function allGeoContentPaths(db: Db): Promise<Set<string>> {
  try { return new Set((await db.select({ p: schema.geoPageContent.path }).from(schema.geoPageContent)).map((r) => r.p)); } catch { return new Set(); }
}

/** Plain checks shown next to the editor. Advice only: nothing here blocks saving. */
export function contentWarnings(v: GeoContent, h1: string): string[] {
  const w: string[] = [];
  const t = v.seoTitle || h1;
  if (t.length > 60) w.push(`The title is ${t.length} characters. Search results usually cut it after about 60.`);
  if (v.metaDescription && v.metaDescription.length > 160) w.push(`The meta description is ${v.metaDescription.length} characters. About 160 is the usual limit.`);
  if (v.primaryKeyword && !`${t} ${v.metaDescription} ${v.intro}`.toLowerCase().includes(v.primaryKeyword.toLowerCase())) w.push("The primary keyword does not appear in the title, description or intro.");
  if (v.intro && v.intro.length < 120) w.push("The intro is very short. Add what is actually recorded for this place.");
  return w;
}
