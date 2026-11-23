// Creator inquiries against a LOCAL D1: validation, estimate maths, save-first, dedupe, honest email status, deadline, reminders.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { deadlineFor, deadlineState } from "@/lib/creators/deadline";
import { estimateCents, formatEstimate, parseQuantity } from "@/lib/creators/pricing";
import { sendCreatorReminders } from "@/lib/creators/reminders";
import { creatorInquirySchema } from "@/lib/creators/schema";
import { confirmationMail, creatorDedupeKey, submitCreatorInquiry } from "@/lib/creators/submit";
import { RESPONSE_MS } from "@/lib/creators/config";

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
const sent: { to: string; subject: string; text: string }[] = [];
const ok = async (m: { to: string; subject: string; text: string }) => { sent.push(m); return true; };
const no = async () => false;
const notifyOk = async () => "sent" as const;
const base = { turnstileToken: "t", platforms: ["Instagram", "TikTok"], niche: "Fitness", country: "United States", followerRange: "10k-100k", quantity: "5,000", name: "Ada Lovelace", email: "Ada@Test.dev" };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "creators-e2e-")) } });
  env = { ...proxy.env, RESEND_API_KEY: "test-key" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^(0020|0049)_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("pricing", () => {
  it("quantities and estimates", () => {
    expect(formatEstimate(estimateCents(1000))).toBe("$100");
    expect(formatEstimate(estimateCents(5000))).toBe("$500");
    expect(formatEstimate(estimateCents(10000))).toBe("$1,000");
    expect(formatEstimate(estimateCents(50000))).toBe("$5,000");
    expect(formatEstimate(estimateCents(7))).toBe("$0.70");
    expect(parseQuantity("5,000")).toBe(5000);
    for (const bad of ["0", "-5", "1.5", "abc", "", "10000001", null, undefined]) expect(parseQuantity(bad)).toBeNull();
  });
});

describe("validation", () => {
  it("accepts a good request and normalises it", () => {
    const r = creatorInquirySchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.quantity).toBe(5000); expect(r.data.email).toBe("ada@test.dev"); }
  });
  it("rejects missing or bad fields", () => {
    for (const patch of [{ platforms: [] }, { platforms: ["Myspace"] }, { niche: "" }, { country: "" }, { followerRange: "huge" }, { quantity: "0" }, { name: "A" }, { email: "nope" }])
      expect(creatorInquirySchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });
});

describe("submission", () => {
  it("saves first, recomputes the price, sets a 12 hour deadline, emails customer and sales", async () => {
    const db = getDbFromEnv(env); sent.length = 0;
    const d = creatorInquirySchema.parse({ ...base, notes: "Sample please" });
    const now = 1_800_000_000_000;
    const out = await submitCreatorInquiry(db, env, ok, notifyOk, d, now);
    expect(out.duplicate).toBe(false); expect(out.delivery).toBe("sent"); expect(out.estimate).toBe("$500"); expect(out.reference).toMatch(/^CR-[A-Z0-9]{8}$/);
    const row = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.reference, out.reference)))[0];
    expect(row.status).toBe("new"); expect(row.estimatedCents).toBe(50000); expect(row.respondBy).toBe(now + RESPONSE_MS); expect(row.respondedAt).toBeNull();
    expect(row.emailStatus).toBe("sent"); expect(row.ownerNotify).toBe("sent");
    expect(JSON.parse(row.platforms)).toEqual(["Instagram", "TikTok"]);
    expect(sent.length).toBe(1); expect(sent[0].subject).toBe("We received your creator list inquiry — BeigeLeads");
    expect(sent[0].text).toContain("$500"); expect(sent[0].text).toContain(out.reference); expect(sent[0].text).toContain("within 12 hours");
  });
  it("a repeated identical request creates no second row or email", async () => {
    const db = getDbFromEnv(env); sent.length = 0;
    const d = creatorInquirySchema.parse({ ...base, niche: "Beauty" });
    const a = await submitCreatorInquiry(db, env, ok, notifyOk, d);
    const b = await submitCreatorInquiry(db, env, ok, notifyOk, d);
    expect(b.duplicate).toBe(true); expect(b.reference).toBe(a.reference); expect(sent.length).toBe(1);
    expect(creatorDedupeKey(d)).toBe(creatorDedupeKey({ ...d, platforms: [...d.platforms].reverse() }));
  });
  it("a failed email never discards the saved inquiry and is reported as failed", async () => {
    const db = getDbFromEnv(env);
    const out = await submitCreatorInquiry(db, env, no, async () => "failed", creatorInquirySchema.parse({ ...base, niche: "Gaming" }));
    expect(out.delivery).toBe("failed");
    const row = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.reference, out.reference)))[0];
    expect(row.emailStatus).toBe("failed"); expect(row.ownerNotify).toBe("failed");
  });
  it("fallback confirmation text follows the approved wording", () => {
    const m = confirmationMail({ id: 1, name: "Ada Lovelace", email: "a@b.dev", platforms: '["YouTube"]', niche: "Food", country: "Spain", followerRange: "1m+", quantity: 1000, estimatedCents: 10000, reference: "CR-TEST1234", attempts: 0 });
    expect(m.text.startsWith("Hi Ada,")).toBe(true); expect(m.text).toContain("Estimated Price: $100"); expect(m.text).toContain("Your Inquiry ID: CR-TEST1234");
  });
});

