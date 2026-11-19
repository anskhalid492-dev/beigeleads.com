/* eslint-disable @typescript-eslint/ban-ts-comment -- the generated worker file only exists after a build */
// Wraps the OpenNext worker so we can add Cron Triggers (OpenNext only exports `fetch`).
// wrangler.jsonc "main" points here. See https://opennext.js.org/cloudflare/howtos/custom-worker
// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { publishDue } from "./lib/blog/posts";
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
 * Public blog pages are rendered from D1 + R2, which costs CPU on every visit. Anonymous GET requests for them are
 * kept in the Cloudflare edge cache for 60 s, so most visits never reach the Next.js renderer.
 * Consequence: a publish / unpublish / edit can take up to 60 s to show on the public page.
 * Not cached: search results (?q=), pages with cookies, Next.js RSC requests, non-200 responses.
 */
async function cachedBlog(request: Request, env: CloudflareEnv, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const cacheable = request.method === "GET" && (url.pathname === "/blog" || url.pathname.startsWith("/blog/")) && !url.searchParams.has("q") && !request.headers.has("cookie") && !request.headers.has("rsc") && !url.searchParams.has("_rsc");
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

export default {
  fetch: async (request: Request, env: CloudflareEnv, ctx: ExecutionContext) => (await managedRedirect(request, env)) ?? cachedBlog(request, env, ctx),

  async scheduled(event, env, ctx) {
    // Cron expressions are set in wrangler.jsonc: every minute = payment watcher, every 15 min = expiry sweep.
    if (event.cron === "*/15 * * * *") ctx.waitUntil(expireStaleAttempts(env));
    else {
      ctx.waitUntil(runPaymentWatcher(env));
      // Scheduled blog articles. Failures (for example the blog migration not applied yet) must never stop payment watching.
      ctx.waitUntil(publishDue(env).catch(() => 0));
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
