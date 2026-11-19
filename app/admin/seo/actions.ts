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

import sitemap from "@/app/sitemap";
import { AUDIT_BATCH, analyzeHtml, type PageAudit } from "@/lib/seo/audit";
import { SITE_URL } from "@/lib/site";

/**
 * Audits one batch of the site's OWN sitemap pages. The browser sends only an offset: every URL is built here from the
 * sitemap path on the fixed site origin, redirects are not followed, so this can never be pointed at another host.
 */
export async function auditBatchAction(offset: number): Promise<{ ok: true; total: number; next: number | null; pages: PageAudit[] } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const start = Math.max(0, Math.floor(Number(offset) || 0));
    const paths = (await sitemap()).map((e) => e.url.replace(SITE_URL, "") || "/").filter((p) => p.startsWith("/") && !p.startsWith("//"));
    const slice = paths.slice(start, start + AUDIT_BATCH);
    const pages = await Promise.all(slice.map(async (p): Promise<PageAudit> => {
      try {
        const res = await fetch(`${SITE_URL}${p}`, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "user-agent": "BeigeLeads-SEO-audit", accept: "text/html" } });
        const html = res.status < 300 ? (await res.text()).slice(0, 1_000_000) : "";
        return analyzeHtml(p, res.status, html);
      } catch { return { path: p, status: 0, issues: [{ kind: "verified", code: "fetch", text: "The page could not be fetched (timeout or network error)." }] }; }
    }));
    const next = start + AUDIT_BATCH < paths.length ? start + AUDIT_BATCH : null;
    return { ok: true, total: paths.length, next, pages };
  } catch { return { ok: false, error: "The audit could not run. Sign in again and retry." }; }
}

import { PageSeoError, resetPageOverride, savePageOverride } from "@/lib/seo/page-overrides";
import { isSitePage } from "@/lib/seo/page-registry";

export type PageSeoValues = { seoTitle: string; metaDescription: string; ogTitle: string; ogDescription: string; ogImage: string; canonicalUrl: string };

export async function savePageSeoAction(path: string, v: PageSeoValues): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    await savePageOverride(getCloudflareContext().env, admin.email, path, v);
    revalidatePath("/admin/seo/site-pages");
    return { ok: true };
  } catch (e) {
    if (e instanceof PageSeoError) return { ok: false, error: e.message };
    return { ok: false, error: "Could not save. Check that migration 0017 has been run, then try again." };
  }
}

export async function resetPageSeoAction(path: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = await requireAdmin();
    if (!isSitePage(path)) return { ok: false, error: "That page is not in the site page list." };
    await resetPageOverride(getCloudflareContext().env, admin.email, path);
    revalidatePath("/admin/seo/site-pages");
    return { ok: true };
  } catch { return { ok: false, error: "Could not reset. Try again." }; }
}

const grab = (html: string, re: RegExp) => (re.exec(html)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").trim();

/** Reads what the page serves right now (title and description). The path must be one of OUR pages: no other URL can be fetched. */
export async function liveSeoAction(path: string): Promise<{ ok: true; title: string; description: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    if (!isSitePage(path)) return { ok: false, error: "That page is not in the site page list." };
    const res = await fetch(`${SITE_URL}${path}`, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "user-agent": "BeigeLeads-SEO-admin", accept: "text/html" } });
    if (res.status !== 200) return { ok: false, error: `The page answered HTTP ${res.status}.` };
    const html = (await res.text()).slice(0, 1_000_000);
    return { ok: true, title: grab(html, /<title[^>]*>([\s\S]*?)<\/title>/i), description: grab(html, /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["']/i) || grab(html, /<meta\b[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["']/i) };
  } catch { return { ok: false, error: "Could not read the live page." }; }
}
