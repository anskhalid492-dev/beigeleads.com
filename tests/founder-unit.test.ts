// Founder-led Customer Success: template library, layouts, personalization safety, journey and frequency rules (pure code).
import { describe, expect, it } from "vitest";
import { FOUNDER_TEMPLATES, GROUPS, INTERNAL_TEMPLATES } from "@/lib/founder/templates";
import { renderFounder, replyUrl } from "@/lib/founder/render";
import { checkContent, exampleVars } from "@/lib/system-emails/store";
import { renderEmail, safeUrl } from "@/lib/system-emails/render";
import { SENDERS, SENDER_DISPLAY, fromHeader } from "@/lib/founder/config";
import { capReason, choose, plan, reactivationUnanswered, skipReason, type Facts } from "@/lib/founder/journey";
import { DEFAULT_CS, goLiveBlockers, parseCs } from "@/lib/founder/settings";

const meta = new Map(FOUNDER_TEMPLATES.map((t) => [t.key, t.founder!]));
const list = FOUNDER_TEMPLATES.map((t) => ({ key: t.key, f: t.founder! }));
const byId = (n: string) => FOUNDER_TEMPLATES.find((t) => t.founder!.id === `CS-${n}`)!;
const NOW = 2_000_000_000; const D = 86400;
const base = (o: Partial<Facts> = {}): Facts => ({
  now: NOW, customer: { status: "active", enrolledAt: NOW - 100 * D }, firstPaidAt: NOW - 10 * D, firstFulfilledAt: NOW - 10 * D, paidAts: [NOW - 10 * D], lastPaidAt: NOW - 10 * D, history: [],
  unsubscribedAll: false, prefs: { recs: true, products: true, founder: true, education: true, offers: true }, frequency: "normal", supportOpen: false, unhappy: false, feedbackGiven: false,
  shared: { business: false, audience: false, goals: false }, hasResource: true, segmentation: true, events: {}, ...o,
});
const on = (keys: string[]) => ({ ...DEFAULT_CS, enabled: Object.fromEntries(keys.map((k) => [k, true])) });

