// Everything a public glossary page needs, read from D1 (published entries only unless preview is asked for).
import { and, inArray } from "drizzle-orm";
import { getProduct, getProducts, type Product } from "@/lib/catalog";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";
import { live } from "@/lib/blog/posts";
import { autoMeta, autoTitle, MIN_PUBLISH, startsWithQuestion } from "./clean";
import { getCategories, publishedCards, resolveRelated, rowEntry, type Card, type Term } from "./store";
import type { GCategory } from "./categories";

type Db = ReturnType<typeof getDbFromEnv>;
export type GuideLink = { title: string; excerpt: string; href: string };
export type TermView = { entry: ReturnType<typeof rowEntry>; id: number; category: GCategory | null; related: Card[]; sameCategory: Card[]; guides: GuideLink[]; products: Product[]; updatedAt: Date };

/** A page is indexable only when it carries real substance. Thin pages stay noindex. */
export const isThin = (t: { shortDefinition: string; content: string }) => t.shortDefinition.length < MIN_PUBLISH.short || t.content.length < MIN_PUBLISH.content;
export const seoOf = (t: Term) => ({ title: t.seoTitle && startsWithQuestion(t.seoTitle) ? t.seoTitle : autoTitle(t.term), description: t.metaDescription || autoMeta(t.shortDefinition) });

export async function guideLinks(db: Db, refs: string[]): Promise<GuideLink[]> {
  const wanted = refs.map((r) => r.trim().replace(/^\/?(guides|blog)\//, "").replace(/^\/+|\/+$/g, "")).filter(Boolean).slice(0, 12);
  if (!wanted.length) return [];
  try {
    const rows = await db.select({ slug: schema.blogPosts.slug, title: schema.blogPosts.title, excerpt: schema.blogPosts.excerpt, kind: schema.blogPosts.kind }).from(schema.blogPosts).where(and(inArray(schema.blogPosts.slug, wanted), live()));
    return wanted.flatMap((w) => { const r = rows.find((x) => x.slug === w); return r ? [{ title: r.title, excerpt: r.excerpt, href: `${r.kind === "guide" ? "/guides" : "/blog"}/${r.slug}` }] : []; });
  } catch { return []; }
}
export function productsFor(refs: string[]): Product[] {
  const all = getProducts();
  const out: Product[] = [];
  for (const r of refs) { const k = r.trim().toLowerCase(); const p = getProduct(k) ?? all.find((x) => x.name.toLowerCase() === k); if (p && !out.includes(p)) out.push(p); }
  return out.slice(0, 4);
}

export async function buildView(db: Db, t: Term): Promise<TermView> {
  const entry = rowEntry(t);
  const [cats, related, all, guides] = await Promise.all([getCategories(db), resolveRelated(db, entry.relatedTerms, t.slug), publishedCards(db), guideLinks(db, entry.relatedGuides)]);
  const category = cats.find((c) => c.slug === t.categorySlug) ?? null;
  const relSlugs = new Set(related.map((r) => r.slug));
  const sameCategory = all.filter((c) => c.category === t.categorySlug && c.slug !== t.slug && !relSlugs.has(c.slug)).slice(0, 6);
  return { entry, id: t.id, category, related, sameCategory, guides, products: productsFor(entry.relatedProducts), updatedAt: new Date(t.updatedAt * 1000) };
}

/** One contextual call to action, chosen by the topic of the term. */
export function ctaFor(category: string): { title: string; text: string; href: string; label: string } {
  if (["b2b-databases", "b2c-data", "data-segmentation", "crm"].includes(category)) return { title: "See real lists", text: "Every list page shows a masked sample, so you can judge the data before you buy.", href: "/lists", label: "Browse lists" };
  if (["lead-generation", "sales-prospecting"].includes(category)) return { title: "Need a specific audience?", text: "Tell us the industry, place and size you need and we will say what we can source.", href: "/custom-list", label: "Build my custom list" };
  if (["email-verification", "data-enrichment"].includes(category)) return { title: "See how we verify data", text: "In-house SMTP checks, and every list is re-verified every 60 days.", href: "/verification", label: "How verification works" };
  if (category === "privacy-compliance") return { title: "How we handle compliance", text: "Read how we source data, what you agree to when you buy and how opt-outs work.", href: "/legal/lawful-use", label: "Read the lawful-use policy" };
  return { title: "Check the data first", text: "Request a free masked sample and judge the quality yourself.", href: "/sample", label: "Request a free sample" };
}
