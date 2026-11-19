// End-to-end test of the contact flow against a LOCAL D1: validation, save, dedupe, honest email status, owner alert.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { contactDedupeKey, newContactReference, sendContactConfirmation, submitContact } from "@/lib/contact/submit";
import { contactInquirySchema, isOrderType } from "@/lib/contact/types";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const sent: string[] = [];
const ok = async (m: { to: string }) => { sent.push(m.to); return true; };
const no = async () => false;
const notifyOk = async () => "sent" as const;
const base = { turnstileToken: "t", name: "Ada Lovelace", email: "ada@test.dev", inquiryType: "order" as const, orderNumber: "BL-1234", subject: "Where is my list?", message: "I paid yesterday and have not received the link." };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "contact-e2e-")) } });
  env = { ...proxy.env, RESEND_API_KEY: "test-key" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00(0[0-9]|1[0-9]|20)_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("contact inquiries", () => {
  it("validation", () => {
    expect(contactInquirySchema.safeParse(base).success).toBe(true);
    expect(contactInquirySchema.safeParse({ ...base, name: "A" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...base, inquiryType: "refund" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...base, subject: "" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...base, message: "short" }).success).toBe(false);
    expect(contactInquirySchema.safeParse({ ...base, orderNumber: "<script>" }).success).toBe(false);
    expect(isOrderType("payment")).toBe(true);
    expect(isOrderType("general")).toBe(false);
  });

  it("reference format and dedupe key ignore case and spacing", () => {
    expect(newContactReference()).toMatch(/^CT-[2-9A-Z]{8}$/);
    expect(contactDedupeKey({ ...base })).toBe(contactDedupeKey({ ...base, subject: "WHERE is   my list?" }));
  });

  it("saves, sends a real 'sent' confirmation and alerts the owner", async () => {
    const db = getDbFromEnv(env);
    const r = await submitContact(db, env, ok, notifyOk, contactInquirySchema.parse(base));
    expect(r.duplicate).toBe(false);
    expect(r.delivery).toBe("sent");
    const row = (await db.select().from(schema.contactInquiries))[0];
    expect(row.emailStatus).toBe("sent");
    expect(row.ownerNotify).toBe("sent");
    expect(row.status).toBe("new");
    expect(row.orderNumber).toBe("BL-1234");
    expect(sent).toEqual(["ada@test.dev"]);
  });

  it("duplicate: no second row, no second email, same reference", async () => {
    const db = getDbFromEnv(env);
    const before = sent.length;
    const first = (await db.select().from(schema.contactInquiries))[0];
    const r = await submitContact(db, env, ok, notifyOk, contactInquirySchema.parse(base));
    expect(r.duplicate).toBe(true);
    expect(r.reference).toBe(first.reference);
    expect((await db.select().from(schema.contactInquiries)).length).toBe(1);
    expect(sent.length).toBe(before);
  });

  it("order number is dropped for non-order topics", async () => {
    const db = getDbFromEnv(env);
    await submitContact(db, env, ok, notifyOk, contactInquirySchema.parse({ ...base, inquiryType: "general", subject: "Hello there", orderNumber: "BL-9" }));
    const row = (await db.select().from(schema.contactInquiries)).find((x) => x.subject === "Hello there");
    expect(row?.orderNumber).toBeNull();
  });

  it("a failed email is recorded honestly and the inquiry is kept; retry can fix it", async () => {
    const db = getDbFromEnv(env);
    const r = await submitContact(db, env, no, async () => "failed", contactInquirySchema.parse({ ...base, email: "grace@test.dev" }));
    expect(r.delivery).toBe("failed");
    const row = (await db.select().from(schema.contactInquiries)).find((x) => x.email === "grace@test.dev")!;
    expect(row.emailStatus).toBe("failed");
    expect(row.ownerNotify).toBe("failed");
    const st = await sendContactConfirmation(db, env, ok, row);
    expect(st).toBe("sent");
    const after = (await db.select().from(schema.contactInquiries)).find((x) => x.id === row.id)!;
    expect(after.emailStatus).toBe("sent");
    expect(after.attempts).toBe(2);
  });

  it("not configured email is reported as such", async () => {
    const db = getDbFromEnv(env);
    const r = await submitContact(db, { ...env, RESEND_API_KEY: undefined } as CloudflareEnv, ok, async () => "skipped", contactInquirySchema.parse({ ...base, email: "alan@test.dev" }));
    expect(r.delivery).toBe("not_configured");
    const row = (await db.select().from(schema.contactInquiries)).find((x) => x.email === "alan@test.dev")!;
    expect(row.ownerNotify).toBe("skipped");
  });
});
