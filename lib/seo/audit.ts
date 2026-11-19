/** Pure HTML audit of one page. Verified issues come from facts in the HTML; "tip" items are heuristics. */
export type AuditIssue = { kind: "verified" | "tip"; code: string; text: string };
export type PageAudit = { path: string; status: number; issues: AuditIssue[] };

const attr = (tag: string, name: string) => new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag)?.[2] ?? new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(tag)?.[3] ?? null;
const strip = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

export function analyzeHtml(path: string, status: number, html: string): PageAudit {
  const issues: AuditIssue[] = [];
  const v = (code: string, text: string) => issues.push({ kind: "verified", code, text });
  const tip = (code: string, text: string) => issues.push({ kind: "tip", code, text });
  if (status >= 400) { v("status", `The page answers with HTTP ${status}.`); return { path, status, issues }; }
  if (status >= 300) { v("redirect", `The page redirects (HTTP ${status}). The sitemap should list the final address.`); return { path, status, issues }; }

  const title = strip(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  if (!title) v("title-missing", "No <title>.");
  else if (title.length > 65) tip("title-long", `The title is ${title.length} characters; search results may cut it.`);
  else if (title.length < 20) tip("title-short", `The title is only ${title.length} characters.`);

  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const desc = metas.find((m) => attr(m, "name")?.toLowerCase() === "description");
  const d = desc ? (attr(desc, "content") ?? "").trim() : "";
  if (!d) v("meta-missing", "No meta description.");
  else if (d.length < 70 || d.length > 160) tip("meta-length", `The meta description is ${d.length} characters (70–160 is a common target).`);

  const canon = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => attr(l, "rel")?.toLowerCase() === "canonical");
  if (canon.length === 0) v("canonical-missing", "No canonical link.");
  else if (canon.length > 1) v("canonical-multiple", "More than one canonical link.");

  const h1 = [...html.matchAll(/<h1\b[\s\S]*?<\/h1>/gi)].length;
  if (h1 === 0) v("h1-missing", "No H1 heading.");
  else if (h1 > 1) v("h1-multiple", `${h1} H1 headings; use one.`);

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((i) => attr(i, "alt") === null).length;
  if (noAlt) v("img-alt", `${noAlt} image${noAlt === 1 ? "" : "s"} without an alt attribute.`);

  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let bad = 0; const types: string[] = [];
  for (const j of ld) { try { const o = JSON.parse(j); for (const x of Array.isArray(o) ? o : [o]) types.push(String(x?.["@type"] ?? "")); } catch { bad++; } }
  if (bad) v("jsonld-invalid", `${bad} JSON-LD block${bad === 1 ? " is" : "s are"} not valid JSON.`);
  const dup = types.filter((t, i) => t && types.indexOf(t) !== i && ["Organization", "WebSite", "BreadcrumbList"].includes(t));
  if (dup.length) v("jsonld-duplicate", `Duplicate JSON-LD type: ${[...new Set(dup)].join(", ")}.`);

  const words = strip(html.replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/gi, " ")).split(" ").filter(Boolean).length;
  if (words < 150) tip("thin", `About ${words} words of body text; consider whether the page says enough.`);
  return { path, status, issues };
}

export const AUDIT_BATCH = 15;
