import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPlatformProxy, type PlatformProxy } from "wrangler";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildContext, openingFor } from "@/lib/beigepilot/proactive/context";
import { advance, dueStage, freshState, markEvent, onHidden, onNothing, onShown, onStop } from "@/lib/beigepilot/proactive/schedule";
import { kindsFor, selectTemplate, type ProContext } from "@/lib/beigepilot/proactive/select";
import { getPro, proStats, recordEvent, savePro } from "@/lib/beigepilot/proactive/store";
import { DEFAULT_PRO, DEFAULT_TEMPLATES, checkDelays, checkTemplate, cleanSearch, fill, parsePro, varsIn } from "@/lib/beigepilot/proactive/types";
import { getProducts } from "@/lib/catalog";

const D = DEFAULT_PRO.delays;
const gate = { chatOpen: false, bubbleVisible: false, pathBlocked: false, mobileBlocked: false };
const base: ProContext = { page: "home", viewed: 0, cart: [] };
const real = () => getProducts().find((p) => p.status === "live" && !p.placeholderData)!;

describe("defaults", () => {
  it("every default template is valid and only uses known variables", () => {
    for (const t of DEFAULT_TEMPLATES) { expect(checkTemplate(t), t.id).toBeNull(); expect(varsIn(t.text + t.cta + t.ask).length >= 0).toBe(true); }
    expect(checkDelays(D)).toBeNull();
    for (const st of [1, 2, 3]) expect(DEFAULT_TEMPLATES.some((t) => t.stage === st && t.kind === "default")).toBe(true);
  });
  it("copy never promises discounts, urgency or exit intent", () => { for (const t of DEFAULT_TEMPLATES) expect(t.text + t.cta + t.ask).not.toMatch(/discount|%|before you go|limited|last chance/i); });
  it("rejects bad admin input", () => {
    expect(checkTemplate({ text: "Save 20% today", cta: "Go", ask: "Hi" })).toMatch(/discount/i);
    expect(checkTemplate({ text: "Hello {nope}", cta: "Go", ask: "Hi" })).toMatch(/Unknown variable/);
    expect(checkTemplate({ text: "x".repeat(401), cta: "Go", ask: "Hi" })).not.toBeNull();
    expect(checkTemplate({ text: "Hi", cta: "x".repeat(33), ask: "Hi" })).not.toBeNull();
    expect(checkDelays([0, 10, 240])).toMatch(/apart/);
    expect(checkDelays([0, 120, 100])).not.toBeNull();
    expect(checkDelays([0, 120])).not.toBeNull();
  });
  it("parsePro never throws and falls back per field", () => {
    expect(parsePro("not json")).toEqual(DEFAULT_PRO);
    const p = parsePro(JSON.stringify({ delays: [0, 5, 6], bubbleSeconds: 999, templates: [{ id: "s1-default", text: "Hi there", cta: "Go", ask: "Q?", on: true }, { id: "s1-usa", text: "50% off", cta: "Go", ask: "Q" }] }));
    expect(p.delays).toEqual(D); expect(p.bubbleSeconds).toBe(60);
    expect(p.templates.find((t) => t.id === "s1-default")!.text).toBe("Hi there");
    expect(p.templates.find((t) => t.id === "s1-usa")!.text).toBe(DEFAULT_TEMPLATES.find((t) => t.id === "s1-usa")!.text);
  });
  it("search terms with personal data are refused", () => {
    expect(cleanSearch("dentists in texas")).toBe("dentists in texas");
    expect(cleanSearch("me@x.com")).toBe(""); expect(cleanSearch("call 5551234567")).toBe(""); expect(cleanSearch("x".repeat(200)).length).toBe(60);
  });
});

