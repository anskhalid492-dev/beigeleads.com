// The welcome suggestions. Pure, so it is tested. `ask` starts a real conversation; `focus` puts the cursor in the message box;
// `action` runs a real action without the AI (opens the cart, or the support form).
export type Chip = { id: string; label: string; ask?: string; focus?: boolean; action?: "cart" | "support" };
export type SalesFlags = { finder: boolean; cart: boolean; budget: boolean; handoff: boolean };
const ALL_ON: SalesFlags = { finder: true, cart: true, budget: true, handoff: true };

export const DEFAULT_CHIPS: Chip[] = [
  { id: "find", label: "Find a Database", ask: "Help me find a database." },
  { id: "budget", label: "Shop by Budget", ask: "I want to shop by budget." },
  { id: "cart", label: "View My Cart", action: "cart" },
  { id: "support", label: "Contact Support", action: "support" },
];

/** Admin-written suggestions replace the defaults; each one is sent as a normal message. Default chips follow the Sales Assistant switches. */
export function chipsFor(admin: string[] = [], flags: SalesFlags = ALL_ON): Chip[] {
  if (admin.length) return admin.slice(0, 3).map((q, i) => ({ id: `a${i}`, label: q, ask: q }));
  const out = DEFAULT_CHIPS.filter((c) => (c.id === "find" ? flags.finder : c.id === "budget" ? flags.budget : c.id === "support" ? flags.handoff : true));
  return out.length ? out : [{ id: "ask", label: "Ask anything", focus: true }];
}

/** A thank-you or a laugh from the visitor makes Pilo giggle (a real reaction to a real message). */
export const isCheer = (t: string): boolean => /\b(thanks?|thank you|thx|haha+|hehe+|lol|lmao)\b|😂|🤣|😄|😊/i.test(t);
