import { eq } from "drizzle-orm";
import { schema, type getDbFromEnv } from "@/lib/db";

type Db = ReturnType<typeof getDbFromEnv>;
const keyOf = (templateKey: string) => `email.off.${templateKey}`;

/** True when an admin switched this template off. Never throws; before migration 0016 nothing is off. */
export async function isTemplateOff(db: Db, templateKey: string): Promise<boolean> {
  try {
    const [r] = await db.select({ v: schema.systemSettings.value }).from(schema.systemSettings).where(eq(schema.systemSettings.key, keyOf(templateKey))).limit(1);
    return r?.v === "1";
  } catch { return false; }
}

export async function setTemplateOff(db: Db, actor: string, templateKey: string, off: boolean): Promise<void> {
  await db.insert(schema.systemSettings).values({ key: keyOf(templateKey), value: off ? "1" : "0", updatedBy: actor, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: off ? "1" : "0", updatedBy: actor, updatedAt: new Date() } });
}

/** Keys of all templates currently switched off. Never throws. */
export async function listOff(db: Db): Promise<Set<string>> {
  try {
    const rows = await db.select().from(schema.systemSettings);
    return new Set(rows.filter((r) => r.key.startsWith("email.off.") && r.value === "1").map((r) => r.key.slice("email.off.".length)));
  } catch { return new Set(); }
}
