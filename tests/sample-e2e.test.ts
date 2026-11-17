// End-to-end test of the free-sample flow against a LOCAL D1: save, dedupe, honest email status, retry.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { getProducts } from "@/lib/catalog";
import { sampleSchema } from "@/lib/forms/schemas";
import { dedupeKey, sendConfirmation, submitSample } from "@/lib/sample/requests";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const ok = async () => true;
const no = async () => false;
const calls: string[] = [];
const spy = async (m: { to: string }) => { calls.push(m.to); return true; };

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "sample-e2e-")) } });
  env = { ...proxy.env, RESEND_API_KEY: "test-key" } as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^000[0-9]_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("sample requests", () => {
  const slug = getProducts()[0].slug;

  it("validation: needs a list or a custom requirement, and a valid email", () => {
    const base = { turnstileToken: "t" };
    expect(sampleSchema.safeParse({ ...base, email: "a@b.co" }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...base, email: "nope", product: slug }).success).toBe(false);
    expect(sampleSchema.safeParse({ ...base, email: "A@B.co", product: slug }).success).toBe(true);
    expect(sampleSchema.safeParse({ ...base, email: "a@b.co", custom: "Vets in Texas" }).success).toBe(true);
  });

  it("saves a product request and records a real 'sent' handoff", async () => {
    const db = getDbFromEnv(env);
    const r = await submitSample(db, env, spy, { email: "buyer@test.dev", product: slug });
    expect(r.created).toBe(true);
    expect(r.delivery).toBe("sent");
    const row = (await db.select().from(schema.sampleRequests))[0];
    expect(row.emailStatus).toBe("sent");
    expect(row.productSlug).toBe(slug);
    expect(row.attempts).toBe(1);
  });

  it("duplicate: no second row, no second email, same-looking outcome", async () => {
    const before = calls.length;
    const r = await submitSample(getDbFromEnv(env), env, spy, { email: "buyer@test.dev", product: slug });
    expect(r.created).toBe(false);
    expect(r.delivery).toBe("received");
    expect(calls.length).toBe(before);
    expect((await getDbFromEnv(env).select().from(schema.sampleRequests)).length).toBe(1);
  });

  it("custom requests dedupe too (NULL product would not under the old index)", async () => {
    const db = getDbFromEnv(env);
    await submitSample(db, env, ok, { email: "c@test.dev", custom: "Vets in Texas" });
    const again = await submitSample(db, env, ok, { email: "c@test.dev", custom: "  vets   in texas " });
    expect(again.created).toBe(false);
    expect(dedupeKey("x", undefined, undefined)).toBe("x|general");
  });

  it("email failure is recorded as failed, never 'sent'; retry can fix it", async () => {
    const db = getDbFromEnv(env);
    const r = await submitSample(db, env, no, { email: "f@test.dev", custom: "Plumbers" });
    expect(r.delivery).toBe("failed");
    const row = (await db.select().from(schema.sampleRequests)).find((x) => x.email === "f@test.dev")!;
    expect(row.emailStatus).toBe("failed");
    expect(await sendConfirmation(db, env, ok, row.id, row.email, "Plumbers")).toBe("sent");
    const after = (await db.select().from(schema.sampleRequests)).find((x) => x.id === row.id)!;
    expect(after.attempts).toBe(2);
    expect(after.emailStatus).toBe("sent");
  });

  it("without an email key the status is not_configured", async () => {
    const db = getDbFromEnv(env);
    const r = await submitSample(db, { ...env, RESEND_API_KEY: undefined } as unknown as CloudflareEnv, ok, { email: "n@test.dev", custom: "Gyms" });
    expect(r.delivery).toBe("not_configured");
  });

  it("an unknown product slug with no custom text is rejected", async () => {
    await expect(submitSample(getDbFromEnv(env), env, ok, { email: "z@test.dev", product: "nope" })).rejects.toThrow("no-target");
  });
});