describe("schedule: 0 / 2 / 4 minutes of ACTIVE browsing, three messages at most", () => {
  const run = (s0 = freshState("a".repeat(16)), seconds = 400, visible = (_t: number) => true) => {
    let s = s0; const shown: { stage: number; at: number }[] = [];
    for (let t = 0; t < seconds; t++) {
      s = advance(s, 1000, visible(t));
      const st = dueStage(s, D, gate);
      if (st) { s = onShown(s, st, `t${st}`); shown.push({ stage: st, at: Math.round(s.activeMs / 1000) }); s = onHidden({ ...s, activeMs: s.activeMs + 0 }); }
    }
    return shown;
  };
  it("shows messages at 0:01, 2:00 and 4:00 and never a fourth", () => {
    const shown = run();
    expect(shown.map((x) => x.stage)).toEqual([1, 2, 3]);
    expect(shown[0].at).toBeLessThanOrEqual(1); expect(shown[1].at).toBe(120); expect(shown[2].at).toBe(240);
  });
  it("a hidden tab does not count", () => {
    const shown = run(freshState("b".repeat(16)), 400, (t) => t >= 100); // 100 s hidden first
    expect(shown[0].at).toBeLessThanOrEqual(1); expect(shown[1].at).toBe(120);
    const late = run(freshState("b".repeat(16)), 130, (t) => t < 30 || t >= 100); // 70 s hidden: only 60 s of active time
    expect(late.map((x) => x.stage)).toEqual([1]);
  });
  it("a long sleep never fast-forwards the schedule or fires several at once", () => {
    let s = onShown(freshState("c".repeat(16)), 1, "x"); s = onHidden(s);
    s = advance(s, 3_600_000, true); // one tick after the laptop slept an hour
    expect(s.activeMs).toBeLessThanOrEqual(1500);
    expect(dueStage(s, D, gate)).toBeNull();
  });
  it("only the next stage is ever due, even after a long absence", () => {
    let s = freshState("d".repeat(16)); s = { ...s, activeMs: 500_000 };
    expect(dueStage(s, D, gate)).toBe(1);
    s = onShown(s, 1, "a"); s = onHidden(s);
    expect(dueStage({ ...s, activeMs: s.activeMs + 25_000 }, D, gate)).toBe(2);
  });
  it("nothing while a bubble is visible, the chat is open, checkout, or phones are switched off", () => {
    const s = { ...freshState("e".repeat(16)), activeMs: 300_000 };
    for (const g of [{ bubbleVisible: true }, { chatOpen: true }, { pathBlocked: true }, { mobileBlocked: true }]) expect(dueStage(s, D, { ...gate, ...g })).toBeNull();
  });
  it("dismiss, click or chatting stops everything for the session", () => {
    const s = onStop({ ...freshState("f".repeat(16)), activeMs: 500_000 });
    expect(dueStage(s, D, gate)).toBeNull();
  });
  it("after the server had nothing suitable it waits before asking again", () => {
    let s = { ...freshState("g".repeat(16)), activeMs: 10_000 }; s = onNothing(s);
    expect(dueStage(s, D, gate)).toBeNull();
    expect(dueStage({ ...s, activeMs: 31_000 }, D, gate)).toBe(1);
  });
  it("analytics events are counted once per stage and event", () => {
    let s = freshState("h".repeat(16)); const a = markEvent(s, "1:click"); s = a.s; expect(a.fresh).toBe(true);
    expect(markEvent(s, "1:click").fresh).toBe(false); expect(markEvent(s, "2:click").fresh).toBe(true);
  });
  it("a refresh keeps the place: stage and shown ids survive serialisation", () => {
    let s = onShown({ ...freshState("i".repeat(16)), activeMs: 5000 }, 1, "s1-default");
    s = JSON.parse(JSON.stringify(s));
    expect(s.stage).toBe(1); expect(dueStage({ ...s, activeMs: 100_000 }, D, gate)).toBeNull(); // message 2 not due before 120 s
  });
});

