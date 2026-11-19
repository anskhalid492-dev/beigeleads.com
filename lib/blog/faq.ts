import { plainText, type DocNode } from "./doc";

/**
 * Pulls question/answer pairs out of a guide for FAQPage structured data: the H2 "Frequently Asked Questions",
 * each H3 below it is a question, the paragraphs/lists up to the next heading are its answer. Only what the page
 * really shows is returned.
 */
export function faqOf(doc: DocNode): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  let inFaq = false;
  let cur: { q: string; a: string[] } | null = null;
  const flush = () => { if (cur && cur.a.join(" ").trim()) out.push({ q: cur.q, a: cur.a.join(" ").replace(/\s+/g, " ").trim().slice(0, 1200) }); cur = null; };
  for (const n of doc.content ?? []) {
    if (n.type === "heading") {
      const level = Number(n.attrs?.level ?? 2);
      const text = plainText(n).trim();
      if (level <= 2) { flush(); inFaq = /frequently asked questions|^faqs?$/i.test(text); continue; }
      if (inFaq && level === 3) { flush(); cur = { q: text, a: [] }; continue; }
    } else if (inFaq && cur) cur.a.push(plainText(n));
  }
  flush();
  return out;
}
