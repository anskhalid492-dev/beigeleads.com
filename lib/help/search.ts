import type { HelpArticle } from "./types";

export type SearchDoc = { id: string; href: string; category: string; categoryName: string; title: string; description: string; keywords: string[]; text: string };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const STOP = new Set(["the", "a", "an", "and", "or", "to", "of", "my", "i", "is", "do", "how", "what", "for", "in", "on", "it", "can", "me", "with"]);
export const tokens = (q: string) => norm(q).split(" ").filter((t) => t && !STOP.has(t));

/** Edit distance, stopping early once it exceeds `max`. */
export function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** How well one query token matches a field: 3 exact word, 2 word prefix, 1 typo-tolerant, 0 none. */
function tokenMatch(t: string, words: string[], joined: string): number {
  if (words.includes(t)) return 3;
  if (t.length >= 3 && words.some((w) => w.startsWith(t))) return 2;
  if (t.length >= 4 && joined.includes(t)) return 2;
  if (t.length >= 4) {
    const max = t.length >= 8 ? 2 : 1;
    if (words.some((w) => w.length >= 3 && distance(t, w, max) <= max)) return 1;
  }
  return 0;
}

export function searchDocs(docs: readonly SearchDoc[], query: string, category?: string, limit = 8): SearchDoc[] {
  const qt = tokens(query);
  if (qt.length === 0) return [];
  const scored: { d: SearchDoc; s: number }[] = [];
  for (const d of docs) {
    if (category && d.category !== category) continue;
    const fields: [number, string][] = [[6, d.title], [4, d.keywords.join(" ")], [2, d.description], [1, d.text], [1, d.categoryName]];
    const prepared = fields.map(([w, f]) => { const n = norm(f); return { w, words: n.split(" "), joined: n }; });
    let total = 0, matched = 0;
    for (const t of qt) {
      let best = 0;
      for (const f of prepared) best = Math.max(best, tokenMatch(t, f.words, f.joined) * f.w);
      if (best > 0) matched++;
      total += best;
    }
    if (matched === 0) continue;
    // Prefer articles that match every word.
    scored.push({ d, s: total * (matched === qt.length ? 2 : 1) });
  }
  return scored.sort((a, b) => b.s - a.s || a.d.title.localeCompare(b.d.title)).slice(0, limit).map((x) => x.d);
}

/** Split text into parts, marking the parts that match a query word (for highlighting). */
export function highlight(text: string, query: string): { t: string; hit: boolean }[] {
  const qt = tokens(query).filter((t) => t.length >= 2);
  if (qt.length === 0) return [{ t: text, hit: false }];
  const re = new RegExp(`(${qt.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return text.split(re).filter(Boolean).map((t, i) => ({ t, hit: i % 2 === 1 }));
}

export function toDoc(a: HelpArticle, categoryName: string, text: string): SearchDoc {
  return { id: `${a.category}/${a.slug}`, href: `/help/${a.category}/${a.slug}`, category: a.category, categoryName, title: a.title, description: a.description, keywords: [...a.keywords], text };
}
