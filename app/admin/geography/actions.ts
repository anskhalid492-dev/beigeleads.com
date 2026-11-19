"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCategories, getCountry } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { importGeo, parseImport } from "@/lib/geo/store";

export type ImportState = { ok: boolean; message: string; errors?: string[] } | null;

/** Imports real inventory: region,city,category,records. `dryRun` only validates. Never deletes anything. */
export async function importGeoAction(_: ImportState, form: FormData): Promise<ImportState> {
  let admin;
  try { admin = await requireAdmin(); } catch { return { ok: false, message: "Your session ended. Sign in again." }; }
  const country = String(form.get("country") ?? "");
  const text = String(form.get("csv") ?? "").slice(0, 400_000);
  const dry = form.get("dry") === "1";
  if (!getCountry(country)) return { ok: false, message: "Pick a country." };
  const { rows, errors } = parseImport(text, getCategories().map((c) => c.slug));
  if (errors.length) return { ok: false, message: "Nothing was imported. Fix these lines first:", errors };
  if (dry) return { ok: true, message: `The file is valid: ${rows.length} rows. Press Import to save them.` };
  try {
    const { env } = getCloudflareContext();
    const db = getDbFromEnv(env);
    const rep = await importGeo(db, country, rows);
    await db.insert(schema.settingsAuditLog).values({ actor: admin.email, category: "geography", settingKey: country, newValue: `import: ${rep.regions} regions, ${rep.cities} cities, ${rep.coverage} counts` });
    revalidatePath("/admin/geography");
    return { ok: true, message: `Imported: ${rep.regions} new regions, ${rep.cities} new cities, ${rep.coverage} record counts saved. Public pages show them within about a minute.` };
  } catch { return { ok: false, message: "Could not save. Migration 0028 may not be applied yet." }; }
}