describe("template choice uses only real context", () => {
  const p = real();
  it("falls back to the default welcome with no context, and never repeats a template", () => {
    const a = selectTemplate(1, base, DEFAULT_PRO, [])!;
    expect(a.template.id).toBe("s1-default");
    expect(selectTemplate(1, base, DEFAULT_PRO, ["s1-default"])).toBeNull();
    expect(a.text).toMatch(/Welcome to BeigeLeads/);
    expect(selectTemplate(3, base, DEFAULT_PRO, [])!.text).not.toMatch(/before you go/i);
  });
  it("product page wins, with the real product name", () => {
    const pick = selectTemplate(1, { ...base, page: "product", product: p.name, industry: "Dentists", country: "United States", countrySlug: "united-states" }, DEFAULT_PRO, [])!;
    expect(pick.template.id).toBe("s1-product"); expect(pick.text).toContain(p.name); expect(pick.cta).toBe("Help Me Choose");
  });
  it("priority: product > cart > search > industry > country", () => {
    const c: ProContext = { ...base, product: "P", cart: ["X"], search: "dentists", industry: "Dentists", country: "Germany", viewed: 1 };
    expect(kindsFor(c, 1).slice(0, 4)).toEqual(["product", "cart", "search", "healthcare"]);
    expect(kindsFor({ ...base, industry: "Cafes", country: "Germany" }, 1).slice(0, 2)).toEqual(["industry", "country"]);
  });
  it("cart messages need a real cart and respect the switch", () => {
    expect(selectTemplate(1, { ...base, page: "cart", cart: ["A", "B"] }, DEFAULT_PRO, [])!.text).toContain("2 lists");
    expect(selectTemplate(1, { ...base, page: "cart", cart: [] }, DEFAULT_PRO, [])!.template.kind).toBe("default");
    expect(selectTemplate(1, { ...base, page: "cart", cart: ["A"] }, { ...DEFAULT_PRO, cartMessages: false }, [])!.template.kind).toBe("default");
  });
  it("search messages quote the real term; budget words give the budget message at stage 3", () => {
    expect(selectTemplate(1, { ...base, search: "dentists in texas" }, DEFAULT_PRO, [])!.text).toContain("dentists in texas");
    expect(selectTemplate(3, { ...base, search: "cheap dentist lists budget" }, DEFAULT_PRO, [])!.template.id).toBe("s3-budget");
  });
  it("comparison message only when two real products were viewed", () => {
    expect(selectTemplate(2, { ...base, page: "product", product: "A", viewed: 1 }, DEFAULT_PRO, [])!.template.id).toBe("s2-product");
    expect(selectTemplate(2, { ...base, page: "product", product: "A", otherProduct: "B", viewed: 2 }, DEFAULT_PRO, [])!.template.id).toBe("s2-multi");
  });
  it("healthcare and real estate get their own welcome; the US gets the USA one", () => {
    expect(selectTemplate(1, { ...base, industry: "Dentists" }, DEFAULT_PRO, [])!.template.id).toBe("s1-healthcare");
    expect(selectTemplate(1, { ...base, industry: "Real Estate Agents" }, DEFAULT_PRO, [])!.template.id).toBe("s1-realestate");
    expect(selectTemplate(1, { ...base, country: "United States", countrySlug: "united-states" }, DEFAULT_PRO, [])!.template.id).toBe("s1-usa");
  });
  it("disabled templates are skipped; no variables are ever left unfilled", () => {
    const off = { ...DEFAULT_PRO, templates: DEFAULT_PRO.templates.map((t) => (t.id === "s1-product" ? { ...t, on: false } : t)) };
    expect(selectTemplate(1, { ...base, product: "P" }, off, [])!.template.id).not.toBe("s1-product");
    expect(fill("Hi {product_name}", {})).toBe("Hi");
    for (const t of DEFAULT_TEMPLATES) { const x = selectTemplate(t.stage, { ...base, product: "P", other_product: "Q", otherProduct: "Q", viewed: 2, cart: ["A"], search: "s", industry: "I", country: "C" } as ProContext, { ...DEFAULT_PRO, templates: [t] }, []); if (x) expect(x.text + x.cta + x.ask).not.toMatch(/[{}]/); }
  });
});