describe("12-hour deadline and reminders", () => {
  it("deadline states", () => {
    const t0 = 1_000_000; const i = { status: "new", respondedAt: null as number | null, respondBy: deadlineFor(t0) };
    expect(deadlineState(i, t0).state).toBe("open");
    expect(deadlineState(i, i.respondBy - 3_600_000).state).toBe("due-soon");
    expect(deadlineState(i, i.respondBy + 60_000).state).toBe("overdue");
    expect(deadlineState({ ...i, respondedAt: t0 + 1 }, i.respondBy + 1).state).toBe("responded");
    expect(deadlineState({ ...i, status: "lost" }, i.respondBy + 1).state).toBe("closed");
  });
  it("each reminder is sent once, never for answered inquiries", async () => {
    const db = getDbFromEnv(env);
    const t0 = 1_700_000_000_000;
    const mk = async (niche: string) => (await submitCreatorInquiry(db, env, ok, notifyOk, creatorInquirySchema.parse({ ...base, email: `${niche}@t.dev`, niche }), t0)).reference;
    const soon = await mk("soonniche"), late = await mk("lateniche"), done = await mk("doneniche");
    await db.update(schema.creatorInquiries).set({ respondedAt: t0 + 1, status: "contacted" }).where(eq(schema.creatorInquiries.reference, done));
    const envN = { ...env, NOTIFY_EMAIL: "sales@test.dev" } as CloudflareEnv;
    // "soon" and "late" share a deadline; move to just before it for the first pass.
    const r1 = await sendCreatorReminders(envN, t0 + RESPONSE_MS - 3_600_000);
    expect(r1.soon).toBeGreaterThanOrEqual(2); expect(r1.overdue).toBe(0);
    expect((await sendCreatorReminders(envN, t0 + RESPONSE_MS - 3_000_000)).soon).toBe(0);
    const r2 = await sendCreatorReminders(envN, t0 + RESPONSE_MS + 60_000);
    expect(r2.overdue).toBeGreaterThanOrEqual(2);
    expect((await sendCreatorReminders(envN, t0 + RESPONSE_MS + 120_000)).overdue).toBe(0);
    const d = (await db.select().from(schema.creatorInquiries).where(eq(schema.creatorInquiries.reference, done)))[0];
    expect(d.reminderSentAt).toBeNull(); expect(d.overdueSentAt).toBeNull();
    expect(soon).toBeTruthy(); expect(late).toBeTruthy();
  });
});
