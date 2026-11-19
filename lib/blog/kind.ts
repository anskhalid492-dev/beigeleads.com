/** Articles and guides share one CMS (same tables, editor, revisions, SEO tab). `kind` keeps them apart everywhere. */
export type Kind = "blog" | "guide";
export const KINDS: Record<Kind, { admin: string; pub: string; one: string; many: string; media: string }> = {
  blog: { admin: "/admin/blog", pub: "/blog", one: "article", many: "articles", media: "blog" },
  guide: { admin: "/admin/guides", pub: "/guides", one: "guide", many: "guides", media: "blog" },
};
export const asKind = (v: unknown): Kind => (v === "guide" ? "guide" : "blog");
