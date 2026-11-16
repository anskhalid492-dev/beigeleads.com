"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { verifyPassword, verifyTotp } from "@/lib/admin/crypto";
import { requireAccess } from "@/lib/admin/require-admin";
import { SESSION_COOKIE, SESSION_SECONDS, createSessionValue } from "@/lib/admin/session";
import { isRateLimited } from "@/lib/forms/rate-limit";
import { sha256Hex } from "@/lib/forms/hash";

export type LoginState = { message: string } | null;
const schema = z.object({ password: z.string().min(1).max(200), code: z.string().regex(/^\d{6}$/) });
const FAIL = { message: "Sign-in failed. Check your password and 6-digit code." };

export async function loginAction(_: LoginState, form: FormData): Promise<LoginState> {
  const { env } = getCloudflareContext();
  let who;
  try { who = await requireAccess(); } catch { return { message: "Not allowed." }; }
  const ip = (await headers()).get("cf-connecting-ip") ?? "unknown";
  const ipHash = await sha256Hex(`${env.HASH_SALT ?? ""}:admin:${ip}`);
  if (await isRateLimited(env.CACHE, "admin-login", ipHash, 8, 900)) return { message: "Too many attempts. Wait 15 minutes." };
  const p = schema.safeParse({ password: form.get("password"), code: form.get("code") });
  if (!p.success || !env.ADMIN_SESSION_SECRET) return FAIL;
  // Evaluate both factors every time so timing does not reveal which one was wrong.
  const [okPw, okCode] = await Promise.all([verifyPassword(p.data.password, env.ADMIN_PASSWORD_HASH), verifyTotp(env.ADMIN_TOTP_SECRET, p.data.code)]);
  if (!okPw || !okCode) return FAIL;
  (await cookies()).set(SESSION_COOKIE, await createSessionValue(env.ADMIN_SESSION_SECRET, who.email), {
    httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: SESSION_SECONDS,
  });
  redirect("/admin/wallets");
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
