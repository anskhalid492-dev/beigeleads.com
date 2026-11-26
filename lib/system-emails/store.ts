import { desc, eq, ne } from "drizzle-orm";
import type { getDbFromEnv } from "@/lib/db";
import { schema } from "@/lib/db";
import { getBranding } from "./branding";
import { getTemplate } from "./defaults";
import { renderEmail, type Vars } from "./render";
import { contentSchema, type Content, type TemplateDef } from "./types";
import { SYSTEM_KEYS, VARIABLES, VAR_KEYS } from "./variables";

type Db = ReturnType<typeof getDbFromEnv>;
export class EmailError extends Error {}

const parse = (json: string | null | undefined): Content | null => {
  if (!json) return null;
  try { const r = contentSchema.safeParse(JSON.parse(json)); return r.success ? (r.data as Content) : null; } catch { return null; }
};

export type Editable = { def: TemplateDef; published: Content; custom: boolean; version: number; draft: Content | null; updatedAt: number | null; updatedBy: string; /** true for a duplicated template */ copy: boolean };
type Row = typeof schema.emailTemplates.$inferSelect;

/** Built-in templates come from code; a duplicate comes from its row (base template's variables, never connected). */
function defFor(key: string, row?: Row): TemplateDef | null {
  const built = getTemplate(key);
  if (built) return built;
  if (!row || !row.baseKey) return null;
  const base = getTemplate(row.baseKey);
  if (!base) return null;
  return { ...base, key, name: row.name || `${base.name} (copy)`, connection: "not_connected", connectionNote: "This is your own copy. No event sends it; use it for test emails or as a draft idea.", required: [], event: `Copy of "${base.name}".` };
}
const build = (def: TemplateDef, row?: Row): Editable => {
  const pub = parse(row?.publishedJson);
  return { def, published: pub ?? def.content, custom: !!pub, version: pub ? row!.publishedVersion : 0, draft: parse(row?.draftJson), updatedAt: row?.updatedAt ?? null, updatedBy: row?.updatedBy ?? "", copy: !!row?.baseKey };
};

/** Never throws: before migration 0022/0023 (or on any error) every template is its built-in version. */
export async function getEditable(db: Db, key: string): Promise<Editable | null> {
  let row: Row | undefined;
  try { [row] = await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.key, key)); } catch { /* built-in only */ }
  const def = defFor(key, row);
  return def ? build(def, row) : null;
}

export async function listEditable(db: Db): Promise<Map<string, Editable>> {
  const out = new Map<string, Editable>();
  let rows: Row[] = [];
  try { rows = await db.select().from(schema.emailTemplates); } catch { /* migration missing: all built-in */ }
  const by = new Map(rows.map((r) => [r.key, r]));
  const { TEMPLATES } = await import("./defaults");
  for (const def of TEMPLATES) out.set(def.key, build(def, by.get(def.key)));
  for (const r of rows) { if (r.baseKey && !out.has(r.key)) { const d = defFor(r.key, r); if (d) out.set(r.key, build(d, r)); } }
  return out;
}

