/* eslint-disable @typescript-eslint/ban-ts-comment -- the generated worker file only exists after a build */
// Wraps the OpenNext worker so we can add Cron Triggers (OpenNext only exports `fetch`).
// wrangler.jsonc "main" points here. See https://opennext.js.org/cloudflare/howtos/custom-worker
// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { publishDue } from "./lib/blog/posts";
import { purgeOldSearches } from "./lib/help/analytics";
import { purgeCartEvents } from "./lib/cart/stats";
import { purgeOldPopupEvents } from "./lib/popups/store";
import { purgeEmailLogs } from "./lib/system-emails/webhook";
import { purgeUnanswered } from "./lib/beigepilot/leads";
import { purgeHistory } from "./lib/beigepilot/history";
import { getSettings as getBpSettings } from "./lib/beigepilot/store";
import { applyPageSeo, type PageOverrideMap } from "./lib/seo/page-rewrite";
import { findRedirect, isProtected, type RedirectMap } from "./lib/seo/redirect-rules";
import { expireStaleAttempts, runPaymentWatcher } from "./lib/payments/watcher";

const CACHE_SECONDS = 60;
const REDIRECT_KV_KEY = "seo:redirects:v1"; // written by lib/seo/redirects.ts

let redirectMap: { at: number; map: RedirectMap | null } | null = null;
/**
 * Admin-managed redirects. Reads ONE small KV value (kept in memory for 30 s per isolate), never D1.
 * A KV failure or a missing key means "no redirects": it can never break normal page serving.
 */
async function managedRedirect(request: Request, env: CloudflareEnv): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  if (isProtected(url.pathname) || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return null;
  const now = Date.now();
  if (!redirectMap || now - redirectMap.at > 30_000) {
    let map: RedirectMap | null = null;
    try { map = await env.CACHE.get<RedirectMap>(REDIRECT_KV_KEY, "json"); } catch { map = null; }
    redirectMap = { at: now, map };
  }
  const hit = findRedirect(redirectMap.map, url.pathname, url.search);
  return hit ? new Response(null, { status: hit.status, headers: { location: new URL(hit.location, url).toString(), "cache-control": hit.status === 301 ? "public, max-age=300" : "no-store" } }) : null;
}

/**
 * Public blog and Help Center pages are rendered from D1 (+ R2), which costs CPU on every visit. Anonymous GET requests for them are
 * kept in the Cloudflare edge cache for 60 s, so most visits never reach the Next.js renderer.
 * Consequence: a publish / unpublish / edit can take up to 60 s to show on the public page.
 * Not cached: search results (?q=), pages with cookies, Next.js RSC requests, non-200 responses.
 */
async function cachedBlog(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const cacheable = request.method === "GET" && (url.pathname === "/" || url.pathname === "/blog" || url.pathname.startsWith("/blog/") || url.pathname === "/guides" || url.pathname.startsWith("/guides/") || url.pathname === "/case-studies" || url.pathname.startsWith("/case-studies/") || url.pathname === "/glossary" || url.pathname.startsWith("/glossary/") || url.pathname === "/help-center" || url.pathname.startsWith("/help/") || url.pathname.startsWith("/lists/")) && !url.searchParams.has("q") && !request.headers.has("cookie") && !request.headers.has("rsc") && !url.searchParams.has("_rsc");
  if (!cacheable) return handler.fetch(request, env, ctx);
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const res: Response = await handler.fetch(request, env, ctx);
  if (res.status !== 200 || res.headers.has("set-cookie")) return res;
  const out = new Response(res.body, res);
  out.headers.set("cache-control", `public, max-age=0, s-maxage=${CACHE_SECONDS}`);
  ctx.waitUntil(cache.put(request, out.clone()));
  return out;
}