describe("real context from the catalog", () => {
  const p = real();
  it("product page, category page, cart, search and recent products", () => {
    const c = buildContext({ path: `/lists/${p.slug}`, recent: [], cart: [] });
    expect(c.page).toBe("product"); expect(c.product).toBe(p.name); expect(c.country).toBeTruthy();
    expect(buildContext({ path: "/", recent: [], cart: [] }).page).toBe("home");
    expect(buildContext({ path: "/cart", recent: [], cart: [p.slug, "nope"] }).cart).toEqual([p.name]);
    const s = buildContext({ path: "/lists", search: "dentists in texas", recent: [], cart: [] });
    expect(s.page).toBe("search"); expect(s.search).toBe("dentists in texas");
    expect(buildContext({ path: "/lists", search: "me@x.com", recent: [], cart: [] }).page).toBe("other");
    const other = getProducts().find((x) => x.slug !== p.slug)!;
    const m = buildContext({ path: `/lists/${p.slug}`, recent: [`/lists/${other.slug}`, `/lists/${p.slug}`], cart: [] });
    expect(m.viewed).toBe(2); expect(m.otherProduct).toBe(other.name);
    expect(buildContext({ path: "/blog/x", recent: [], cart: [] }).page).toBe("other");
  });
  it("the opening line names only real packages; prices only for real (non-placeholder) lists", () => {
    const c = buildContext({ path: `/lists/${p.slug}`, recent: [], cart: [] });
    const o = openingFor("Happy to help.", "product", `/lists/${p.slug}`, c);
    expect(o).toContain("Packages for the"); expect(o).toMatch(/\$\d/);
    const ph = getProducts().find((x) => x.placeholderData);
    if (ph) expect(openingFor("Hi", "product", `/lists/${ph.slug}`, c)).not.toMatch(/\$\d/);
  });
});

describe("settings and analytics (local D1)", () => {
  let proxy: PlatformProxy<CloudflareEnv>; let env: CloudflareEnv;
  beforeAll(async () => {
    proxy = await getPlatformProxy<CloudflareEnv>({ configPath: "wrangler.jsonc", persist: { path: mkdtempSync(join(tmpdir(), "pp-")) } });
    env = proxy.env as CloudflareEnv;
    for (const f of ["0037_beigepilot.sql", "0046_pilo_proactive.sql"]) {
      const sql = readFileSync(join("drizzle", f), "utf8").split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
      for (const s of sql.split(";").map((x) => x.trim()).filter(Boolean)) await env.DB.prepare(s).run();
    }
  }, 60_000);
  afterAll(async () => { await proxy?.dispose(); });
  it("defaults before anything is saved, saved settings after, cache cleared on save", async () => {
    expect((await getPro(env)).delays).toEqual(D);
    await savePro(env, { ...DEFAULT_PRO, delays: [5, 100, 200], mobile: false });
    const s = await getPro(env); expect(s.delays).toEqual([5, 100, 200]); expect(s.mobile).toBe(false);
  });
  it("events are never double counted and stats are per stage", async () => {
    const e = { sid: "ab".repeat(8), stage: 1 as const, event: "impression" as const, template: "s1-default", page: "home" };
    expect(await recordEvent(env, e)).toBe(true); expect(await recordEvent(env, e)).toBe(false);
    await recordEvent(env, { ...e, event: "click" }); await recordEvent(env, { ...e, stage: 2 });
    await recordEvent(env, { ...e, sid: "cd".repeat(8) });
    const st = await proStats(env, 30);
    expect(st.ready).toBe(true); expect(st.stages[1].impression).toBe(2); expect(st.stages[1].click).toBe(1); expect(st.stages[2].impression).toBe(1); expect(st.stages[3].impression).toBe(0);
    expect(st.templates[0]).toMatchObject({ id: "s1-default", impressions: 3 });
  });
});
