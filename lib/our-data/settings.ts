// Settings for /our-data (CLAUDE.md section 141). Stored in system_settings key `ourdata.settings`, KV cached 60 s.
// Rule: a claim is never public until an admin marks it "approved" WITH written evidence. Code cannot promote a claim.
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDbFromEnv } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const CLAIM_KEYS = ["records", "accuracy", "largest"] as const;
export type ClaimKey = (typeof CLAIM_KEYS)[number];
export const CLAIM_INFO: Record<ClaimKey, { label: string; proposed: string; hint: string }> = {
  records: { label: "Total database records", proposed: "8B+", hint: "A total across every BeigeLeads database, with how it was counted." },
  accuracy: { label: "Data accuracy", proposed: "95%", hint: "The method: sample size, what counts as accurate, date measured." },
  largest: { label: "Largest database claim", proposed: "World's largest database", hint: "A superlative needs a named comparison and its sources." },
};

const claim = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  value: z.string().trim().max(60),
  evidence: z.string().trim().max(1500),
  evidenceUrl: z.string().trim().max(300),
  reviewedBy: z.string().trim().max(120),
  reviewedAt: z.string().trim().max(30),
}).superRefine((v, c) => {
  if (v.status !== "approved") return;
  if (!v.value) c.addIssue({ code: "custom", message: "An approved claim needs the exact wording to publish.", path: ["value"] });
  if (v.evidence.length < 40) c.addIssue({ code: "custom", message: "Describe the evidence in at least 40 characters before approving.", path: ["evidence"] });
  if (v.evidenceUrl && !/^https:\/\//i.test(v.evidenceUrl) && !v.evidenceUrl.startsWith("/")) c.addIssue({ code: "custom", message: "The evidence link must be https or a site path.", path: ["evidenceUrl"] });
});
export type Claim = z.infer<typeof claim>;

export const ourDataSchema = z.object({
  published: z.boolean(),
  claims: z.object({ records: claim, accuracy: claim, largest: claim }),
  seoTitle: z.string().trim().min(10).max(59),
  seoDescription: z.string().trim().min(50).max(149),
  faqs: z.array(z.object({ q: z.string().trim().min(5).max(200), a: z.string().trim().min(20).max(1200) })).min(8).max(24),
});
export type OurDataSettings = z.infer<typeof ourDataSchema>;

const pending = (): Claim => ({ status: "pending", value: "", evidence: "", evidenceUrl: "", reviewedBy: "", reviewedAt: "" });

export const DEFAULT_FAQS: { q: string; a: string }[] = [
  { q: "Where does BeigeLeads data come from?", a: "Our team collects raw data from business listings, company websites, public government registries, directories, licensed providers, public professional profiles and our own research, then enriches and verifies it. The full description is on the Data Sources page." },
  { q: "How do you verify email addresses?", a: "We check every email with SMTP-level checks before it goes into a list. Verification reduces the chance of bounces; it does not guarantee that a message will be delivered or read." },
  { q: "How often is the data refreshed?", a: "BeigeLeads refreshes its databases every 90 days. Each product page shows the date that list was last updated." },
  { q: "What fields does a database include?", a: "Fields cover business details, location, contact, online presence and operations. Which fields are filled varies by product and by record, so check the sample on the list page before you buy." },
  { q: "How accurate is the data?", a: "No data set is perfect. If more than 5% of the emails in a delivered list bounce, we replace them under our replacement policy. We publish a measured accuracy figure only when we can show how it was measured." },
  { q: "Which countries do you cover?", a: "Coverage is shown on this page from the lists that are actually available, and it grows as lists are added. Each country page links to its real databases." },
  { q: "Which formats do you deliver?", a: "CSV, Excel or TXT. After payment is confirmed, you receive an emailed link. Delivery is usually quick but can take up to 12 hours in some cases." },
  { q: "Can I see the data before I buy?", a: "Yes. Every list page has a masked sample, and you can request a free sample. Sample rows are masked so no working contact is exposed." },
  { q: "Is the data compliant with privacy laws?", a: "We publish how we collect and use data in our privacy, GDPR, CCPA and lawful-use pages, and anyone can ask to be removed through the opt-out page. Buyers are responsible for using the data lawfully in their own region. We do not make blanket compliance guarantees." },
  { q: "What if I need a specific industry, place or role?", a: "Browse the ready-made lists first. If yours is not there, send a custom list request with the industry, location and any job titles, and we will tell you what can be sourced." },
];

export const DEFAULT_OUR_DATA: OurDataSettings = {
  published: true,
  claims: { records: pending(), accuracy: pending(), largest: pending() },
  seoTitle: "Our Data: Sources, Coverage and Verification | BeigeLeads",
  seoDescription: "See what is inside BeigeLeads databases: fields, countries, industries, sourcing, email verification, refresh cycle and delivery formats.",
  faqs: DEFAULT_FAQS,
};

const KEY = "ourdata:settings:v1";
const DB_KEY = "ourdata.settings";

function merge(raw: unknown): OurDataSettings {
  const base = (raw && typeof raw === "object" ? raw : {}) as Partial<OurDataSettings>;
  const p = ourDataSchema.safeParse({ ...DEFAULT_OUR_DATA, ...base, claims: { ...DEFAULT_OUR_DATA.claims, ...(base.claims ?? {}) } });
  return p.success ? p.data : DEFAULT_OUR_DATA;
}

export async function loadOurData(env: CloudflareEnv): Promise<OurDataSettings> {
  try {
    const hit = await env.CACHE.get(KEY);
    if (hit) return merge(JSON.parse(hit));
  } catch { /* database next */ }
  try {
    const [r] = await getDbFromEnv(env).select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const out = merge(r ? JSON.parse(r.value) : null);
    await env.CACHE.put(KEY, JSON.stringify(out), { expirationTtl: 60 }).catch(() => undefined);
    return out;
  } catch { return DEFAULT_OUR_DATA; }
}

export async function saveOurData(env: CloudflareEnv, value: unknown, actor: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const p = ourDataSchema.safeParse(value);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Check the values." };
  try {
    const db = getDbFromEnv(env);
    const [old] = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.key, DB_KEY));
    const text = JSON.stringify(p.data);
    await db.insert(schema.systemSettings).values({ key: DB_KEY, value: text, updatedBy: actor }).onConflictDoUpdate({ target: schema.systemSettings.key, set: { value: text, updatedBy: actor, updatedAt: new Date() } });
    await db.insert(schema.settingsAuditLog).values({ actor, category: "our-data", settingKey: DB_KEY, oldValue: (old?.value ?? "").slice(0, 900), newValue: text.slice(0, 900) });
    await env.CACHE.delete(KEY).catch(() => undefined);
    return { ok: true };
  } catch { return { ok: false, message: "Could not save. Check that the database is reachable." }; }
}

/** The public wording of a claim: only an approved claim with evidence is returned. */
export const approvedValue = (s: OurDataSettings, k: ClaimKey): string | null => {
  const c = s.claims[k];
  return c.status === "approved" && c.value && c.evidence.length >= 40 ? c.value : null;
};
