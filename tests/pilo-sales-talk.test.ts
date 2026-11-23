import { describe, expect, it } from "vitest";
import { buildSystem } from "@/lib/beigepilot/chat";
import { classify, isSpecificPrice, plainEnough, qualifyingTurns, questionCount, turnHint, wordCount } from "@/lib/beigepilot/v2/sales-talk";
import { remember, describe as describeMemory, parseMemory } from "@/lib/beigepilot/v2/memory";

const base = { humor: "friendly", name: "Pilo" } as never;
const sys = buildSystem(base, "/");
const h = (...t: string[]) => t.map((text, i) => ({ role: (i % 2 ? "assistant" : "user") as "user" | "assistant", text }));

describe("Pilo sales talk", () => {
  it("vague pricing asks about the goal, no number", () => {
    expect(classify("What's your rate?")).toBe("price-vague");
    expect(turnHint("What's your rate?", h("What's your rate?"))).toMatch(/What made you reach out today/);
    expect(turnHint("What's your rate?", h("What's your rate?"))).toMatch(/Do NOT quote/);
  });
  it("specific pricing answers at once with real price", () => {
    expect(isSpecificPrice("How much is the dentists list in the USA?")).toBe(true);
    expect(classify("How much is the Germany email database?")).toBe("price-specific");
    expect(turnHint("price of dentists list", h("price of dentists list"))).toMatch(/real published price at once/);
  });
  it("repeated pricing gives prices, not another redirect", () => {
    const hist = h("what's your pricing?", "It depends on your goal. What made you reach out?", "pricing?");
    expect(classify("pricing?", ["what's your pricing?"])).toBe("price-repeat");
    expect(turnHint("pricing?", hist)).toMatch(/Do NOT redirect again/);
  });
  it("limits questions", () => {
    expect(sys).toMatch(/Maximum ONE question per reply/);
    expect(sys).toMatch(/at most two qualifying turns/);
    expect(questionCount("Which country? Which city?")).toBe(2);
    const hist = h("dentists", "Which country?", "usa", "Whole country or a city?", "whole");
    expect(qualifyingTurns(hist)).toBe(2);
    expect(turnHint("whole", hist)).toMatch(/do not ask another/);
    expect(sys).toMatch(/USA dentists/);
  });
  it("asks for simple english and short replies", () => {
    expect(sys).toMatch(/very simple English/);
    expect(sys).toMatch(/10 to 30 words/);
    expect(plainEnough("We can help you find dentists.")).toBe(true);
    expect(plainEnough("We utilize a comprehensive methodology.")).toBe(false);
    expect(wordCount("Here are real dentist lists. Pick one.")).toBe(7);
  });
  it("has natural humor with limits", () => {
    expect(sys).toMatch(/Dentists\. Brave people/);
    expect(sys).toMatch(/NEVER joke or use emojis on complaints, refunds, payments, privacy/);
    expect(sys).toMatch(/HUMOR LIMITS/);
  });
  it("handles objections honestly", () => {
    expect(classify("it's too expensive")).toBe("objection-expensive");
    expect(turnHint("too expensive", h("too expensive"))).toMatch(/smaller real/);
    expect(classify("can I get a discount?")).toBe("objection-discount");
    expect(turnHint("any discount?", h("any discount?"))).toMatch(/only if requestDiscount|Never say you will check unless/);
    expect(classify("can I see a sample first")).toBe("objection-sample");
    expect(classify("I'll think about it")).toBe("objection-think");
    expect(classify("is this legit? how do you verify")).toBe("objection-trust");
  });
  it("recommends real products only", () => {
    expect(sys).toMatch(/Never hide, invent or round a price/);
    expect(sys).toMatch(/GROUNDING RULES/);
  });
  it("closes on checkout intent without claiming an add", () => {
    expect(classify("ok I want to buy the starter")).toBe("buying");
    expect(turnHint("let's do it, checkout", h("let's do it, checkout"))).toMatch(/Never say anything was added or paid/);
  });
  it("support questions get facts, no selling", () => {
    expect(classify("I paid but didn't get my download link")).toBe("support");
    expect(turnHint("refund please", h("refund please"))).toMatch(/Do not sell/);
  });
  it("frustrated customers get calm help", () => {
    expect(classify("this is useless!!")).toBe("frustrated");
    expect(turnHint("this is useless!!", h("this is useless!!"))).toMatch(/No jokes, no emojis, no selling/);
  });
  it("answers info questions with facts first", () => {
    expect(classify("what fields are included?")).toBe("info");
    expect(sys).toMatch(/ANSWER FIRST/);
  });
  it("remembers conversation context", () => {
    const m = remember(remember(parseMemory(undefined), "I need dentists"), "in Germany");
    const text = JSON.stringify(describeMemory(m)).toLowerCase();
    expect(text).toContain("german");
    expect(sys).toMatch(/Never ask again for something the visitor already told you/);
  });
});
