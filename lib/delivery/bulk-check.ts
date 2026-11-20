// Pure rules for bulk delivery links, shared by the browser preview and the server (no database, no Node-only imports).
export type LinkTarget = { slug: string; name: string; status: string; packages: string[] };
export type LinkRow = { slug: string; pkg: string; url: string };
export type LinkOutcome = { slug: string; pkg: string; result: "added" | "replaced" | "same" | "skipped" | "failed"; reason?: string };

/** Same rule as lib/delivery/links.ts parseDeliveryUrl: https only. */
function parseUrl(raw: string): string {
  const v = raw.trim();
  let u: URL;
  try { u = new URL(v); } catch { throw new Error("That is not a valid link."); }
  if (u.protocol !== "https:") throw new Error("The link must start with https://");
  if (v.length > 2000) throw new Error("The link is too long.");
  return u.toString();
}

export function checkRow(r: LinkRow, targets: Map<string, LinkTarget>): { ok: true; url: string } | { ok: false; reason: string } {
  const t = targets.get(r.slug);
  if (!t) return { ok: false, reason: "unknown product" };
  if (r.pkg !== "" && !t.packages.includes(r.pkg)) return { ok: false, reason: `unknown package "${r.pkg}"` };
  try { return { ok: true, url: parseUrl(r.url) }; } catch (e) { return { ok: false, reason: e instanceof Error ? e.message : "bad link" }; }
}
