import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Returns a Drizzle client bound to the D1 database (binding name: DB). */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

/** For code that runs outside a request (Cron Triggers): there is no request context, so pass env directly. */
export function getDbFromEnv(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema });
}

export { schema };
