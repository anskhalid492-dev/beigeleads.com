// End-to-end test of the custom list flow against a LOCAL D1: validation, save-first, references, dedupe, email failures, legacy rows.
import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDbFromEnv, schema } from "@/lib/db";
import { customListSchema, describeLocation, newReference } from "@/lib/custom-list/schema";
import { submitCustomList } from "@/lib/custom-list/submit";
import { prefillFromSearch } from "@/components/custom-list/prefill";
import { completion, contactErrors, EMPTY, validate, draftOf } from "@/components/custom-list/state";

let proxy: PlatformProxy<CloudflareEnv>;
let env: CloudflareEnv;
const sent: string[] = [];
const ok = async (m: { to: string }) => { sent.push(m.to); return true; };
const no = async () => false;

const base = {
  turnstileToken: "t", name: "Ann Buyer", email: "Ann@Test.dev", industries: ["Dentists", "Medical spas"],
  locations: [{ country: "United States", whole: false, regions: ["California"], cities: ["Los Angeles", "San Diego"] }],
  fields: ["Business email"], quantity: 5000,
};

beforeAll(async () => {
  proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "cl-e2e-")) } });
  env = proxy.env as CloudflareEnv;
  const files = readdirSync("drizzle").filter((f) => /^00\d\d_.*\.sql$/.test(f)).sort();
  const sql = files.map((f) => readFileSync(join("drizzle", f), "utf8")).join("\n").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  for (const stmt of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(stmt).run();
}, 60_000);
afterAll(async () => { await proxy?.dispose(); });

describe("custom list validation", () => {
  it("accepts a full request and normalizes the email", () => {
    const r = customListSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("ann@test.dev");
  });
  it("rejects missing industry, location, bad email, bad quantity", () => {
    expect(customListSchema.safeParse({ ...base, industries: [] }).success).toBe(false);
    expect(customListSchema.safeParse({ ...base, locations: [] }).success).toBe(false);
    expect(customListSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
    expect(customListSchema.safeParse({ ...base, quantity: 0 }).success).toBe(false);
    expect(customListSchema.safeParse({ ...base, quantity: 1.5 }).success).toBe(false);
    expect(customListSchema.safeParse({ ...base, turnstileToken: "" }).success).toBe(false);
  });
  it("describes locations and makes readable references", () => {
    expect(describeLocation(base.locations[0])).toBe("United States > California > Los Angeles, San Diego");
    expect(newReference()).toMatch(/^CL-[2-9A-Z]{8}$/);
  });
});

describe("wizard state", () => {
  it("validates steps, contact fields and completion", () => {
    expect(validate(0, EMPTY)).not.toBe("");
    expect(validate(1, EMPTY)).not.toBe("");
    expect(validate(2, EMPTY)).toBe("");
    expect(validate(2, { ...EMPTY, quantity: "abc" })).not.toBe("");
    expect(Object.keys(contactErrors(EMPTY))).toEqual(["name", "email"]);
    expect(completion({ ...EMPTY, industries: ["Dentists"] })).toBe(25);
  });
  it("the saved draft never contains contact details", () => {
    const d = draftOf({ ...EMPTY, name: "Ann", email: "a@b.co", company: "X", message: "hi", industries: ["Dentists"] });
    expect([d.name, d.email, d.company, d.message]).toEqual(["", "", "", ""]);
    expect(d.industries).toEqual(["Dentists"]);
  });
  it("prefills only what a search reliably said", () => {
    const cats = [{ slug: "dentists", name: "Dentists" }];
    const p = prefillFromSearch({ q: "dentists in texas", category: "dentists", categoryText: "", quantity: "2000", country: "us", countryText: "us", region: "Texas" }, cats);
    expect(p.industries).toEqual(["Dentists"]);
    expect(p.locations?.[0]).toMatchObject({ country: "United States", regions: ["Texas"], cities: [] });
    expect(p.quantity).toBe("2000");
    expect(prefillFromSearch({ q: "x", category: "", categoryText: "", quantity: "", country: "", countryText: "", region: "" }, cats)).toEqual({});
  });
});

describe("custom list submission", () => {
  const data = () => customListSchema.parse(base);

  it("saves first, then notifies, and stores honest email status", async () => {
    const db = getDbFromEnv(env);
    const r = await submitCustomList(db, ok, "owner@test.dev", data());
    expect(r.duplicate).toBe(false);
    expect(r.reference).toMatch(/^CL-/);
    expect(r.ownerNotify).toBe("sent");
    expect(sent).toEqual(["owner@test.dev", "ann@test.dev"]);
    const row = (await db.select().from(schema.customListRequests))[0];
    expect(row.reference).toBe(r.reference);
    expect(row.category).toBe("Dentists, Medical spas");
    expect(JSON.parse(row.detailJson!).locations[0].cities).toEqual(["Los Angeles", "San Diego"]);
    expect(row.ownerNotify).toBe("sent");
  });

  it("duplicate: same reference, no second row, no second email", async () => {
    const before = sent.length;
    const db = getDbFromEnv(env);
    const r = await submitCustomList(db, ok, "owner@test.dev", data());
    expect(r.duplicate).toBe(true);
    expect(sent.length).toBe(before);
    expect((await db.select().from(schema.customListRequests)).length).toBe(1);
  });

  it("failed emails never discard the saved request", async () => {
    const db = getDbFromEnv(env);
    const r = await submitCustomList(db, no, "owner@test.dev", customListSchema.parse({ ...base, email: "bob@test.dev", industries: ["Vets"] }));
    expect(r.ownerNotify).toBe("failed");
    expect(r.customerEmail).toBe("failed");
    const row = (await db.select().from(schema.customListRequests)).find((x) => x.reference === r.reference)!;
    expect(row.ownerNotify).toBe("failed");
    expect(row.customerEmailStatus).toBe("failed");
  });

  it("legacy rows (no reference) coexist, and the status note is stored", async () => {
    await env.DB.prepare("INSERT INTO custom_list_requests (email, category, country, field_json) VALUES ('old@test.dev','Dentists','US','[]')").run().catch(async () => {
      await env.DB.prepare("INSERT INTO custom_list_requests (email, category, country, fields_json) VALUES ('old@test.dev','Dentists','US','[]')").run();
    });
    const db = getDbFromEnv(env);
    const all = await db.select().from(schema.customListRequests);
    expect(all.some((x) => x.reference === null)).toBe(true);
    await db.insert(schema.customRequestStatus).values({ requestId: all[0].id, status: "quoted", note: "called them", updatedBy: "a@b.co" });
    expect((await db.select().from(schema.customRequestStatus))[0].note).toBe("called them");
  });
});
