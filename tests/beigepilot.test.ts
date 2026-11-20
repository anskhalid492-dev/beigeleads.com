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
    const sql = readFileSync(join("drizzle", "0037_beigepilot.sql"), "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });

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
