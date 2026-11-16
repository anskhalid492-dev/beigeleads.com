import { hmac, safeEqual } from "./crypto";

export const SESSION_COOKIE = "__Host-bl_admin";
export const SESSION_SECONDS = 15 * 60; // short on purpose: wallet changes need a fresh login

export async function createSessionValue(secret: string, email: string, now = Date.now()): Promise<string> {
  const body = `${Math.floor(now / 1000) + SESSION_SECONDS}.${encodeURIComponent(email)}`;
  return `${body}.${await hmac(secret, body)}`;
}

/** Returns the email the session was issued to, or null. */
export async function readSessionValue(secret: string | undefined, value: string | undefined, now = Date.now()): Promise<string | null> {
  if (!secret || !value) return null;
  const i = value.lastIndexOf(".");
  const body = value.slice(0, i);
  if (i < 0 || !safeEqual(await hmac(secret, body), value.slice(i + 1))) return null;
  const dot = body.indexOf(".");
  const exp = body.slice(0, dot), email = body.slice(dot + 1);
  if (dot < 0 || !exp || !email || Number(exp) < Math.floor(now / 1000)) return null;
  return decodeURIComponent(email);
}
