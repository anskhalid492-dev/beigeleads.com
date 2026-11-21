// Pilo's live view of the Glossary and Help Center. Nothing is copied into the assistant's prompt or knowledge table:
// published entries are read from the same stores as the public pages (KV cache, 60 s), so publish/update/unpublish/delete
// reach Pilo within about a minute and unpublished or deleted content is never retrieved. Drafts are never read.
import { eq } from "drizzle-orm";
import { getDbFromEnv, schema } from "@/lib/db";
import { plain } from "@/lib/glossary/clean";

type Env = { DB: D1Database; CACHE: KVNamespace };
export const GLOSSARY_KV = "beigepilot:glossary:v1";
export type GDoc = { slug: string; term: string; short: string; text: string; keywords: string; category: string; rev: number };

const strip = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#*>_`]/g, " ").replace(/\s+/g, " ").trim();

export async function glossaryDocs(env: Env): Promise<GDoc[]> {
  try { const hit = await env.CACHE.get<GDoc[]>(GLOSSARY_KV, "json"); if (hit) return hit; } catch { /* read the database */ }
  let docs: GDoc[] = [];
  try {
    const rows = await getDbFromEnv(env).select().from(schema.glossaryTerms).where(eq(schema.glossaryTerms.status, "published"));
    docs = rows.map((r) => ({ slug: r.slug, term: r.term, short: r.shortDefinition, text: strip(`${r.content} ${r.whyItMatters} ${r.example}`).slice(0, 4000), keywords: plain(r.keywords ?? "", 300), category: r.categorySlug, rev: r.updatedAt }));
  } catch { return []; }
  try { await env.CACHE.put(GLOSSARY_KV, JSON.stringify(docs), { expirationTtl: 60 }); } catch { /* optional */ }
  return docs;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["the", "a", "an", "is", "are", "what", "does", "do", "mean", "means", "meaning", "of", "in", "and", "or", "to", "me", "explain", "define", "definition", "term", "glossary", "how", "work", "works"]);

/** Score terms: exact term/acronym > term words > keywords > short definition > body. Pure and tested. */
export function searchGlossary(docs: readonly GDoc[], query: string, limit = 3): GDoc[] {
  const q = norm(query);
  const words = q.split(" ").filter((w) => w && !STOP.has(w));
  if (!words.length) return [];
  const scored = docs.map((d) => {
    const t = norm(d.term), acr = (d.term.match(/\(([^)]+)\)/)?.[1] ?? "").toLowerCase(), tw = t.split(" ");
    const base = norm(d.term.replace(/\([^)]*\)/g, ""));
    let s = 0;
    if (q === t || q === base || (acr && q === acr)) s += 100;
    else if (words.join(" ") === base || (acr && words.join(" ") === acr)) s += 90;
    const kw = norm(d.keywords).split(" "), sh = norm(d.short), tx = norm(d.text);
    for (const w of words) {
      if (tw.includes(w) || w === acr) s += 12;
      else if (kw.includes(w)) s += 6;
      if (sh.includes(w)) s += 3;
      if (tx.includes(w)) s += 1;
    }
    return { d, s };
  }).filter((x) => x.s >= 12).sort((a, b) => b.s - a.s || a.d.term.localeCompare(b.d.term));
  return scored.slice(0, limit).map((x) => x.d);
}
