import { eq } from "drizzle-orm";
import { z } from "zod";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";

type Db = ReturnType<typeof getDbFromEnv>;

/** Shared look for every email. Only palette-safe choices exist; the logo files themselves come from public/brand. */
export const brandingSchema = z.object({
  logoHeight: z.union([z.literal(28), z.literal(34), z.literal(42)]),
  cardRadius: z.union([z.literal(8), z.literal(12), z.literal(20)]),
  buttonColor: z.enum(["primary", "dark"]),
  buttonRadius: z.union([z.literal(0), z.literal(8), z.literal(12), z.literal(20)]),
  supportEmail: z.string().trim().max(120).refine((v) => v === "" || /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v), "Enter a valid email address or leave it empty."),
  footerNote: z.string().trim().max(300),
  social: z.array(z.object({ label: z.string().trim().min(1).max(40), url: z.string().trim().max(300).refine((v) => /^https:\/\/[^\s"<>]+$/i.test(v), "Social links must start with https://") })).max(6),
});
export type Branding = z.infer<typeof brandingSchema>;

export const DEFAULT_BRANDING: Branding = { logoHeight: 34, cardRadius: 20, buttonColor: "primary", buttonRadius: 12, supportEmail: "hello@beigeleads.com", footerNote: "", social: [] };

const KEY = "main";

/** Never throws: before migration 0023 (or on any error) the default branding is used. */
export async function getBranding(db: Db): Promise<Branding> {
  try {
    const [row] = await db.select().from(schema.emailBranding).where(eq(schema.emailBranding.key, KEY));
    if (!row) return DEFAULT_BRANDING;
    const r = brandingSchema.safeParse(JSON.parse(row.value));
    return r.success ? r.data : DEFAULT_BRANDING;
  } catch { return DEFAULT_BRANDING; }
}

export class BrandingError extends Error {}

export async function saveBranding(db: Db, actor: string, raw: unknown): Promise<Branding> {
  const r = brandingSchema.safeParse(raw);
  if (!r.success) throw new BrandingError(r.error.issues[0]?.message ?? "Invalid branding.");
  const value = JSON.stringify(r.data);
  await db.insert(schema.emailBranding).values({ key: KEY, value, updatedAt: Date.now(), updatedBy: actor })
    .onConflictDoUpdate({ target: schema.emailBranding.key, set: { value, updatedAt: Date.now(), updatedBy: actor } });
  return r.data;
}
