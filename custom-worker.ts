/* eslint-disable @typescript-eslint/ban-ts-comment -- the generated worker file only exists after a build */
// Wraps the OpenNext worker so we can add Cron Triggers (OpenNext only exports `fetch`).
// wrangler.jsonc "main" points here. See https://opennext.js.org/cloudflare/howtos/custom-worker
// @ts-ignore `.open-next/worker.js` is generated at build time
import { default as handler } from "./.open-next/worker.js";
import { expireStaleAttempts, runPaymentWatcher } from "./lib/payments/watcher";

export default {
  fetch: handler.fetch,

  async scheduled(event, env, ctx) {
    // Cron expressions are set in wrangler.jsonc: every minute = payment watcher, every 15 min = expiry sweep.
    if (event.cron === "*/15 * * * *") ctx.waitUntil(expireStaleAttempts(env));
    else ctx.waitUntil(runPaymentWatcher(env));
  },
} satisfies ExportedHandler<CloudflareEnv>;

// @ts-ignore generated at build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
