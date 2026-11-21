import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { affordableItems, cheapestOver, estimate, planBundle, validPick } from "@/lib/beigepilot/budget";
import { cleanSummary, handoffSchema, submitHandoff, supportMail, ackMail } from "@/lib/beigepilot/handoff";
import { getLeadByReference, listLeads } from "@/lib/beigepilot/leads";
import { DEFAULT_SALES, parseSales, saveSettings } from "@/lib/beigepilot/store";
import { newCtx, runTool, toolsFor } from "@/lib/beigepilot/tools";
import { getProduct, getProducts } from "@/lib/catalog";
import { DEFAULT_VOLUME } from "@/lib/sales/settings";

const DE = "germany-business-email-database"; // Starter $99 / 100,000 and Professional $199 / 1,000,000
const BER = "berlin-business-email-list"; // Starter $99 / 100,000
const real = () => [getProduct(DE)!, getProduct(BER)!];

describe("budget planner (real catalog prices)", () => {
  it("only offers packages that fit, and the biggest one within budget is best", () => {
    expect(affordableItems(real(), 5000)).toEqual([]);
    const a = affordableItems(real(), 10000);
    expect(a.map((i) => i.best.slug).sort()).toEqual([BER, DE].sort());
    expect(a.find((i) => i.best.slug === DE)!.best.pkg).toBe("Starter");
    const b = affordableItems(real(), 20000);
    expect(b.find((i) => i.best.slug === DE)!.best.pkg).toBe("Professional");
  });
  it("quantity filter keeps only lists with a package of that size", () => {
    const a = affordableItems(real(), 20000, 500_000);
    expect(a.map((i) => i.best.slug)).toEqual([DE]);
  });
  it("never uses lists that are not for sale", () => {
    const ph = getProducts().find((p) => p.placeholderData || p.status !== "live");
    if (ph) expect(affordableItems([ph], 10_000_000)).toEqual([]);
  });
  it("a bundle never exceeds the budget and matches the cart's own pricing", () => {
    const items = affordableItems(real(), 30000);
    const noVol = planBundle(items, 30000, 2, undefined)!;
    expect(noVol.totalCents).toBeLessThanOrEqual(30000);
    expect(noVol.discountCents).toBe(0);
    const vol = planBundle(items, 30000, 2, DEFAULT_VOLUME)!;
    expect(vol.discountCents).toBeGreaterThan(0);
    expect(vol.totalCents).toBeLessThanOrEqual(30000);
    expect(vol.totalCents).toBe(estimate(vol.slugs, DEFAULT_VOLUME).totalCents);
    expect(vol.totalCents).toBe(vol.subtotalCents - vol.discountCents);
  });
  it("a bundle is refused when two databases cannot fit", () => {
    expect(planBundle(affordableItems(real(), 15000), 15000, 2, undefined)).toBeNull();
  });
  it("tells how far over budget the cheapest list is", () => {
    const c = cheapestOver(real(), 5000)!;
    expect(c.priceCents).toBe(9900); expect(c.overCents).toBe(4900);
  });
  it("validPick accepts real packages (any letter case) and refuses others", () => {
    expect(validPick(DE, "starter")?.pkg).toBe("Starter");
    expect(validPick(DE, "Enterprise")).toBeNull();
    expect(validPick("nope", "Starter")).toBeNull();
  });
});

