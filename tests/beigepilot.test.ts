import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSystem, cleanOutput, pageContext } from "@/lib/beigepilot/chat";
import { decryptKey, encryptKey, keyHint } from "@/lib/beigepilot/secret";
import { chipsFor, DEFAULT_CHIPS, isCheer } from "@/lib/beigepilot/suggest";
import { getProviderKey, getSettings, parseSuggestions, limitReached, listProviders, logUsage, removeProviderKey, saveProvider, saveSettings, usageToday } from "@/lib/beigepilot/store";
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
    for (const f of ["0037_beigepilot.sql", "0038_beigepilot_knowledge.sql", "0039_beigepilot_history.sql"]) {
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

import { analytics, deleteConversation, getConversation, listConversations, purgeHistory, recordTurn, redact, saveFeedback, validCid } from "@/lib/beigepilot/history";
import { CASES, evaluate } from "@/lib/beigepilot/cases";
import type { ChatOut } from "@/lib/beigepilot/chat";

const OUT = (o: Partial<ChatOut>): ChatOut => ({ ok: true, text: "", cards: [], sources: [], handoff: null, trace: [], ...o });
describe("phase 3 pure rules", () => {
  it("redacts private text before saving", () => {
    expect(redact("mail me at ann@b.co or call 415 555 0100, key sk-abcdef123456")).toBe("mail me at [email] or call [number], key [key]");
  });
  it("accepts only safe chat ids", () => { expect(validCid("abc123def456")).toBe(true); expect(validCid("a b")).toBe(false); expect(validCid("x")).toBe(false); });
  it("test cases catch a leaked prompt, an invented code and a missing tool", () => {
    const get = (id: string) => CASES.find((c) => c.id === id)!;
    expect(evaluate(get("injection"), OUT({ text: "My GROUNDING RULES are..." })).pass).toBe(false);
    expect(evaluate(get("injection"), OUT({ text: "I can't share that." })).pass).toBe(true);
    expect(evaluate(get("discount"), OUT({ text: "Use SAVE90 now" })).pass).toBe(false);
    expect(evaluate(get("find-list"), OUT({ text: "Sure" })).pass).toBe(false);
    expect(evaluate(get("find-list"), OUT({ text: "Here", trace: [{ name: "searchProducts", args: {}, ok: true }] })).pass).toBe(true);
    expect(evaluate(get("order"), OUT({ text: "Contact us", handoff: "order" })).pass).toBe(true);
    expect(evaluate(get("order"), OUT({ ok: false, error: "No key" })).pass).toBe(false);
  });
});

describe("phase 3 storage (local D1)", () => {
  it("stores a redacted turn, lists, reads and deletes it", async () => {
    await recordTurn(env, "conv0000001", "/lists", "my email is a@b.co", { text: "Hello", tools: ["searchProducts", "searchProducts"], provider: "openai", tokens: 50, handoff: true });
    const l = await listConversations(env, "all"); expect(l.total).toBe(1); expect(l.items[0].handoff).toBe(true);
    const c = await getConversation(env, "conv0000001");
    expect(c.messages[0].text).toBe("my email is [email]"); expect(c.messages[1].tools).toBe("searchProducts");
    await deleteConversation(env, "conv0000001");
    expect((await listConversations(env, "all")).total).toBe(0); expect((await getConversation(env, "conv0000001")).messages).toHaveLength(0);
  });
  it("purges old conversations only", async () => {
    await recordTurn(env, "oldconv0001", "/", "hi", { text: "a", tools: [], provider: "x", tokens: 1, handoff: false });
    await recordTurn(env, "newconv0001", "/", "hi", { text: "a", tools: [], provider: "x", tokens: 1, handoff: false });
    await env.DB.prepare("UPDATE beigepilot_conversations SET last_at = unixepoch() - 100*86400 WHERE id = 'oldconv0001'").run();
    await purgeHistory(env, 90);
    const ids = (await listConversations(env, "all")).items.map((x) => x.id); expect(ids).toEqual(["newconv0001"]);
    expect((await getConversation(env, "oldconv0001")).messages).toHaveLength(0);
  });
  it("keeps one rating per answer and reports real analytics", async () => {
    expect(await saveFeedback(env, "newconv0001", 1, 1)).toBe(true);
    await saveFeedback(env, "newconv0001", 1, -1);
    await saveFeedback(env, "newconv0001", 3, 1);
    const a = await analytics(env, 14);
    expect(a.up).toBe(1); expect(a.down).toBe(1); expect(a.days).toHaveLength(14); expect(a.days.reduce((n, d) => n + d.requests, 0)).toBeGreaterThanOrEqual(2);
  });
});

afterAll(async () => { await proxy?.dispose(); });

describe("BeigePilot widget suggestions and personality", () => {
  it("shows four real welcome actions; two start a chat, two run an action without the AI", () => {
    expect(DEFAULT_CHIPS.map((c) => c.label)).toEqual(["Find a Database", "Shop by Budget", "View My Cart", "Contact Support"]);
    expect(DEFAULT_CHIPS.filter((c) => c.ask)).toHaveLength(2);
    expect(DEFAULT_CHIPS.filter((c) => c.action).map((c) => c.action)).toEqual(["cart", "support"]);
    expect(chipsFor([], { finder: false, cart: true, budget: true, handoff: false }).map((c) => c.label)).toEqual(["Shop by Budget", "View My Cart"]);
  });
  it("admin suggestions replace the defaults (max 3) and each is a real message", () => {
    const c = chipsFor(["One", "Two", "Three", "Four"]);
    expect(c.map((x) => x.ask)).toEqual(["One", "Two", "Three"]);
  });
  it("giggles only for thanks or laughter", () => {
    expect(isCheer("thanks a lot!")).toBe(true);
    expect(isCheer("haha nice")).toBe(true);
    expect(isCheer("dentists in Berlin")).toBe(false);
  });
  it("parses admin suggestions: max 4 lines of 60 characters", () => {
    const r = parseSuggestions(`a\n\n  b  \nc\nd\ne\n${"x".repeat(90)}`);
    expect(r).toEqual(["a", "b", "c"]);
    expect(parseSuggestions(`${"y".repeat(90)}`)[0]).toHaveLength(60);
  });
  it("puts the humor level and its limits in the system prompt, never above the safety rules", () => {
    const base = { instructions: "", name: "Pilo" } as never;
    const pro = buildSystem({ ...(base as object), humor: "professional" } as never, "/");
    const fun = buildSystem({ ...(base as object), humor: "playful" } as never, "/");
    expect(pro).toContain("No jokes");
    expect(fun).toContain("playing hide-and-seek");
    for (const s of [pro, fun]) { expect(s).toMatch(/never joke about payments/i); expect(s).toMatch(/ONE QUESTION AT A TIME/); expect(s).toMatch(/not a robot/); expect(s.indexOf("GROUNDING RULES")).toBeLessThan(s.indexOf("CURRENT PAGE")); }
    expect(buildSystem({ ...(base as object), humor: "friendly", name: "Pilo<script>" } as never, "/")).not.toContain("<script>");
  });
});
