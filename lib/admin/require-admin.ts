import { cookies, headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAccessJwt, type AdminIdentity } from "./access";
import { SESSION_COOKIE, readSessionValue } from "./session";

/** Layer 1: Cloudflare Access. Used by the login page itself. */
export async function requireAccess(): Promise<AdminIdentity> {
  const { env } = getCloudflareContext();
  const token = (await headers()).get("cf-access-jwt-assertion");
  const who = await verifyAccessJwt(token, { domain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD });
  if (!who) throw new Error("forbidden");
  const allow = env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (allow?.length && !allow.includes(who.email)) throw new Error("forbidden");
  return who;
}

/** Layers 1 + 2: Access AND a valid, unexpired app login session for the same email. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const who = await requireAccess();
  const { env } = getCloudflareContext();
  const email = await readSessionValue(env.ADMIN_SESSION_SECRET, (await cookies()).get(SESSION_COOKIE)?.value);
  if (!email || email !== who.email) throw new Error("login required");
  return who;
}
