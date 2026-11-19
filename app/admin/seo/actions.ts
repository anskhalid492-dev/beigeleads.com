"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/admin/require-admin";
import { saveSeoSettings } from "@/lib/seo/settings";

export async function saveSeoSettingsAction(input: { siteName: string; defaultDescription: string; defaultOgImage: string; twitterSite: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    await saveSeoSettings(getCloudflareContext().env, admin.email, input);
    revalidatePath("/admin/seo/settings");
    return { ok: true };
  } catch (e) {
    if (e instanceof ZodError) return { ok: false, error: e.issues[0]?.message ?? "Some fields are not valid." };
    return { ok: false, error: "Could not save. Check that migration 0014 has been run, then try again." };
  }
}

import { RedirectError, deleteRedirect, saveRedirect, setRedirectEnabled } from "@/lib/seo/redirects";
import { excludePath, includePath } from "@/lib/seo/sitemap";

type R = { ok: true } | { ok: false; error: string };
async function run(fn: (env: CloudflareEnv, actor: string) => Promise<void>, paths: string[]): Promise<R> {
  try {
    const admin = await requireAdmin();
    await fn(getCloudflareContext().env, admin.email);
    for (const p of paths) revalidatePath(p);
    return { ok: true };
  } catch (e) {
    if (e instanceof RedirectError || (e instanceof Error && e.message.startsWith("Enter a path"))) return { ok: false, error: e.message };
    return { ok: false, error: "Could not save. Check that migration 0015 has been run, then try again." };
  }
}

export const saveRedirectAction = async (i: { id?: number; from: string; to: string; status: number; note?: string }) => run((env, who) => saveRedirect(env, who, i), ["/admin/seo/redirects"]);
export const toggleRedirectAction = async (id: number, enabled: boolean) => run((env, who) => setRedirectEnabled(env, who, id, enabled), ["/admin/seo/redirects"]);
export const deleteRedirectAction = async (id: number) => run((env) => deleteRedirect(env, id), ["/admin/seo/redirects"]);
export const excludePathAction = async (path: string) => run((env, who) => excludePath(env, who, path), ["/admin/seo/sitemap"]);
export const includePathAction = async (path: string) => run((env) => includePath(env, path), ["/admin/seo/sitemap"]);