describe("library", () => {
  it("has 36 customer emails (6 per category), 6 internal ones, unique keys", () => {
    expect(FOUNDER_TEMPLATES).toHaveLength(36); expect(INTERNAL_TEMPLATES).toHaveLength(6);
    for (const g of GROUPS) expect(FOUNDER_TEMPLATES.filter((t) => t.founder!.group === g)).toHaveLength(6);
    expect(new Set([...FOUNDER_TEMPLATES, ...INTERNAL_TEMPLATES].map((t) => t.key)).size).toBe(42);
  });
  it("matches the brief's subjects and senders", () => {
    expect(byId("01").content.subject).toBe("{{first_name}}, a personal thank you from me");
    expect(byId("20").content.subject).toBe("{{first_name}}, a few databases you might find useful");
    expect(byId("36").content.cta?.label).toBe("Manage My Email Preferences");
    const sender = (n: string) => byId(n).founder!.sender;
    for (const n of ["01", "02", "03", "07", "08", "09", "11", "12", "13", "14", "15", "16", "17", "18"]) expect(sender(n)).toBe("A");
    for (const n of ["04", "05", "06", "10", "25", "26", "27", "28"]) expect(sender(n)).toBe("B");
    for (const n of ["19", "20", "21", "22", "23", "24"]) expect(sender(n)).toBe("C");
    expect(fromHeader("A")).toBe(`${SENDER_DISPLAY} <anus@beigeleads.com>`);
    expect(SENDERS.B.email).toBe("mranus@beigeleads.com"); expect(SENDERS.C.email).toBe("anas@beigeleads.com");
  });
  it("every template validates and renders with no unresolved variable", () => {
    for (const t of [...FOUNDER_TEMPLATES, ...INTERNAL_TEMPLATES]) {
      const c = checkContent(t, t.content); expect(c.errors, t.key).toEqual([]);
      const r = renderEmail(t.content, exampleVars(t), { founder: t.founder });
      expect(r.issues.missing, t.key).toEqual([]); expect(r.issues.badUrl, t.key).toBe(false);
      expect(r.html).not.toMatch(/\{\{[^}]*\}\}/); expect(r.text).not.toMatch(/\{\{|\}\}/);
      expect(r.text.length).toBeGreaterThan(40);
    }
  });
  it("never mentions the excluded services", () => {
    const all = JSON.stringify([...FOUNDER_TEMPLATES, ...INTERNAL_TEMPLATES].map((t) => t.content));
    expect(all).not.toMatch(/voices|video testimonial|\$100|data health|re-verif|cleaning|loyalty|points|subscription|dashboard/i);
  });
  it("optional emails carry preferences and unsubscribe links; service and support ones do not need them", () => {
    for (const t of FOUNDER_TEMPLATES) {
      const f = t.founder!; const r = renderEmail(t.content, exampleVars(t), { founder: f });
      if (f.klass === "lifecycle" || f.klass === "promotional") { expect(r.html).toContain("Unsubscribe"); expect(r.text).toContain("Unsubscribe:"); }
      else expect(r.html).not.toContain("Unsubscribe");
    }
  });
  it("optional emails are refused when the unsubscribe link is missing", () => {
    const t = byId("01"); const v = { ...exampleVars(t) }; delete v.unsubscribe_url;
    expect(renderEmail(t.content, v, { founder: t.founder }).issues.missing).toContain("unsubscribe_url");
  });
  it("uses only brand palette colours and shows the founder signature, never a fake face", () => {
    const ok = new Set(["#FBF8F1", "#F4EEDF", "#E8DEC6", "#D8EADF", "#2D6A4F", "#1B4332", "#0F2A1D", "#7C3AED", "#FFFFFF", "#8FD0A9", "#D8C9A3", "#EDE4FD"]);
    for (const layout of ["A", "B", "C", "D", "E"]) {
      const t = FOUNDER_TEMPLATES.find((x) => x.founder!.layout === layout)!;
      const r = renderEmail(t.content, exampleVars(t), { founder: t.founder, cards: [{ name: "X", meta: "Y", url: "https://beigeleads.com/lists/x" }] });
      for (const m of r.html.matchAll(/#[0-9A-Fa-f]{6}\b/g)) expect(ok.has(m[0].toUpperCase()), `${layout} ${m[0]}`).toBe(true);
      expect(r.html).toContain("Anus"); expect(r.html).toContain("Founder, BeigeLeads"); expect(r.html).toContain("/founder/anus-192.jpg");
    }
  });
  it("shows at most three recommendation cards and escapes their text", () => {
    const t = byId("20"); const cards = Array.from({ length: 5 }, (_, i) => ({ name: `<b>L${i}</b>`, meta: "M", url: "https://beigeleads.com/lists/x" }));
    const r = renderFounder(t.content, exampleVars(t), { founder: t.founder!, cards });
    expect((r.html.match(/View this database/g) ?? []).length).toBe(3); expect(r.html).not.toContain("<b>L0");
  });
  it("reply CTAs are encoded mailto links to hello@ and unsafe addresses are refused", () => {
    const u = replyUrl("My order & more", "Order reference: ABC\n\n");
    expect(u).toBe("mailto:hello@beigeleads.com?subject=My%20order%20%26%20more&body=Order%20reference%3A%20ABC%0A%0A");
    expect(safeUrl(u)).toBe(u); expect(safeUrl("mailto:evil@example.com?subject=x")).toBeNull(); expect(safeUrl("javascript:alert(1)")).toBeNull();
  });
  it("a resource CTA falls back to Reply to Anus when no published resource exists", () => {
    const t = byId("02"); const v = { ...exampleVars(t) }; delete v.resource_url;
    const r = renderFounder(t.content, v, { founder: t.founder! });
    expect(r.html).toContain("Reply to Anus"); expect(r.html).toContain("mailto:hello@beigeleads.com");
  });
  it("a missing first name never leaves a gap: the subject and heading drop it, the greeting reads 'Hey there,'", () => {
    const t = byId("01"); const v = { ...exampleVars(t) }; delete v.first_name;
    const r = renderFounder(t.content, v, { founder: t.founder! });
    expect(r.subject).toBe("A personal thank you from me"); expect(r.html).toContain("Hey there,"); expect(r.html).toContain("Glad you&#39;re here."); expect(r.html).not.toMatch(/, \./);
  });
});

describe("journey rules", () => {
  it("nothing is due while a template is off (default)", () => { expect(plan(list, base(), DEFAULT_CS).due).toEqual([]); });
  it("a template becomes due after its delay and expires after its window", () => {
    const k = byId("04").key; const s = on([k]);
    expect(plan(list, base({ firstFulfilledAt: NOW - 3 * D }), s).due).toEqual([]);
    expect(plan(list, base({ firstFulfilledAt: NOW - 8 * D }), s).due.map((d) => d.key)).toEqual([k]);
    const late = plan(list, base({ firstFulfilledAt: NOW - 60 * D }), s);
    expect(late.due).toEqual([]); expect(late.skipped[0]?.reason).toContain("expired");
  });
  it("a delay override moves the due time", () => {
    const k = byId("04").key; const s = { ...on([k]), delays: { [k]: 24 * 2 } };
    expect(plan(list, base({ firstFulfilledAt: NOW - 3 * D }), s).due).toHaveLength(1);
  });
  it("never repeats an email already sent or scheduled, but retries a failed one", () => {
    const k = byId("04").key; const s = on([k]);
    const f = (st: "sent" | "failed") => base({ firstFulfilledAt: NOW - 8 * D, history: [{ key: k, reference: "-", status: st, at: NOW - D }] });
    expect(plan(list, f("sent"), s).due).toEqual([]); expect(plan(list, f("failed"), s).due).toHaveLength(1);
  });
  it("skip rules: unsubscribed, preference off, open support, unhappy promotional, paused customer", () => {
    const rec = byId("20").founder!; const fo = byId("09").founder!;
    expect(skipReason("x", rec, base({ unsubscribedAll: true }), DEFAULT_CS)).toBe("unsubscribed");
    expect(skipReason("x", rec, base({ prefs: { recs: false, products: true, founder: true, education: true, offers: true } }), DEFAULT_CS)).toContain("preference");
    expect(skipReason("x", fo, base({ supportOpen: true }), DEFAULT_CS)).toContain("support");
    expect(skipReason("x", rec, base({ unhappy: true }), DEFAULT_CS)).toContain("unhappy");
    expect(skipReason("x", fo, base({ customer: { status: "paused", enrolledAt: 0 } }), DEFAULT_CS)).toContain("paused");
    expect(skipReason("x", byId("26").founder!, base({ unsubscribedAll: true, supportOpen: true }), DEFAULT_CS)).toBeNull(); // support replies ignore unsubscribe
  });
  it("content skips: feedback already given, business already shared, no resource, no segmentation", () => {
    expect(skipReason("x", byId("04").founder!, base({ feedbackGiven: true }), DEFAULT_CS)).toContain("feedback");
    expect(skipReason("x", byId("07").founder!, base({ shared: { business: true, audience: false, goals: false } }), DEFAULT_CS)).toContain("business");
    expect(skipReason("x", byId("13").founder!, base({ hasResource: false }), DEFAULT_CS)).toContain("resource");
    expect(skipReason("x", byId("15").founder!, base({ segmentation: false }), DEFAULT_CS)).toContain("segmentation");
  });
  it("frequency: minimum gap, first-week cap, weekly cap, 30-day cap, 'less often'", () => {
    const f = byId("09").founder!; const sent = (daysAgo: number[]) => daysAgo.map((d, i) => ({ key: `k${i}`, reference: "-", status: "sent" as const, at: NOW - d * D }));
    expect(capReason(f, base({ history: sent([1]) }), DEFAULT_CS)).toContain("gap");
    expect(capReason(f, base({ history: sent([4]) }), DEFAULT_CS)).toContain("weekly");
    expect(capReason(f, base({ history: sent([8]) }), DEFAULT_CS)).toBeNull();
    expect(capReason(f, base({ firstPaidAt: NOW - 5 * D, history: sent([3.5]) }), DEFAULT_CS)).toBeNull(); // first week allows 2
    expect(capReason(f, base({ firstPaidAt: NOW - 5 * D, history: sent([3.5, 4]) }), DEFAULT_CS)).toContain("first-week");
    expect(capReason(f, base({ firstPaidAt: NOW - 90 * D, history: sent([8, 15, 22, 29]) }), DEFAULT_CS)).toContain("30-day");
    expect(capReason(f, base({ frequency: "less", firstPaidAt: NOW - 90 * D, history: sent([5]) }), DEFAULT_CS)).toContain("weekly");
  });
  it("service and support emails and purchase thank-yous ignore the caps", () => {
    const hist = [{ key: "k", reference: "-", status: "sent" as const, at: NOW - 3600 }];
    expect(capReason(byId("26").founder!, base({ history: hist }), DEFAULT_CS)).toBeNull();
    expect(capReason(byId("01").founder!, base({ history: hist }), DEFAULT_CS)).toBeNull();
    expect(capReason(byId("29").founder!, base({ history: hist }), DEFAULT_CS)).toBeNull();
  });
  it("sends at most one optional email per run, most important first, never two the same day", () => {
    const keys = [byId("10").key, byId("09").key, byId("18").key]; const s = on(keys);
    const x = base({ firstPaidAt: NOW - 40 * D, firstFulfilledAt: NOW - 40 * D, paidAts: [NOW - 40 * D], lastPaidAt: NOW - 40 * D });
    const { due } = plan(list, x, s); expect(due.length).toBe(3);
    expect(choose(due, meta, x, s).pick?.key).toBe(byId("10").key); // lower priority number wins
    const today = base({ ...x, history: [{ key: "z", reference: "-", status: "sent", at: NOW - 3600 }] });
    expect(choose(due, meta, today, s).pick).toBeNull();
  });
  it("reactivation: at most two unanswered attempts, then CS-36 once; a purchase resets the count", () => {
    const r = (daysAgo: number) => ({ key: byId("31").key, reference: String(daysAgo), status: "sent" as const, at: NOW - daysAgo * D, reactivation: true });
    expect(reactivationUnanswered(base({ lastPaidAt: NOW - 300 * D, history: [r(100), r(60)] }))).toBe(2);
    expect(reactivationUnanswered(base({ lastPaidAt: NOW - 30 * D, history: [r(100), r(60)] }))).toBe(0);
    const s = on([byId("33").key, byId("36").key]); const x = base({ lastPaidAt: NOW - 300 * D, firstPaidAt: NOW - 400 * D, history: [r(100), r(60)] });
    expect(capReason(byId("33").founder!, x, s)).toContain("reactivation");
    const d36 = [{ key: byId("36").key, reference: "-", dueAt: NOW, priority: 20 }];
    expect(choose(d36, meta, x, s).pick?.key).toBe(byId("36").key);
    expect(choose(d36, meta, base({ lastPaidAt: NOW - 300 * D, history: [r(100)] }), s).pick).toBeNull();
  });
  it("event emails use their own reference so each article, case or code is sent once", () => {
    const k = byId("17").key; const s = on([k]);
    const x = base({ events: { [k]: [{ reference: "a", dueAt: NOW - D }, { reference: "b", dueAt: NOW - D }] }, history: [{ key: k, reference: "a", status: "sent", at: NOW - 40 * D }] });
    expect(plan(list, x, s).due.map((d) => d.reference)).toEqual(["b"]);
  });
  it("go-live needs approval at the current version, confirmed senders and a confirmed inbox", () => {
    const k = byId("01").key;
    expect(goLiveBlockers(DEFAULT_CS, {}, [])).toContain("No email is switched on.");
    const s = parseCs(JSON.stringify({ enabled: { [k]: true } }));
    expect(goLiveBlockers(s, { [k]: 0 }, [k]).length).toBe(3);
    const ok = parseCs(JSON.stringify({ enabled: { [k]: true }, approved: { [k]: 2 }, sendersConfirmed: { A: true, B: false, C: false }, replyInboxConfirmed: true }));
    expect(goLiveBlockers(ok, { [k]: 2 }, [k])).toEqual([]);
    expect(goLiveBlockers(ok, { [k]: 3 }, [k])).toHaveLength(1); // edited after approval
  });
  it("parseCs falls back to everything OFF on bad data", () => { expect(parseCs("not json").mode).toBe("off"); expect(parseCs(null).autoEnrollNew).toBe(false); });
});
