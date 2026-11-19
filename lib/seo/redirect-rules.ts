/** Pure redirect rules: no database, safe to import in the Worker entry. */
export type RedirectMap = Record<string, [string, number]>;

/** Paths that can never be redirected: admin, API, assets, checkout and file delivery. */
const PROTECTED = ["/admin", "/api", "/_next", "/media", "/checkout", "/download", "/opt-out"];

export function normalizePath(raw: string): string {
  const p = raw.trim().split("#")[0].split("?")[0];
  if (p.length > 1 && p.endsWith("/")) return p.replace(/\/+$/, "") || "/";
  return p;
}

export const isProtected = (p: string) => PROTECTED.some((x) => p === x || p.startsWith(`${x}/`));

export type RuleCheck = { ok: true; from: string; to: string } | { ok: false; error: string };

/** Validates one rule against the existing ones (`others` excludes the rule being edited). */
export function checkRule(fromRaw: string, toRaw: string, status: number, others: Array<{ from: string; to: string }>): RuleCheck {
  if (status !== 301 && status !== 302) return { ok: false, error: "Use 301 (permanent) or 302 (temporary)." };
  const from = normalizePath(fromRaw);
  if (!from.startsWith("/") || from.startsWith("//") || /[\s<>"\\]/.test(from) || from.length > 300) return { ok: false, error: "The old address must be a path like /blog/old-article." };
  if (from === "/") return { ok: false, error: "The home page cannot be redirected." };
  if (isProtected(from)) return { ok: false, error: "Admin, API, checkout, download and media addresses cannot be redirected." };
  const t = toRaw.trim();
  let to: string;
  if (/^https:\/\//i.test(t)) {
    try { to = new URL(t).toString(); } catch { return { ok: false, error: "The new address is not a valid URL." }; }
    if (new URL(to).hostname.replace(/^www\./, "") === "beigeleads.com") to = normalizePath(new URL(to).pathname + new URL(to).search);
  } else if (t.startsWith("/") && !t.startsWith("//") && !/[\s<>"\\]/.test(t) && t.length <= 500) to = t.length > 1 ? t.replace(/\/+$/, "") || "/" : t;
  else return { ok: false, error: "The new address must be a path starting with / or an https:// URL." };
  if (to.length > 500) return { ok: false, error: "The new address is too long." };
  if (to.startsWith("/") && normalizePath(to) === from) return { ok: false, error: "The old and new address are the same." };
  // Loop and chain detection over internal targets.
  const map = new Map(others.map((o) => [o.from, o.to]));
  map.set(from, to);
  let cur = to; const seen = new Set([from]);
  for (let i = 0; i < 10 && cur.startsWith("/"); i++) {
    const key = normalizePath(cur);
    if (seen.has(key)) return { ok: false, error: "This would create a redirect loop." };
    seen.add(key);
    const next = map.get(key);
    if (!next) break;
    cur = next;
  }
  return { ok: true, from, to };
}

/** One hop. Query strings are kept for internal targets. */
export function findRedirect(map: RedirectMap | null, pathname: string, search: string): { location: string; status: number } | null {
  if (!map) return null;
  const hit = map[normalizePath(pathname)];
  if (!hit) return null;
  const [to, status] = hit;
  return { location: to.startsWith("/") && !to.includes("?") ? to + search : to, status };
}
