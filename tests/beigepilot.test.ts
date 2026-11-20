import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSystem, cleanOutput, pageContext } from "@/lib/beigepilot/chat";
import { decryptKey, encryptKey, keyHint } from "@/lib/beigepilot/secret";
import { getProviderKey, getSettings, limitReached, listProviders, logUsage, removeProviderKey, saveProvider, saveSettings, usageToday } from "@/lib/beigepilot/store";
import { newCtx, runTool, TOOLS } from "@/lib/beigepilot/tools";
import { getProducts } from "@/lib/catalog";

const SECRET = "x".repeat(40);
describe("key encryption", () => {
  it("round-trips and never contains the key", async () => {
    const enc = await encryptKey("sk-test-1234567890abcdef", SECRET);
    expect(enc.startsWith("v1.")).toBe(true);
    expect(enc).not.toContain("sk-test");
    expect(await decryptKey(enc, SECRET)).toBe("sk-test-1234567890abcdef");
    expect(keyHint("sk-test-1234567890abcdef")).toMatch(/cdef$/);
  });
  it("cannot be read with another secret, and refuses a missing secret", async () => {
    const enc = await encryptKey("sk-test-1234567890abcdef", SECRET);
    expect(await decryptKey(enc, "y".repeat(40))).toBeNull();
    await expect(encryptKey("k", undefined)).rejects.toBeDefined();
  });
});

describe("output safety", () => {
  it("removes foreign links and keeps ours", () => {
    const o = cleanOutput("See [here](https://evil.example/x) and [list](https://beigeleads.com/lists/a) or https://evil.example/y end");
    expect(o).not.toContain("evil.example");
    expect(o).toContain("https://beigeleads.com/lists/a");
  });
  it("page context uses the path only and system prompt keeps admin notes lower priority", () => {
    expect(pageContext("/cart", [])).toContain("cart");
    const sys = buildSystem({ instructions: "Be brief" } as never, "x");
    expect(sys).toContain("lower priority");
  });
});

describe("tools are read-only and grounded", () => {
  it("has no tool that writes, orders or returns download links", () => {
    const names = TOOLS.map((t) => t.name).join(" ");
    expect(names).not.toMatch(/order|checkout|delete|update|download|email/i);
  });
  it("unknown slugs are an error, not an invention", async () => {
    const ctx = newCtx({} as CloudflareEnv);
    const r = await runTool(ctx, "getProductDetails", { slug: "does-not-exist" });
    expect(r.toLowerCase()).toMatch(/not found|unknown|no list/);
    const c = await runTool(ctx, "showProductCards", { slugs: ["does-not-exist"] });
    expect(ctx.cards).toHaveLength(0);
    expect(c).toBeTruthy();
  });
  it("placeholder products never expose counts or prices", async () => {
    const ph = getProducts().find((p) => p.placeholderData || p.status !== "live");
    if (!ph) return;
    const ctx = newCtx({} as CloudflareEnv);
    const r = await runTool(ctx, "getProductPackages", { slug: ph.slug });
    expect(r).not.toMatch(/\$\d/);
  });
});

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
describe("storage and limits (local D1)", () => {
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "bp-")) } });
    env = proxy.env as CloudflareEnv;
    (env as { BEIGEPILOT_KEY_SECRET?: string }).BEIGEPILOT_KEY_SECRET = SECRET;
    for (const f of ["0037_beigepilot.sql", "0038_beigepilot_knowledge.sql"]) {
      const sql = readFileSync(join("drizzle", f), "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
      for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
    }
  }, 60_000);
  it("defaults to off, saves settings, never lists a key", async () => {
    expect((await getSettings(env)).s.enabled).toBe(false);
    await saveProvider(env, "openai", { apiKey: "sk-live-abcdefghijklmnop", model: "m1", temperature: 0.2, maxTokens: 500, priceIn: 1, priceOut: 2 });
    const rows = await listProviders(env);
    const o = rows.find((r) => r.id === "openai")!;
    expect(o.hasKey).toBe(true); expect(JSON.stringify(rows)).not.toContain("abcdefghijklmnop");
    expect(await getProviderKey(env, "openai")).toBe("sk-live-abcdefghijklmnop");
    const raw = await env.DB.prepare("SELECT enc_key FROM beigepilot_providers WHERE id='openai'").first<{ enc_key: string }>();
    expect(raw!.enc_key).not.toContain("abcdefghijklmnop");
    await saveProvider(env, "openai", { model: "m2", temperature: 0.2, maxTokens: 500, priceIn: null, priceOut: null });
    expect(await getProviderKey(env, "openai")).toBe("sk-live-abcdefghijklmnop");
    await removeProviderKey(env, "openai");
    expect(await getProviderKey(env, "openai")).toBeNull();
  });
  it("enforces daily limits", async () => {
    await saveSettings(env, { dailyRequestLimit: "2", enabled: "1" });
    const { s } = await getSettings(env);
    expect(s.enabled).toBe(true);
    expect(await limitReached(env, s)).toBeNull();
    await logUsage(env, "openai", "m", 10, 10, false); await logUsage(env, "openai", "m", 10, 10, true);
    const t = await usageToday(env);
    expect(t.requests).toBe(2); expect(t.errors).toBe(1);
    expect(await limitReached(env, s)).toContain("daily");
  });
});

