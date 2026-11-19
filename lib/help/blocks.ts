// Allow-list cleaning for article bodies. Runs on EVERY save and on every read from the database,
// so nothing outside these shapes can ever reach a page.
import type { Block } from "./types";

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").trim().slice(0, max) : "");
const strs = (v: unknown, max: number, count: number): string[] => (Array.isArray(v) ? v.map((x) => str(x, max)).filter(Boolean).slice(0, count) : []);
export const safeImageSrc = (s: string) => /^\/media\/[A-Za-z0-9._/-]+$/.test(s) || /^https:\/\/[^\s"'<>]+$/i.test(s);
export const safeHref = (s: string) => /^\/[A-Za-z0-9._~\-/?#=&%]*$/.test(s) || /^https:\/\/[^\s"'<>]+$/i.test(s);

export function cleanBlocks(input: unknown): Block[] {
  if (!Array.isArray(input)) return [];
  const out: Block[] = [];
  for (const b of input.slice(0, 200)) {
    if (!Array.isArray(b)) continue;
    switch (b[0]) {
      case "h": { const t = str(b[1], 200); if (t) out.push(["h", t]); break; }
      case "p": { const t = str(b[1], 5000); if (t) out.push(["p", t]); break; }
      case "note": { const t = str(b[1], 2000); if (t) out.push(["note", t]); break; }
      case "ul": case "ol": { const items = strs(b[1], 1000, 50); if (items.length) out.push([b[0], items]); break; }
      case "callout": {
        const kind = b[1] === "warning" || b[1] === "info" ? b[1] : "tip";
        const t = str(b[2], 2000);
        if (t) out.push(["callout", kind, t]);
        break;
      }
      case "table": {
        const head = strs(b[1], 120, 8);
        if (!head.length || !Array.isArray(b[2])) break;
        const rows = b[2].slice(0, 100).map((r: unknown) => head.map((_, i) => str(Array.isArray(r) ? r[i] : "", 500)));
        out.push(["table", head, rows.filter((r: string[]) => r.some(Boolean))]);
        break;
      }
      case "img": {
        const src = str(b[1], 500);
        if (!safeImageSrc(src)) break;
        const cap = str(b[3], 300);
        out.push(cap ? ["img", src, str(b[2], 300), cap] : ["img", src, str(b[2], 300)]);
        break;
      }
      case "faq": {
        if (!Array.isArray(b[1])) break;
        const pairs = b[1].slice(0, 30).map((p: unknown) => [str(Array.isArray(p) ? p[0] : "", 300), str(Array.isArray(p) ? p[1] : "", 3000)] as const).filter(([q, a]) => q && a);
        if (pairs.length) out.push(["faq", pairs]);
        break;
      }
    }
  }
  return out;
}

export const parseJson = <T>(s: string | null | undefined, fallback: T): T => { try { return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; } };
