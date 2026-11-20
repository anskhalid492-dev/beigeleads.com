/** Articles, guides and case studies share one CMS (same tables, editor, revisions, SEO tab). `kind` keeps them apart everywhere. */
export type Kind = "blog" | "guide" | "case";
export const KINDS: Record<Kind, { admin: string; pub: string; one: string; many: string; media: string }> = {
  blog: { admin: "/admin/blog", pub: "/blog", one: "article", many: "articles", media: "blog" },
  guide: { admin: "/admin/guides", pub: "/guides", one: "guide", many: "guides", media: "blog" },
  case: { admin: "/admin/case-studies", pub: "/case-studies", one: "case study", many: "case studies", media: "blog" },
};
export const asKind = (v: unknown): Kind => (v === "guide" ? "guide" : v === "case" ? "case" : "blog");
/** Guides and case studies are admin-managed; blog editors only work on blog drafts. */
export const adminOnly = (k: unknown) => k === "guide" || k === "case";
/** Where a category filter lives on the public site. */
export const catHref = (k: Kind, slug: string) => (k === "blog" ? `/blog/category/${slug}` : `${KINDS[k].pub}?category=${slug}`);
