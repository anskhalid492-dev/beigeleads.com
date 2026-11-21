// Reorganize "General Targeted Lists" (section 112): moves clearly local / healthcare / webmail / crypto lists into their own
// categories. Same safety model as the Local Businesses tool: only the category columns change, every move is logged in
// `catalog_category_moves` (reversible by batch), ambiguous products are only flagged.
import { and, eq, sql } from "drizzle-orm";
import { schema } from "@/lib/db";
import { categoryForSubject, slugify, subjectOf } from "@/lib/import/seo-text";
import { reservedSlugs } from "@/lib/import/reserved";
import { classifyLocal, LOCAL_NAME, LOCAL_SLUG } from "./local-business";

type Db = ReturnType<typeof import("@/lib/db").getDbFromEnv>;
const movesReady = async (db: Db) => { try { await db.select({ n: sql<number>`count(*)` }).from(schema.catalogCategoryMoves); return true; } catch { return false; } };
export type DestKey = "local" | "healthcare" | "webmail" | "crypto" | "exhibitors";
export type Dest = { slug: string; name: string };
export type Confidence = "high" | "review" | "none";
export type Verdict = { dest: DestKey | null; confidence: Confidence; reason: string };

export const DEFAULT_DESTS: Record<DestKey, Dest> = {
  local: { slug: LOCAL_SLUG, name: LOCAL_NAME },
  healthcare: { slug: "healthcare-lists", name: "Healthcare Lists" },
  webmail: { slug: "webmail-lists", name: "Webmail Lists" },
  crypto: { slug: "crypto-blockchain", name: "Crypto & Blockchain" },
  exhibitors: { slug: "exhibitors-email-lists", name: "Exhibitors Email Lists" },
};
/** Categories a moved product must keep: the load-time audience remap and the SEO category pass must not pull it back out. */
export const PROTECTED_CATS = new Set([LOCAL_SLUG, "healthcare-lists", "webmail-lists", "crypto-blockchain", "exhibitors-email-lists"]);
export const GTL_NAME = /^general targeted lists$/i;

const WEBMAIL = /\b(gmail|g-?mail|yahoo|hotmail|outlook|aol|webmail|icloud|protonmail|gmx|msn|live\.com|mail\.ru|yandex mail)\b/i;
export const EXHIBITOR = /\bexhibitors?\b/i;
const CRYPTO = /\b(crypto\w*|bitcoin|btc|ethereum|altcoins?|blockchain|web3|defi|nfts?|dogecoin|binance|coinbase|metaverse)\b/i;
const HEALTH_HIGH = /\b(dentists?|dental|orthodontists?|physicians?|doctors?|surgeons?|nurses?|nursing|medical|clinics?|hospitals?|pharmac\w+|therapists?|physiotherap\w+|chiropract\w+|veterinar\w+|vets?|optometr\w+|opticians?|psycholog\w+|psychiatr\w+|dermatolog\w+|cardiolog\w+|pediatric\w*|oncolog\w+|radiolog\w+|orthop\w+|neurolog\w+|midwi\w+|acupunct\w+|rehab\w*|healthcare|health care)\b/i;
const HEALTH_SOFT = /\b(health|wellness|medspa|med spa|caregivers?|senior care)\b/i;
const HEALTH_NOT = /\b(software|saas|insurance|marketing|billing|equipment|supplies|staffing|recruit\w*|consult\w*|investors?|app|apps)\b/i;
const BIZ = /\b(business|businesses|company|companies|b2b|ceo|owners?|founders?|executives?)\b/i;

/** Decide where ONE product from General Targeted Lists belongs. Reads only the product's own name; never guesses from the stored category. */
export function classifyGeneral(p: { name: string; categoryName: string; channel: string; grp?: string; countryName: string; region?: string | null }): Verdict {
  const subject = subjectOf({ name: p.name, categoryName: p.categoryName, channel: p.channel, countryName: p.countryName, region: p.region ?? "", recordCount: null, placeholder: false });
  const t = `${subject} ${p.name}`;
  if (EXHIBITOR.test(p.name)) return { dest: "exhibitors", confidence: "high", reason: "Trade show exhibitor list" };
  if (WEBMAIL.test(t)) return BIZ.test(subject) ? { dest: "webmail", confidence: "review", reason: "Names a webmail provider but also a business audience" } : { dest: "webmail", confidence: "high", reason: `Targets webmail users (${t.match(WEBMAIL)![0]})` };
  if (CRYPTO.test(t)) return { dest: "crypto", confidence: "high", reason: `Crypto or blockchain audience (${t.match(CRYPTO)![0]})` };
  if (HEALTH_HIGH.test(t)) return HEALTH_NOT.test(t) ? { dest: "healthcare", confidence: "review", reason: "Healthcare word mixed with software, insurance, marketing or supplies" } : { dest: "healthcare", confidence: "high", reason: `Healthcare audience (${t.match(HEALTH_HIGH)![0]})` };
  if (HEALTH_SOFT.test(t)) return { dest: "healthcare", confidence: "review", reason: "General health or wellness wording: check the audience" };
  const l = classifyLocal({ name: p.name, categoryName: p.categoryName, channel: p.channel, grp: p.grp, countryName: p.countryName, region: p.region });
  if (l.decision === "move") return { dest: "local", confidence: "high", reason: l.reason };
  if (l.decision === "review") return { dest: "local", confidence: "review", reason: l.reason };
  return { dest: null, confidence: "none", reason: "Stays in General Targeted Lists" };
}

export type GRow = Verdict & { own: Dest | null; id: number; slug: string; name: string; status: string; countryName: string; currentCategory: string; destName: string; alreadyMoved: boolean };
export type GScan = { own: number; rows: GRow[]; scanned: number; inGeneral: number; high: Record<DestKey, number>; review: number; keep: number; dests: Record<DestKey, Dest>; reused: DestKey[] };

