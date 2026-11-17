import { cookies, headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { verifyAccessJwt, type AdminIdentity } from "./access";
import { isEditorEmail, type BlogUser } from "./roles";
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
  if (isEditorEmail(env.BLOG_EDITOR_EMAILS, who.email)) throw new Error("editor"); // editors never get the full admin
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) throw new Error("no-cookie");
  const email = await readSessionValue(env.ADMIN_SESSION_SECRET, raw);
  if (!email) throw new Error("bad-session");
  if (email !== who.email) throw new Error("email-mismatch");
  return who;
}

/**
 * Blog access. Admins: Access + app login (requireAdmin). Editors (var BLOG_EDITOR_EMAILS): Cloudflare Access only,
 * because Access already authenticates each person individually; they never get the shared admin password.
 */
export async function requireBlogUser(): Promise<BlogUser> {
  const { env } = getCloudflareContext();
  const token = (await headers()).get("cf-access-jwt-assertion");
  const who = await verifyAccessJwt(token, { domain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD });
  if (!who) throw new Error("forbidden");
  if (isEditorEmail(env.BLOG_EDITOR_EMAILS, who.email)) return { email: who.email, role: "editor" };
  const a = await requireAdmin();
  return { email: a.email, role: "admin" };
}
