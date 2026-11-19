// Admin-managed catalog extras (migration 0030): countries, sub-industries, consumer categories.
// The static catalog (lib/catalog.ts) stays the source of truth for industries and products; these
// tables only ADD to it. Every read never throws: before the migration, only the static data shows.
import { asc, eq } from "drizzle-orm";
import { getCategory, getCountries, type Country } from "@/lib/catalog";
import { slugify } from "@/lib/geo/rules";
import { schema, type getDbFromEnv } from "@/lib/db";

type Db = ReturnType<typeof getDbFromEnv>;

export type Subindustry = { id: number; categorySlug: string; slug: string; name: string; description: string; enabled: boolean };
export type ConsumerCategory = { id: number; slug: string; name: string; description: string; enabled: boolean };
export type CountryRow = Country & { enabled: boolean; builtIn: boolean };

/** Static countries first, then enabled admin-added ones. */
export async function loadCountries(db: Db): Promise<Country[]> {
  const base = [...getCountries()];
  try {
    const rows = await db.select().from(schema.catalogCountries).where(eq(schema.catalogCountries.enabled, 1)).orderBy(asc(schema.catalogCountries.name)).limit(300);
    for (const r of rows) if (!base.some((c) => c.slug === r.slug)) base.push({ slug: r.slug, code: r.code, name: r.name });
  } catch { /* migration 0030 not applied */ }
  return base;
}

export async function findCountry(db: Db, slug: string): Promise<Country | undefined> {
  return (await loadCountries(db)).find((c) => c.slug === slug);
}

export async function allCountryRows(db: Db): Promise<{ ready: boolean; rows: CountryRow[] }> {
  const rows: CountryRow[] = getCountries().map((c) => ({ ...c, enabled: true, builtIn: true }));
  try {
    const extra = await db.select().from(schema.catalogCountries).orderBy(asc(schema.catalogCountries.name)).limit(300);
    for (const r of extra) if (!rows.some((c) => c.slug === r.slug)) rows.push({ slug: r.slug, code: r.code, name: r.name, enabled: r.enabled === 1, builtIn: false });
    return { ready: true, rows };
  } catch { return { ready: false, rows }; }
}

export async function loadSubindustries(db: Db, onlyEnabled = true): Promise<{ ready: boolean; rows: Subindustry[] }> {
  try {
    const q = db.select().from(schema.catalogSubindustries);
    const rows = await (onlyEnabled ? q.where(eq(schema.catalogSubindustries.enabled, 1)) : q).orderBy(asc(schema.catalogSubindustries.categorySlug), asc(schema.catalogSubindustries.name)).limit(1000);
    return { ready: true, rows: rows.filter((r) => getCategory(r.categorySlug)).map((r) => ({ ...r, enabled: r.enabled === 1 })) };
  } catch { return { ready: false, rows: [] }; }
}

export async function loadConsumerCategories(db: Db, onlyEnabled = false): Promise<{ ready: boolean; rows: ConsumerCategory[] }> {
  try {
    const q = db.select().from(schema.catalogConsumerCategories);
    const rows = await (onlyEnabled ? q.where(eq(schema.catalogConsumerCategories.enabled, 1)) : q).orderBy(asc(schema.catalogConsumerCategories.name)).limit(500);
    return { ready: true, rows: rows.map((r) => ({ ...r, enabled: r.enabled === 1 })) };
  } catch { return { ready: false, rows: [] }; }
}

// ---- validation (pure) ----
type Cleaned<T> = { value?: T; error?: string };
const text = (s: unknown, max: number) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function cleanCountry(i: { name?: unknown; code?: unknown }, taken: readonly string[] = []): Cleaned<{ slug: string; code: string; name: string }> {
  const name = text(i.name, 60);
  const code = String(i.code ?? "").trim().toUpperCase();
  if (name.length < 2) return { error: "Enter the country name." };
  if (!/^[A-Z]{2}$/.test(code)) return { error: "The country code must be 2 letters, for example DE." };
  const slug = slugify(name);
  if (!slug) return { error: "Use letters in the country name." };
  if (taken.includes(slug)) return { error: "That country already exists." };
  return { value: { slug, code, name } };
}

export function cleanSubindustry(i: { category?: unknown; name?: unknown; description?: unknown }): Cleaned<{ categorySlug: string; slug: string; name: string; description: string }> {
  const categorySlug = String(i.category ?? "");
  if (!getCategory(categorySlug)) return { error: "Pick the industry this belongs to." };
  const name = text(i.name, 80);
  if (name.length < 2) return { error: "Enter a name." };
  return { value: { categorySlug, slug: slugify(name), name, description: text(i.description, 300) } };
}

export function cleanConsumer(i: { name?: unknown; description?: unknown }): Cleaned<{ slug: string; name: string; description: string }> {
  const name = text(i.name, 80);
  if (name.length < 2) return { error: "Enter a name." };
  return { value: { slug: slugify(name), name, description: text(i.description, 300) } };
}

// ---- writes ----
export async function addCountry(db: Db, v: { slug: string; code: string; name: string }) {
  await db.insert(schema.catalogCountries).values({ ...v, enabled: 1 });
}
export async function setCountryEnabled(db: Db, slug: string, enabled: boolean) {
  await db.update(schema.catalogCountries).set({ enabled: enabled ? 1 : 0 }).where(eq(schema.catalogCountries.slug, slug));
}
/** A country that already has places or counts cannot be deleted (disable it instead). Returns false when refused. */
export async function deleteCountry(db: Db, slug: string): Promise<boolean> {
  const used = await db.select({ id: schema.geoAreas.id }).from(schema.geoAreas).where(eq(schema.geoAreas.countrySlug, slug)).limit(1).catch(() => []);
  if (used.length) return false;
  await db.delete(schema.catalogCountries).where(eq(schema.catalogCountries.slug, slug));
  return true;
}
export async function addSubindustry(db: Db, v: { categorySlug: string; slug: string; name: string; description: string }) {
  await db.insert(schema.catalogSubindustries).values({ ...v, enabled: 1 });
}
export async function updateSubindustry(db: Db, id: number, v: { name: string; description: string; enabled: boolean }) {
  await db.update(schema.catalogSubindustries).set({ name: v.name, description: v.description, enabled: v.enabled ? 1 : 0 }).where(eq(schema.catalogSubindustries.id, id));
}
export async function deleteSubindustry(db: Db, id: number) {
  await db.delete(schema.catalogSubindustries).where(eq(schema.catalogSubindustries.id, id));
}
export async function addConsumer(db: Db, v: { slug: string; name: string; description: string }) {
  await db.insert(schema.catalogConsumerCategories).values({ ...v, enabled: 0 });
}
export async function updateConsumer(db: Db, id: number, v: { name: string; description: string; enabled: boolean }) {
  await db.update(schema.catalogConsumerCategories).set({ name: v.name, description: v.description, enabled: v.enabled ? 1 : 0 }).where(eq(schema.catalogConsumerCategories.id, id));
}
export async function deleteConsumer(db: Db, id: number) {
  await db.delete(schema.catalogConsumerCategories).where(eq(schema.catalogConsumerCategories.id, id));
}
