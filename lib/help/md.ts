// Tiny authoring format for Help articles written in code. One line per block:
//   ## Heading | plain paragraph | "- " bullets (grouped) | "1. " steps (grouped) | "> " note
//   "!tip " / "!warning " / "!info " callouts | "? question || answer" FAQ lines (grouped)
// Output is the same Block[] the CMS stores, so everything is still cleaned by `cleanBlocks` on save and read.
import type { Block, HelpArticle } from "./types";

export function md(src: string): Block[] {
  const out: Block[] = [];
  let ul: string[] = [], ol: string[] = [], faq: [string, string][] = [];
  const flush = () => {
    if (ul.length) out.push(["ul", ul]); if (ol.length) out.push(["ol", ol]); if (faq.length) out.push(["faq", faq]);
    ul = []; ol = []; faq = [];
  };
  for (const raw of src.split("\n")) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    if (l.startsWith("- ")) { if (ol.length || faq.length) flush(); ul.push(l.slice(2)); continue; }
    if (/^\d+\. /.test(l)) { if (ul.length || faq.length) flush(); ol.push(l.replace(/^\d+\. /, "")); continue; }
    if (l.startsWith("? ")) { if (ul.length || ol.length) flush(); const [q, a] = l.slice(2).split(" || "); faq.push([q, a ?? ""]); continue; }
    flush();
    if (l.startsWith("## ")) out.push(["h", l.slice(3)]);
    else if (l.startsWith("> ")) out.push(["note", l.slice(2)]);
    else if (/^!(tip|warning|info) /.test(l)) { const k = l.slice(1, l.indexOf(" ")) as "tip" | "warning" | "info"; out.push(["callout", k, l.slice(l.indexOf(" ") + 1)]); }
    else out.push(["p", l]);
  }
  flush();
  return out;
}

export const REVIEWED = "2026-11-21";

/** Defines one Help article from the authoring format. */
export function art(category: string, slug: string, title: string, description: string, keywords: string, related: string, cta: [string, string] | null, body: string, seoTitle?: string): HelpArticle {
  return {
    category, slug, title, description, keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    related: related.split(",").map((k) => k.trim()).filter(Boolean), body: md(body),
    cta: cta ? { label: cta[0], href: cta[1] } : undefined, updated: REVIEWED, ...(seoTitle ? { seoTitle } : {}),
  };
}