describe("assistant tools", () => {
  const ctx = (sa = DEFAULT_SALES) => newCtx({} as CloudflareEnv, sa);
  it("budget tool returns real cards with the chosen package and never prices over budget as within", async () => {
    const c = ctx();
    const r = JSON.parse(await runTool(c, "findWithinBudget", { budgetUsd: 100, query: "germany" }));
    expect(r.results.length).toBeGreaterThan(0);
    expect(JSON.stringify(r.results)).not.toContain("Professional");
    expect(c.cards.every((x) => x.pick === "Starter")).toBe(true);
  });
  it("nothing within budget: says so, shows the cheapest as OVER budget (only when alternatives are on)", async () => {
    const c = ctx();
    const r = JSON.parse(await runTool(c, "findWithinBudget", { budgetUsd: 20 }));
    expect(r.nothingWithinBudget).toBe(true);
    expect(r.cheapestAvailable.overBudgetByUsd).toBeTruthy();
    expect(c.miss).toBe(true);
    const off = ctx({ ...DEFAULT_SALES, alternatives: false });
    const r2 = JSON.parse(await runTool(off, "findWithinBudget", { budgetUsd: 20 }));
    expect(r2.cheapestAvailable).toBeUndefined();
    expect(off.cards).toHaveLength(0);
  });
  it("rejects a nonsense budget", async () => {
    expect(await runTool(ctx(), "findWithinBudget", { budgetUsd: "lots" })).toContain("error");
    expect(await runTool(ctx(), "findWithinBudget", { budgetUsd: -5 })).toContain("error");
  });
  it("several databases: bundle total is an estimate from the real pricing", async () => {
    const c = ctx();
    const r = JSON.parse(await runTool(c, "findWithinBudget", { budgetUsd: 300, count: 2 }));
    expect(r.bundle.lines).toHaveLength(2);
    expect(c.bundle?.lines).toHaveLength(2);
    expect(r.bundle.note).toMatch(/cart checks/i);
  });
  it("quantity: a request above every package is not matched as exact", async () => {
    const r = JSON.parse(await runTool(ctx(), "searchProducts", { query: "germany business", minRecords: 5_000_000 }));
    expect(r.matches).toHaveLength(0);
    const r2 = JSON.parse(await runTool(ctx(), "searchProducts", { query: "germany business", minRecords: 1_000_000 }));
    expect(r2.matches.map((m: { slug: string }) => m.slug)).toEqual([DE]);
  });
  it("add to cart: asks for the package when unclear, never adds, validates the package name", async () => {
    const c = ctx();
    const r = JSON.parse(await runTool(c, "prepareAddToCart", { slug: DE }));
    expect(r.package).toBeNull();
    expect(c.cards[0].pick).toBeUndefined();
    expect(r.note).toMatch(/Never say it was added/i);
    const ok = JSON.parse(await runTool(c, "prepareAddToCart", { slug: DE, package: "professional" }));
    expect(ok.package).toBe("Professional");
    expect(c.cards).toHaveLength(1);
    expect(c.cards[0].pick).toBe("Professional");
    expect(await runTool(c, "prepareAddToCart", { slug: DE, package: "Gold" })).toContain("No package named");
    expect(await runTool(c, "prepareAddToCart", { slug: "does-not-exist" })).toContain("unknown product");
  });
  it("one package = no question needed", async () => {
    const c = ctx();
    const r = JSON.parse(await runTool(c, "prepareAddToCart", { slug: BER }));
    expect(r.package).toBe("Starter");
  });
  it("a list that is not for sale cannot be prepared for the cart", async () => {
    const ph = getProducts().find((p) => p.placeholderData || p.status !== "live");
    if (!ph) return;
    expect(await runTool(ctx(), "prepareAddToCart", { slug: ph.slug })).toContain("not currently for sale");
  });
  it("admin switches remove the tools and the server refuses them", async () => {
    const sa = { ...DEFAULT_SALES, cart: false, budget: false, handoff: false, finder: false };
    const names = toolsFor(sa).map((t) => t.name);
    for (const n of ["prepareAddToCart", "findWithinBudget", "suggestContact", "searchProducts", "showProductCards"]) expect(names).not.toContain(n);
    expect(await runTool(ctx(sa), "prepareAddToCart", { slug: DE })).toContain("switched off");
    expect(toolsFor(DEFAULT_SALES).map((t) => t.name)).toEqual(expect.arrayContaining(["prepareAddToCart", "findWithinBudget"]));
  });
  it("max recommendations limits the cards", async () => {
    const c = ctx({ ...DEFAULT_SALES, maxRecs: 1 });
    await runTool(c, "showProductCards", { slugs: [DE, BER] });
    expect(c.cards).toHaveLength(1);
  });
  it("sales settings parse safely", () => {
    expect(parseSales({}).maxRecs).toBe(5);
    expect(parseSales({ saMaxRecs: "99" }).maxRecs).toBe(5);
    expect(parseSales({ saFinder: "0" }).finder).toBe(false);
    expect(parseSales({ saSupportEmail: "nonsense" }).supportEmail).toBe("");
    expect(parseSales({ saSupportEmail: "A@B.com" }).supportEmail).toBe("a@b.com");
  });
});

describe("support emails and summary", () => {
  it("owner mail has the fields from the brief and no customer data in a link", () => {
    const m = supportMail({ reference: "BP-ABC12345", name: "Sam", email: "sam@x.test", message: "Hello there", summary: "Visitor: hi" });
    expect(m.subject).toBe("New BeigePilot Support Request — BP-ABC12345");
    for (const t of ["Customer: Sam", "Email: sam@x.test", "Ticket ID: BP-ABC12345", "Source: BeigePilot AI Assistant"]) expect(m.text).toContain(t);
    expect(m.text).not.toMatch(/https:\/\/\S*sam@/);
  });
  it("customer mail promises no response time", () => {
    const m = ackMail({ reference: "BP-ABC12345", name: "Sam Jones" });
    expect(m.subject).toBe("We've Received Your BeigeLeads Support Request");
    expect(m.text).toContain("Hi Sam,");
    expect(m.text).toContain("BP-ABC12345");
    expect(m.text).not.toMatch(/within \d|hours|24|business day/i);
  });
  it("summary removes emails and numbers and is bounded", () => {
    const s = cleanSummary("Visitor: mail me at a@b.com or 555 123 4567\n" + "x".repeat(900));
    expect(s).not.toContain("a@b.com"); expect(s).not.toMatch(/555 123/);
    expect(s.split("\n").every((l) => l.length <= 260)).toBe(true);
  });
});