const usedVars = (c: Content): Set<string> => {
  const s = new Set<string>();
  for (const m of JSON.stringify(c).matchAll(/\{\{\s*([a-z_]+)/g)) s.add(m[1]);
  return s;
};

/** Example values for previews. Clearly labelled as examples wherever they are shown. */
export function exampleVars(def: TemplateDef): Vars {
  const v: Vars = {};
  for (const x of VARIABLES) if (x.key !== "support_email") v[x.key] = x.example; // no made-up address in previews
  void def;
  return v;
}

/** Everything that must be true before a version can go live. Returns human-readable problems. */
export function checkContent(def: TemplateDef, raw: unknown): { content?: Content; errors: string[]; warnings: string[] } {
  const r = contentSchema.safeParse(raw);
  if (!r.success) return { errors: r.error.issues.slice(0, 4).map((i) => `${i.path.join(".") || "content"}: ${i.message}`), warnings: [] };
  const content = r.data as Content;
  const errors: string[] = [];
  const warnings: string[] = [];
  const used = usedVars(content);
  const allowed = new Set([...def.vars, ...SYSTEM_KEYS]);
  for (const k of used) {
    if (!VAR_KEYS.has(k)) errors.push(`{{${k}}} is not a known variable.`);
    else if (!allowed.has(k)) errors.push(`{{${k}}} is not available for this email. Its event cannot supply it.`);
  }
  for (const k of def.required) if (!used.has(k)) errors.push(`This email must use {{${k}}}. Without it the email would be incomplete.`);
  const probe = renderEmail(content, exampleVars(def), { founder: def.founder });
  if (probe.issues.badUrl) errors.push("A button, image or link is empty or unsafe. Use an https:// address or a site path like /contact.");
  for (const b of content.blocks) {
    if (b.t === "social") for (const l of b.links) if (l.url && !/^https:\/\//i.test(l.url)) errors.push(`The social link "${l.label}" must start with https://`);
    if (b.t === "image" && !b.alt.trim()) warnings.push("An image has no description (alt text). Many people see the description instead of the image.");
  }
  if (def.key === "product_delivery") {
    const urls = [content.cta?.url ?? "", ...content.blocks.map((b) => (b.t === "button" ? b.url : ""))];
    if (!urls.some((u) => /\{\{\s*download_url/.test(u))) errors.push("The delivery email needs a button that links to {{download_url}}.");
  }
  if (/[<>]/.test(JSON.stringify(content).replace(/\\u003c|\\u003e/g, ""))) warnings.push("HTML tags are not supported. Angle brackets will show as plain text.");
  if (content.subject.length > 90) warnings.push("The subject is long. Many inboxes cut it off around 60 to 70 characters.");
  return { content, errors, warnings };
}

async function version(db: Db, key: string): Promise<number> {
  const [r] = await db.select({ v: schema.emailTemplateVersions.version }).from(schema.emailTemplateVersions).where(eq(schema.emailTemplateVersions.templateKey, key)).orderBy(desc(schema.emailTemplateVersions.version)).limit(1);
  return r?.v ?? 0;
}

export async function saveDraft(db: Db, actor: string, key: string, raw: unknown): Promise<void> {
  if (!(await getEditable(db, key))) throw new EmailError("Unknown template.");
  const c = contentSchema.safeParse(raw);
  if (!c.success) throw new EmailError(`Cannot save: ${c.error.issues[0]?.message ?? "invalid content"}.`);
  const json = JSON.stringify(c.data);
  await db.insert(schema.emailTemplates).values({ key, draftJson: json, updatedAt: Date.now(), updatedBy: actor })
    .onConflictDoUpdate({ target: schema.emailTemplates.key, set: { draftJson: json, updatedAt: Date.now(), updatedBy: actor } });
}

export async function discardDraft(db: Db, actor: string, key: string): Promise<void> {
  if (!(await getEditable(db, key))) throw new EmailError("Unknown template.");
  await db.update(schema.emailTemplates).set({ draftJson: null, updatedAt: Date.now(), updatedBy: actor }).where(eq(schema.emailTemplates.key, key));
}

/** Publishing validates, stores a numbered version, then makes it live. The draft is cleared. */
export async function publish(db: Db, actor: string, key: string, raw: unknown, note = ""): Promise<number> {
  const def = (await getEditable(db, key))?.def;
  if (!def) throw new EmailError("Unknown template.");
  const { content, errors } = checkContent(def, raw);
  if (!content || errors.length) throw new EmailError(errors[0] ?? "Invalid content.");
  const json = JSON.stringify(content);
  const v = (await version(db, key)) + 1;
  await db.insert(schema.emailTemplateVersions).values({ templateKey: key, version: v, contentJson: json, note: note.slice(0, 120), actor });
  await db.insert(schema.emailTemplates).values({ key, publishedJson: json, publishedVersion: v, draftJson: null, updatedAt: Date.now(), updatedBy: actor })
    .onConflictDoUpdate({ target: schema.emailTemplates.key, set: { publishedJson: json, publishedVersion: v, draftJson: null, updatedAt: Date.now(), updatedBy: actor } });
  return v;
}

export async function listVersions(db: Db, key: string) {
  try { return await db.select().from(schema.emailTemplateVersions).where(eq(schema.emailTemplateVersions.templateKey, key)).orderBy(desc(schema.emailTemplateVersions.version)).limit(30); } catch { return []; }
}

/** Restoring loads an old version into the DRAFT. Nothing goes live until it is published again. version 0 = built-in. */
export async function restoreVersion(db: Db, actor: string, key: string, v: number): Promise<void> {
  const def = (await getEditable(db, key))?.def;
  if (!def) throw new EmailError("Unknown template.");
  if (v === 0) return saveDraft(db, actor, key, def.content);
  const rows = await listVersions(db, key);
  const hit = rows.find((r) => r.version === v);
  if (!hit) throw new EmailError("That version does not exist.");
  await saveDraft(db, actor, key, JSON.parse(hit.contentJson));
}

/** Duplicates a template into your own editable copy (never connected to an event). Starts from the live version. */
export async function duplicateTemplate(db: Db, actor: string, sourceKey: string, name: string): Promise<string> {
  const src = await getEditable(db, sourceKey);
  if (!src) throw new EmailError("Unknown template.");
  const clean = name.trim().slice(0, 80) || `${src.def.name} (copy)`;
  const rows = await db.select({ k: schema.emailTemplates.key }).from(schema.emailTemplates).where(ne(schema.emailTemplates.baseKey, ""));
  if (rows.length >= 40) throw new EmailError("You already have 40 copies. Delete one first.");
  const base = src.copy ? (await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.key, sourceKey)))[0]?.baseKey : sourceKey;
  const key = `custom_${crypto.randomUUID().slice(0, 8)}`;
  await db.insert(schema.emailTemplates).values({ key, name: clean, baseKey: base ?? sourceKey, draftJson: JSON.stringify(src.published), updatedAt: Date.now(), updatedBy: actor });
  return key;
}

export async function deleteCopy(db: Db, key: string): Promise<void> {
  const [row] = await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.key, key));
  if (!row || !row.baseKey) throw new EmailError("Only your own copies can be deleted.");
  await db.delete(schema.emailTemplates).where(eq(schema.emailTemplates.key, key));
  await db.delete(schema.emailTemplateVersions).where(eq(schema.emailTemplateVersions.templateKey, key));
}

export { getBranding };
