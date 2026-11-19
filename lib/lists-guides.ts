// Published guides/articles related to a topic, for the catalog and geography pages. Never throws.
import { listPublished, type PublicCard } from "@/lib/blog/posts";

type Env = Parameters<typeof listPublished>[0];

/** Up to `limit` distinct published guides (then articles) that mention any of the terms. Empty when none exist. */
export async function relatedGuides(env: Env, terms: string[], limit = 3): Promise<(PublicCard & { kind: "guide" | "blog" })[]> {
  const out = new Map<string, PublicCard & { kind: "guide" | "blog" }>();
  try {
    for (const kind of ["guide", "blog"] as const) {
      for (const t of terms) {
        if (out.size >= limit) break;
        const r = await listPublished(env, { kind, q: t, per: limit });
        for (const c of r.cards) if (!out.has(`${kind}:${c.slug}`) && out.size < limit) out.set(`${kind}:${c.slug}`, { ...c, kind });
      }
    }
  } catch { /* blog tables missing */ }
  return [...out.values()];
}
