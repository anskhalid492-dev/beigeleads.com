// Smooth reveal of a finished answer (providers do not stream tokens). Pure. Cuts only at word boundaries, never inside a link or **bold**,
// and a whole answer takes at most ~900 ms: no artificial waiting.
export function revealCut(text: string, words: number): string {
  const parts = text.split(/(\s+)/);
  let out = "", n = 0;
  for (const p of parts) { out += p; if (p.trim() && ++n >= words) break; }
  if (n < words) return text; // fewer words than asked: the whole text
  // hold back until a started link is complete
  while (/\[[^\]]*$/.test(out) || /\]\([^)]*$/.test(out)) { const nx = text.slice(out.length).match(/^\s*\S+/); if (!nx) return text; out += nx[0]; }
  if ((out.match(/\*\*/g)?.length ?? 0) % 2 === 1) out += "**";
  return out.trimEnd();
}
export const wordCount = (t: string) => t.split(/\s+/).filter(Boolean).length;
/** How many words to add per frame so the whole reveal lasts `ms` at about 60 ms per step. */
export const stepSize = (total: number, ms = 900, tick = 60) => Math.max(2, Math.ceil(total / Math.max(1, Math.floor(ms / tick))));
