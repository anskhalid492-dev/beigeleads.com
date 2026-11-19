import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { createPost, savePost } from "./posts";
import { STARTERS, starterDoc } from "./starters";
import { saveUpload } from "./media";
import { BlogError, listCategories, listTags, saveCategory, saveTag } from "./taxonomy";
import { slugifyText } from "./doc";

/** Adds a starter article as a DRAFT through the normal CMS functions (revisions, media usage, reading time all work as usual). */
export async function createFromStarter(env: CloudflareEnv, actor: string, slug: string, authorId: number | null) {
  const s = STARTERS.find((x) => x.slug === slug);
  if (!s) throw new BlogError("Starter article not found.");
  const db = getDbFromEnv(env);
  const dup = await db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).where(eq(schema.blogPosts.slug, s.slug)).limit(1);
  if (dup[0]) throw new BlogError("An article with this URL already exists.");

  const kind = s.kind ?? "blog";
  let cat = (await listCategories(env, kind)).find((c) => c.slug === slugifyText(s.category));
  if (!cat) { await saveCategory(env, { name: s.category, kind }); cat = (await listCategories(env, kind)).find((c) => c.slug === slugifyText(s.category)); }
  let tags = await listTags(env);
  for (const t of s.tags) if (!tags.some((x) => x.slug === slugifyText(t))) await saveTag(env, { name: t });
  tags = await listTags(env);
  const tagIds = s.tags.map((t) => tags.find((x) => x.slug === slugifyText(t))?.id).filter((x): x is number => !!x);

  // Optional approved brand image: copied from the site's own static assets into the media library.
  let featuredImage: string | null = null;
  if (s.brandImage && env.ASSETS && /^\/brand\/[\w./-]+$/.test(s.brandImage) && !s.brandImage.includes("..")) {
    const res = await env.ASSETS.fetch(new Request(`https://assets.local${s.brandImage}`));
    if (res.ok) {
      const up = await saveUpload(env, actor, { name: s.brandImage.split("/").pop() ?? "brand", bytes: new Uint8Array(await res.arrayBuffer()) });
      featuredImage = up.url;
    }
  }

  const id = await createPost(env, actor, s.title, kind);
  await savePost(env, actor, id, {
    title: s.title, slug: s.slug, excerpt: s.excerpt, categoryId: cat?.id ?? null, author: "", authorId, featuredImage, featuredAlt: s.featuredAlt,
    seoTitle: s.seoTitle, metaDescription: s.metaDescription, canonicalUrl: "", noindex: false, ogTitle: "", ogDescription: "", ogImage: null, focusKeyword: s.focusKeyword,
    related: [], tagIds, scheduledAt: null, doc: starterDoc(s),
  }, 1, "manual");
  return id;
}
