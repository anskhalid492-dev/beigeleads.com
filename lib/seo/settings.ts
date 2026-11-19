import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv, schema } from "@/lib/db";

type Env = { DB: D1Database };

/** Only http(s) or a site path; anything else (javascript:, data:) is refused. */
const safeUrl = z.string().trim().max(500).refine((v) => v === "" || v.startsWith("/") || /^https:\/\//i.test(v), "Use an https:// address or a path starting with /.");

export const seoSettingsSchema = z.object({
  siteName: z.string().trim().max(60),
  defaultDescription: z.string().trim().max(320),
  defaultOgImage: safeUrl,
  twitterSite: z.string().trim().max(16).regex(/^(@?[A-Za-z0-9_]{1,15})?$/, "Use a handle like @beigeleads."),
});
export type SeoSettings = z.infer<typeof seoSettingsSchema>;

export const SEO_DEFAULTS: SeoSettings = {
  siteName: "BeigeLeads",
  defaultDescription: "Verified business contact lists by category, country and city. One-time purchase, no subscription.",
  defaultOgImage: "",
  twitterSite: "",
};

/** Stored values over built-in defaults. Never throws: before migration 0014 the defaults apply. */
export async function getSeoSettings(env: Env): Promise<SeoSettings> {
  try {
    const rows = await getDbFromEnv(env).select().from(schema.seoSettings);
    const out: SeoSettings = { ...SEO_DEFAULTS };
    // The General settings "Website name" is the base; an SEO-specific value (below) still wins.
    const gen = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, "siteName")).limit(1).catch(() => []);
    if (gen[0]?.value) out.siteName = gen[0].value;
    for (const r of rows) if (r.key in out && r.value !== "") (out as Record<string, string>)[r.key] = r.value;
    return out;
  } catch { return { ...SEO_DEFAULTS }; }
}

/** Raw stored values (empty = "use the default"), for the settings form. */
export async function getStoredSeoSettings(env: Env): Promise<SeoSettings> {
  const rows = await getDbFromEnv(env).select().from(schema.seoSettings);
  const out: SeoSettings = { siteName: "", defaultDescription: "", defaultOgImage: "", twitterSite: "" };
  for (const r of rows) if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  return out;
}

export async function saveSeoSettings(env: Env, actor: string, input: unknown) {
  const v = seoSettingsSchema.parse(input);
  const db = getDbFromEnv(env);
  for (const [key, value] of Object.entries(v)) {
    const val = key === "twitterSite" && value && !String(value).startsWith("@") ? `@${value}` : String(value);
    await db.insert(schema.seoSettings).values({ key, value: val, updatedBy: actor })
      .onConflictDoUpdate({ target: schema.seoSettings.key, set: { value: val, updatedBy: actor, updatedAt: new Date() } });
  }
}

