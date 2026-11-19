"use server";
import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDbFromEnv, schema } from "@/lib/db";
import { importDefaults, setStatus } from "@/lib/popups/store";

async function actor(): Promise<string | null> { try { return (await requireAdmin()).email; } catch { return null; } }
const audit = (env: CloudflareEnv, who: string, key: string, what: string) => getDbFromEnv(env).insert(schema.settingsAuditLog).values({ actor: who, category: "popups", settingKey: key, newValue: what }).catch(() => {});

export async function importPopupsAction(): Promise<void> {
  const who = await actor(); if (!who) return;
  const env = getCloudflareContext().env;
  const n = await importDefaults(env);
  await audit(env, who, "import", `${n} draft campaigns added`);
  revalidatePath("/admin/popups");
}
export async function setPopupStatusAction(form: FormData): Promise<void> {
  const who = await actor(); if (!who) return;
  const id = String(form.get("id") ?? ""), status = String(form.get("status") ?? "");
  const env = getCloudflareContext().env;
  if (await setStatus(env, id, status)) await audit(env, who, id, `status -> ${status}`);
  revalidatePath("/admin/popups");
}
