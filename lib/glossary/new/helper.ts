// Authoring helper for the 50-term glossary expansion (Nov 2026). Each entry becomes the normal `Entry` the glossary CMS stores.
// Rules: original text, no statistics, no prices, no counts, no legal advice, BeigeLeads mentioned only where it is genuinely relevant,
// third-party standards (SPF, DMARC, SMTP, GDPR, NAICS, WHOIS...) are described as public concepts, never as BeigeLeads technology.
import { slugify, type Entry } from "../clean";

export type G = {
  term: string; cat: string; full?: string; short: string; what: string; how: string; metrics?: string; myths: string; limits: string;
  bl?: string; why: string; example: string; related: string[]; learn?: string; seoTitle?: string; kw?: string;
};

export function g(x: G): Entry {
  const parts = [
    x.full ? `**Full form:** ${x.full}.` : "",
    x.what, "## How it works", x.how,
    x.metrics ? `## Related metrics\n${x.metrics}` : "",
    `## Common misconceptions\n${x.myths}`, `## Limitations\n${x.limits}`,
    x.bl ? `## Relevance at BeigeLeads\n${x.bl}` : "",
    x.learn ? `## Learn more\n${x.learn}` : "",
  ].filter(Boolean);
  return {
    slug: slugify(x.term), term: x.term, category: x.cat, shortDefinition: x.short, content: parts.join("\n\n"), whyItMatters: x.why, example: x.example,
    relatedTerms: x.related, relatedGuides: [], relatedProducts: [], seoTitle: x.seoTitle ?? "", metaDescription: "", keywords: x.kw ?? "", status: "draft",
  };
}