/** Reuse an existing category (same meaning) instead of creating a duplicate. */
export async function resolveDests(db: Db): Promise<{ dests: Record<DestKey, Dest>; reused: DestKey[] }> {
  const dests = { ...DEFAULT_DESTS }; const reused: DestKey[] = [];
  const cats = await db.selectDistinct({ s: schema.catalogProducts.categorySlug, n: schema.catalogProducts.categoryName }).from(schema.catalogProducts);
  const find = (re: RegExp) => cats.find((c) => re.test(c.n) && !GTL_NAME.test(c.n));
  for (const [k, re] of [["healthcare", /^healthcare( lists)?$/i], ["webmail", /^webmail/i], ["crypto", /^crypto/i], ["exhibitors", /^exhibitors?/i]] as [DestKey, RegExp][]) {
    const c = find(re); if (c) { dests[k] = { slug: c.s, name: c.n }; reused.push(k); }
  }
  return { dests, reused };
}

/** What the General Targeted Lists page really shows: the product's category after the load-time audience remap. */
const effectiveCategory = (r: { categorySlug: string; categoryName: string; channel: string; countryName: string; region: string | null; name: string; recordCount: number | null }) => {
  if (PROTECTED_CATS.has(r.categorySlug)) return r.categoryName;
  const c = categoryForSubject(subjectOf({ name: r.name, categoryName: r.categoryName, channel: r.channel, countryName: r.countryName, region: r.region ?? "", recordCount: r.recordCount, placeholder: false }));
  return c ? c.name : r.categoryName;
};

export async function scanGeneral(db: Db): Promise<GScan> {
  const all = await db.select().from(schema.catalogProducts);
  const { dests, reused } = await resolveDests(db);
  const rows: GRow[] = [];
  // Own categories for products that match no destination: named after the list's audience; an existing category with the same meaning is reused.
  const key = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(ies)$/, "y").replace(/s$/, "");
  const cats = new Map<string, Dest>();
  for (const c of all) if (!GTL_NAME.test(c.categoryName) && !/^(job titles|healthcare professionals|targeted email lists)$/i.test(c.categoryName)) cats.set(key(c.categoryName), { slug: c.categorySlug, name: c.categoryName });
  const taken = reservedSlugs();
  const ownFor = (r: (typeof all)[number]): Dest | null => {
    const subject = subjectOf({ name: r.name, categoryName: r.categoryName, channel: r.channel, countryName: r.countryName, region: r.region ?? "", recordCount: r.recordCount, placeholder: false });
    if (!subject || /^business$/i.test(subject)) return null;
    const shared = categoryForSubject(subject); if (shared) return shared;
    let c = cats.get(key(subject));
    if (!c) { let slug = slugify(subject); if (!slug) return null; if (taken.has(slug)) slug = `${slug}-lists`; c = { slug, name: subject }; cats.set(key(subject), c); taken.add(slug); }
    return c;
  };
  for (const r of all) {
    if (r.status === "archived") continue;
    const eff = effectiveCategory(r);
    if (r.categorySlug === DEFAULT_DESTS.exhibitors.slug) continue;
    if (!GTL_NAME.test(eff) && !EXHIBITOR.test(r.name)) continue;
    const v = classifyGeneral({ name: r.name, categoryName: r.categoryName, channel: r.channel, grp: r.grp, countryName: r.countryName, region: r.region });
    const own = v.dest ? null : ownFor(r);
    rows.push({ ...v, own, id: r.id, slug: r.slug, name: r.name, status: r.status, countryName: r.countryName, currentCategory: eff, destName: v.dest ? dests[v.dest].name : own ? own.name : "General Targeted Lists", alreadyMoved: false });
  }
  const high = { local: 0, healthcare: 0, webmail: 0, crypto: 0, exhibitors: 0 } as Record<DestKey, number>;
  for (const r of rows) if (r.dest && r.confidence === "high") high[r.dest]++;
  return { own: rows.filter((r) => r.own).length, rows, scanned: all.length, inGeneral: rows.length, high, review: rows.filter((r) => r.confidence === "review").length, keep: rows.filter((r) => r.confidence === "none").length, dests, reused };
}

export async function applyGeneral(db: Db, picks: { slug: string }[], opts: { batch: string; includeReview: boolean }): Promise<{ moved: number; skipped: number }> {
  if (!(await movesReady(db))) throw new Error("migration 0040 missing");
  const scan = await scanGeneral(db);
  const want = new Set(picks.map((p) => p.slug));
  const now = Math.floor(Date.now() / 1000); let moved = 0;
  for (const r of scan.rows) {
    const ok = r.own ? true : !!r.dest && (r.confidence === "high" || (opts.includeReview && r.confidence === "review"));
    if (!want.has(r.slug) || !ok) continue;
    const to = r.dest ? scan.dests[r.dest] : r.own!; const row = (await db.select().from(schema.catalogProducts).where(eq(schema.catalogProducts.id, r.id)))[0];
    if (!row) continue;
    await db.batch([
      db.insert(schema.catalogCategoryMoves).values({ batch: opts.batch, productId: r.id, productSlug: r.slug, fromCategorySlug: row.categorySlug, fromCategoryName: row.categoryName, toCategorySlug: to.slug, reason: `${r.own ? "Own category by audience" : r.reason} [${r.own ? "own" : r.confidence}]`.slice(0, 200), movedAt: now }),
      db.update(schema.catalogProducts).set({ categorySlug: to.slug, categoryName: to.name, updatedAt: now }).where(and(eq(schema.catalogProducts.id, r.id))),
    ]);
    moved++;
  }
  return { moved, skipped: picks.length - moved };
}
