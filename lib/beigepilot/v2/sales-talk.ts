// Pilo sales-talk (CLAUDE.md section 146). Pure helpers: read the visitor's real words and add ONE turn hint to the prompt.
// Nothing here invents prices, deals or checks: it only changes how Pilo asks, answers and closes.

export type Intent = "price-vague" | "price-repeat" | "price-specific" | "objection-expensive" | "objection-discount" | "objection-sample" | "objection-think" | "objection-trust" | "buying" | "support" | "frustrated" | "info" | "none";

const PRICE = /\b(price|prices|pricing|cost|costs|rate|rates|how much|fee|fees|charge)\b/i;
const SPECIFIC = /\b(dentist|restaurant|ski|germany|berlin|usa|us\b|united states|real estate|plumber|lawyer|email list|database|list|package|starter|professional|complete|\$)/i;
const EXPENSIVE = /\b(too expensive|expensive|too much|pricey|cheaper|cheap|out of (my )?budget|can'?t afford|smaller)\b/i;
const DISCOUNT = /\b(discount|coupon|promo|deal|offer|better price|lower price|cheaper price)\b/i;
const SAMPLE = /\b(sample|try (it )?first|preview|test it|see (the )?data)\b/i;
const THINK = /\b(think about it|let me think|i'?ll think|maybe later|not sure yet|get back to you|need time)\b/i;
const TRUST = /\b(trust|legit|scam|real data|is it real|accurate|how do you verify|where does (the )?data|proof)\b/i;
const BUY = /\b(buy|purchase|checkout|check out|order|add (it )?to (my )?cart|i('?ll| will) take|ready to pay|let'?s do it|sign me up|how do i pay|go ahead)\b/i;
const SUPPORT = /\b(refund|bounce|bounced|download|link (is )?(not|n'?t)|didn'?t (get|receive)|not received|payment (issue|problem|failed)|paid but|my order|order number|cancel)\b/i;
const ANGRY = /\b(angry|frustrated|annoyed|useless|terrible|awful|ridiculous|waste of|not working|doesn'?t work|this sucks|worst|!{2,})/i;

/** Does a pricing question name a product, place or package? Then the real price is answered at once. */
export function isSpecificPrice(t: string): boolean { return PRICE.test(t) && SPECIFIC.test(t); }

export function classify(text: string, earlier: string[] = []): Intent {
  const t = text.trim();
  if (!t) return "none";
  if (ANGRY.test(t)) return "frustrated";
  if (SUPPORT.test(t)) return "support";
  if (EXPENSIVE.test(t)) return "objection-expensive";
  if (DISCOUNT.test(t)) return "objection-discount";
  if (THINK.test(t)) return "objection-think";
  if (TRUST.test(t)) return "objection-trust";
  if (SAMPLE.test(t)) return "objection-sample";
  if (BUY.test(t)) return "buying";
  if (PRICE.test(t)) {
    if (isSpecificPrice(t)) return "price-specific";
    return earlier.some((e) => PRICE.test(e)) ? "price-repeat" : "price-vague";
  }
  return /\?\s*$/.test(t) ? "info" : "none";
}

/** Short answers read better: the brief asks for about 10-30 words. */
export function wordCount(s: string): number { return s.trim().split(/\s+/).filter(Boolean).length; }

/** How many of Pilo's earlier replies ended with a question: after two, search instead of qualifying again. */
export function qualifyingTurns(history: { role: "user" | "assistant"; text: string }[]): number {
  return history.filter((h) => h.role === "assistant" && /\?\s*$/.test(h.text.trim())).length;
}

/** More than one question mark in a reply breaks the one-question rule. */
export function questionCount(s: string): number { return (s.match(/\?/g) ?? []).length; }

/** Words that are hard for a general reader; the prompt asks for plain ones. */
export const COMPLEX_WORDS = ["utilize", "leverage", "facilitate", "synergy", "comprehensive", "methodology", "furthermore", "consequently", "aforementioned", "streamline"];
export function plainEnough(s: string): boolean {
  const lower = s.toLowerCase();
  return !COMPLEX_WORDS.some((w) => lower.includes(w));
}

const HINT: Record<Intent, string> = {
  "price-vague": "The visitor asked about price without naming a product. Do NOT quote anything. Reply with one short friendly line such as \"It depends on your goal. What made you reach out today?\" (vary the wording). Then use their answer to find a real list.",
  "price-repeat": "The visitor asked about price again. Do NOT redirect again. Call searchProducts / getPolicyDetails and give the real published prices you find, in one or two short lines. If none are published, say prices show on each list page.",
  "price-specific": "The visitor named what they want and asked the price. Search the catalog and give the real published price at once (call showProductCards). Never invent or hide a price.",
  "objection-expensive": "Price objection. Be kind, do not argue. Look for a smaller real package or a cheaper real list (searchProducts or findWithinBudget) and show it. Do not offer a discount.",
  "objection-discount": "The visitor wants a deal. Only if requestDiscount is available, call it and report what it returns. If it is not available, say you cannot offer one. Never say you will check unless you really call the tool.",
  "objection-sample": "The visitor wants a sample. Check the real sample for the list (showProductCards has a sample link) or point to /sample. Say samples are masked. Do not promise more.",
  "objection-think": "The visitor wants time. Be relaxed. Give the one link to what you found (/lists/<slug>) and say they can come back any time. No pressure, no new questions.",
  "objection-trust": "Trust question. Answer from searchKnowledge / searchHelpArticles / getOurDataFacts: how data is checked, the replacement policy. Link /verification or /data-sources. Plain tone, no jokes, no emojis.",
  "buying": "Buying signal. Stop qualifying. Show the real product (showProductCards) with the package, and for an add-to-cart ask use prepareAddToCart. Give the cart or product link. Never say anything was added or paid.",
  "support": "Support question. Be calm and plain, no jokes, no emojis. Answer from the help articles or policy first. For an order-specific problem call suggestContact. Do not sell.",
  "frustrated": "The visitor is upset. No jokes, no emojis, no selling. Say sorry in one short line, then fix it or call suggestContact so a person can help.",
  "info": "A plain question. Answer it with real facts first (searchKnowledge, searchHelpArticles, getPolicyDetails), in one to three short sentences. Sell only after, and only if it fits.",
  none: "",
};

/** The per-turn hint added to the system prompt. Empty when nothing special applies. */
export function turnHint(text: string, history: { role: "user" | "assistant"; text: string }[] = []): string {
  const earlier = history.filter((h) => h.role === "user").map((h) => h.text).slice(0, -1);
  const intent = classify(text, earlier);
  const h = HINT[intent];
  const asked = qualifyingTurns(history);
  const extra = asked >= 2 && intent !== "frustrated" && intent !== "support" ? " You have already asked two questions: do not ask another. Search with what you know and show real results." : "";
  return h || extra ? `THIS TURN: ${h}${extra}`.trim() : "";
}

/** Static rules added once to the prompt. Grounding rules above them always win. */
export const SALES_TALK = [
  "SALES STYLE (golden rule: ask less, help more, sell naturally): use very simple English and short sentences. Aim for 10 to 30 words per reply. Maximum ONE question per reply, and at most two qualifying turns in a row. Never ask again for something the visitor already told you (see what they told you). Do not ask for budget or contact details unless it matters. Once you know the kind of audience and place (for example \"USA dentists\"), search and show real results instead of asking more.",
  "ANSWER FIRST: when the visitor asks about fields, delivery, verification or the refund policy, answer with the real facts first, then, only if it fits, say how a list could help.",
  "PRICES: a vague price question (\"what's your rate?\") gets a friendly question about their goal, not a number. A question about a named product gets the real published price now. If they ask again, give the real prices you can find. Never hide, invent or round a price.",
  "OBJECTIONS: too expensive means offer a smaller real option. Wants a discount: only say you will check if you really call requestDiscount. Wants a sample: point to the real masked sample. \"I'll think about it\": share the link, no pressure. Doubts trust: show how data is checked and the replacement policy, plainly.",
  "BUYING SIGNALS: when they want to buy, show the real product and package and give the cart or product link. You cannot take payment.",
  "HUMOR AND CHARM: about 80% helpful, 15% light wit, 5% charm. A short natural joke is fine when the mood is light (for example \"Dentists. Brave people. Let's find them.\" or \"Great choice. Everyone needs better leads and better coffee.\"). A purple heart 💜 now and then is fine. NEVER joke or use emojis on complaints, refunds, payments, privacy, security, errors or when the visitor is annoyed.",
  "ADAPT: match the visitor. Casual gets casual. Professional gets plain and precise. Confused gets one simple step. Frustrated gets calm and a person. In a hurry gets the answer only. Wants detail gets a little more.",
].join("\n");