let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
const sent: { to: string; subject: string }[] = [];
let failOwner = false;
const form = (o: Record<string, unknown> = {}) => handoffSchema.parse({ name: "Sam Jones", email: "sam@x.test", message: "I need a custom list please", consent: "yes", turnstileToken: "t", ...o });

describe("human support handoff (local D1)", () => {
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "sa-")) } });
    env = { ...proxy.env, RESEND_API_KEY: "test-key", NOTIFY_EMAIL: "owner@beige.test", EMAIL_FROM: "BeigeLeads <hello@beige.test>" } as CloudflareEnv;
    for (const f of ["0037_beigepilot.sql", "0038_beigepilot_knowledge.sql", "0043_beigepilot_support.sql"]) {
      const sql = readFileSync(join("drizzle", f), "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
      for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
    }
    vi.stubGlobal("fetch", vi.fn(async (_u: string, init: { body: string }) => {
      const b = JSON.parse(init.body) as { to: string[]; subject: string };
      const owner = b.to.includes("owner@beige.test");
      sent.push({ to: b.to.join(","), subject: b.subject });
      return owner && failOwner ? new Response(JSON.stringify({ message: "boom" }), { status: 500 }) : new Response(JSON.stringify({ id: "m1" }), { status: 200 });
    }));
  }, 60_000);
  afterEach(() => { sent.length = 0; failOwner = false; });
  afterAll(async () => { vi.unstubAllGlobals(); await proxy?.dispose(); });

  it("creates a ticket, stores the summary only with consent, and sends both emails", async () => {
    const r = await submitHandoff(env, form({ shareChat: "yes", summary: "Visitor: need 5M contacts" }));
    expect(r?.reference).toMatch(/^BP-[A-Z0-9]{8}$/);
    const l = (await getLeadByReference(env, r!.reference))!;
    expect(l.summary).toContain("need 5M contacts");
    expect(l.ownerNotify).toBe("sent"); expect(l.customerEmail).toBe("sent");
    expect(sent.map((s) => s.subject)).toEqual([`New BeigePilot Support Request — ${r!.reference}`, "We've Received Your BeigeLeads Support Request"]);
    const n = await submitHandoff(env, form({ email: "other@x.test", shareChat: "no", summary: "Visitor: secret" }));
    expect((await getLeadByReference(env, n!.reference))!.summary).toBe("");
  });
  it("the same message twice returns the same ticket and sends nothing again", async () => {
    const a = await submitHandoff(env, form({ email: "dup@x.test", message: "Duplicate message here" }));
    sent.length = 0;
    const b = await submitHandoff(env, form({ email: "dup@x.test", message: "Duplicate message here" }));
    expect(b!.reference).toBe(a!.reference);
    expect(sent).toHaveLength(0);
    expect((await listLeads(env, "all")).items.filter((x) => x.email === "dup@x.test")).toHaveLength(1);
  });
  it("a failed support email keeps the ticket and is visible to admins", async () => {
    failOwner = true;
    const r = await submitHandoff(env, form({ email: "fail@x.test", message: "Email will fail for this one" }));
    expect(r).not.toBeNull();
    const l = (await getLeadByReference(env, r!.reference))!;
    expect(l.ownerNotify).toBe("failed"); expect(l.customerEmail).toBe("sent");
  });
  it("uses the configured support address and honours the off switch", async () => {
    await saveSettings(env, { saSupportEmail: "team@beige.test" });
    await submitHandoff(env, form({ email: "cfg@x.test", message: "Goes to the configured address" }));
    expect(sent[0].to).toBe("team@beige.test");
    await saveSettings(env, { saHandoff: "0" });
    expect(await submitHandoff(env, form({ email: "off@x.test", message: "Switched off, so refused" }))).toBeNull();
    await saveSettings(env, { saHandoff: "1", saSupportEmail: "" });
  });
  it("consent is required by the form schema", () => {
    expect(() => handoffSchema.parse({ name: "Sam", email: "s@x.test", message: "long enough message", turnstileToken: "t" })).toThrow();
  });
});