import { cleanEntry, listEntries, publishedEntries, saveEntry, searchEntries, type Entry } from "@/lib/beigepilot/knowledge";
import { createLead, listLeads, listUnanswered, logUnanswered, looksPrivate, setUnanswered, updateLead } from "@/lib/beigepilot/leads";
import { handoffSchema } from "@/lib/beigepilot/handoff";

const E = (o: Partial<Entry>): Entry => ({ id: 1, kind: "faq", title: "", answer: "", keywords: "", status: "published", updatedAt: 0, ...o });
describe("knowledge search and rules", () => {
  it("scores by keyword and ignores blocked claims", () => {
    const items = [E({ id: 1, title: "Do you offer invoices?", answer: "Yes, an invoice is in your delivery email.", keywords: "invoice, receipt" }), E({ id: 2, kind: "restricted", title: "invoice guarantee", answer: "Do not promise." }), E({ id: 3, title: "Office hours", answer: "We are online." })];
    expect(searchEntries(items, "can I get an invoice").map((e) => e.id)).toEqual([1]);
    expect(searchEntries(items, "zzz qqq")).toEqual([]);
  });
  it("validates entries", () => {
    expect(cleanEntry({ title: "x", answer: "long enough answer" }).ok).toBe(false);
    expect(cleanEntry({ title: "A real question?", answer: "See https://evil.example/x for it." }).ok).toBe(false);
    expect(cleanEntry({ title: "A real question?", answer: "A real answer here.", status: "published" }).ok).toBe(true);
  });
  it("refuses private-looking questions", () => {
    expect(looksPrivate("my email is a@b.co")).toBe(true);
    expect(looksPrivate("call me 415 555 0100 now")).toBe(true);
    expect(looksPrivate("do you sell lists for plumbers")).toBe(false);
  });
  it("requires consent and a valid email for a handoff", () => {
    const base = { name: "Ann Lee", email: "ann@example.com", message: "I need a custom list please", consent: "yes", turnstileToken: "t" };
    expect(handoffSchema.safeParse(base).success).toBe(true);
    expect(handoffSchema.safeParse({ ...base, consent: "" }).success).toBe(false);
    expect(handoffSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
  });
});

describe("phase 2 storage (local D1)", () => {
  it("only published entries are used", async () => {
    const c = cleanEntry({ title: "Do you offer invoices?", answer: "Yes, an invoice is included.", keywords: "invoice" }); if (!c.ok) throw new Error("bad");
    const id = await saveEntry(env, null, c.v);
    expect(await publishedEntries(env)).toHaveLength(0);
    await saveEntry(env, id, { ...c.v, status: "published" });
    expect((await publishedEntries(env)).map((e) => e.id)).toContain(id);
    expect((await listEntries(env)).items).toHaveLength(1);
  });
  it("counts repeated unanswered questions once and reopens resolved ones", async () => {
    expect(await logUnanswered(env, "Do you sell lists for plumbers?", "/")).toBe(true);
    expect(await logUnanswered(env, "do you sell lists for PLUMBERS", "/lists")).toBe(true);
    expect(await logUnanswered(env, "email me at a@b.co", "/")).toBe(false);
    let l = (await listUnanswered(env, "all")).items; expect(l).toHaveLength(1); expect(l[0].times).toBe(2);
    await setUnanswered(env, l[0].id, "resolved");
    await logUnanswered(env, "Do you sell lists for plumbers?", "/");
    l = (await listUnanswered(env, "new")).items; expect(l).toHaveLength(1);
  });
  it("saves a lead only with consent", async () => {
    expect(await createLead(env, { name: "A", email: "a@b.co", message: "hello there friend", page: "/", consent: false })).toBeNull();
    const r = await createLead(env, { name: "Ann", email: "Ann@B.co", message: "hello there friend", page: "/", consent: true });
    expect(r?.reference).toMatch(/^BP-/);
    const { items } = await listLeads(env, "new"); expect(items[0].email).toBe("ann@b.co");
    await updateLead(env, items[0].id, "contacted", "called"); expect((await listLeads(env, "contacted")).items).toHaveLength(1);
  });
});

afterAll(async () => { await proxy?.dispose(); });