let pageSeo: { at: number; map: PageOverrideMap | null } | null = null;
/**
 * Admin page-SEO overrides (title, description, social tags, canonical). Pages stay static: the stored override is
 * applied to the HTML head on the way out, read from ONE KV value (30 s in-isolate memo). Any failure serves the page
 * untouched. Robots/noindex are never changed here.
 */
async function withPageSeo(request: Request, env: CloudflareEnv, res: Response): Promise<Response> {
  try {
    if (request.method !== "GET" || res.status !== 200 || !(res.headers.get("content-type") ?? "").includes("text/html")) return res;
    const url = new URL(request.url);
    if (isProtected(url.pathname) || url.pathname.startsWith("/blog/") || url.pathname.startsWith("/guides/") || url.pathname.startsWith("/case-studies/") || url.pathname.startsWith("/glossary/") || url.pathname.startsWith("/bundles/") || request.headers.has("rsc") || url.searchParams.has("_rsc")) return res;
    const now = Date.now();
    if (!pageSeo || now - pageSeo.at > 30_000) {
      let map: PageOverrideMap | null = null;
      try { map = await env.CACHE.get<PageOverrideMap>("seo:pages:v1", "json"); } catch { map = null; }
      pageSeo = { at: now, map };
    }
    const o = pageSeo.map?.[url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname];
    if (!o) return res;
    const html = applyPageSeo(await res.clone().text(), o, url.origin);
    const headers = new Headers(res.headers);
    headers.delete("content-length"); headers.delete("etag");
    return new Response(html, { status: res.status, headers });
  } catch { return res; }
}

export default {
  fetch: async (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => (await managedRedirect(request, env)) ?? withPageSeo(request, env, await cachedBlog(request, env, ctx)),

  async scheduled(event, env, ctx) {
    // Cron expressions are set in wrangler.jsonc: every minute = payment watcher, every 15 min = expiry sweep.
    // Heartbeat so the admin Maintenance page can show when each job last really ran.
    // Written every 5th minute only: KV on the free plan allows 1000 writes a day.
    if (event.cron === "*/15 * * * *" || new Date(event.scheduledTime).getUTCMinutes() % 5 === 0) ctx.waitUntil(env.CACHE.put(event.cron === "*/15 * * * *" ? "health:cron:sweep" : "health:cron:minute", String(Date.now()), { expirationTtl: 86400 }).catch(() => {}));
    if (event.cron === "*/15 * * * *") {
      ctx.waitUntil(expireStaleAttempts(env));
      // Help Center search words are kept 90 days. A missing table (migration 0021 not applied yet) must not matter.
      ctx.waitUntil(purgeOldSearches(env).catch(() => undefined));
      ctx.waitUntil(purgeEmailLogs(env).catch(() => undefined));
      ctx.waitUntil(import("./lib/sales/reward").then((m) => m.sendRewardReminders(env)).catch(() => undefined));
      ctx.waitUntil(import("./lib/sales/team").then((m) => m.sweepRequests(env)).catch(() => undefined));
      ctx.waitUntil(import("./lib/ev/store").then((m) => m.sweepEv(env)).catch(() => undefined));
      ctx.waitUntil(purgeUnanswered(env).catch(() => undefined));
      ctx.waitUntil(getBpSettings(env).then(({ s }) => purgeHistory(env, s.retentionDays)).catch(() => undefined));
      ctx.waitUntil(purgeOldPopupEvents(env).catch(() => undefined));
      ctx.waitUntil(purgeCartEvents(env));
      ctx.waitUntil(import("./lib/beigepilot/proactive/store").then((m) => m.purgeProEvents(env)).catch(() => undefined));
      ctx.waitUntil(import("./lib/beigepilot/v2/offers").then((m) => m.expireOffers(env)).catch(() => undefined));
    }
    else {
      ctx.waitUntil(runPaymentWatcher(env));
      // Scheduled blog articles. Failures (for example the blog migration not applied yet) must never stop payment watching.
      ctx.waitUntil(publishDue(env).catch(() => 0));
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
