// Download files: the starter entries and a blank template, as CSV, JSON and XLSX.
import { FIELDS, type Entry } from "./clean";
import { toCsv } from "./tabular";
import { writeXlsx } from "./xlsx";
import { STARTERS } from "./starters";

export const HEADERS = FIELDS.map((f) => f[1]);
const row = (e: Entry): string[] => [e.term, e.slug, e.category, e.shortDefinition, e.content, e.whyItMatters, e.example, e.relatedTerms.join("; "), e.relatedGuides.join("; "), e.relatedProducts.join("; "), e.seoTitle, e.metaDescription, e.keywords, e.status === "published" ? "Published" : "Draft"];
const EXAMPLE: Entry = { term: "Example Term", slug: "example-term", category: "B2B Databases", shortDefinition: "One or two sentences that define the term in plain words.", content: "The full explanation. Separate paragraphs with a blank line.\n\nYou can use **bold**, - bullet lines and [links](/lists).", whyItMatters: "Why a reader should care about this term.", example: "A short, concrete example.", relatedTerms: ["B2B Data"], relatedGuides: [], relatedProducts: [], seoTitle: "", metaDescription: "", keywords: "example, template", status: "draft" };

export type FileKind = "starter" | "template";
export type Format = "csv" | "json" | "xlsx";
export function buildFile(kind: FileKind, format: Format): { body: Uint8Array | string; type: string; name: string } {
  const entries = kind === "starter" ? STARTERS : [EXAMPLE];
  const base = kind === "starter" ? "beigeleads-glossary-starter" : "beigeleads-glossary-template";
  if (format === "json") return { body: JSON.stringify(entries.map((e) => ({ term: e.term, slug: e.slug, category: e.category, short_definition: e.shortDefinition, content: e.content, why_it_matters: e.whyItMatters, example: e.example, related_terms: e.relatedTerms, related_guides: e.relatedGuides, related_products: e.relatedProducts, seo_title: e.seoTitle, meta_description: e.metaDescription, keywords: e.keywords, status: e.status === "published" ? "Published" : "Draft" })), null, 2), type: "application/json", name: `${base}.json` };
  const grid = [HEADERS as string[], ...entries.map(row)];
  if (format === "xlsx") return { body: writeXlsx(grid), type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", name: `${base}.xlsx` };
  return { body: toCsv(grid), type: "text/csv; charset=utf-8", name: `${base}.csv` };
}
