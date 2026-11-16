import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAccessJwt, type AdminIdentity } from "./access";

/** Call at the top of every admin page and server action. Throws when the caller is not an admin. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const { env } = getCloudflareContext();
  const token = (await headers()).get("cf-access-jwt-assertion");
  const who = await verifyAccessJwt(token, { domain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD });
  if (!who) throw new Error("forbidden");
  // Optional extra allow-list (comma separated). Access policy stays the primary gate.
  const allow = env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allow?.length && !allow.includes(who.email)) throw new Error("forbidden");
  return who;
}
