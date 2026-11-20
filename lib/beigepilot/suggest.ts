// Context-aware quick questions for the BeigePilot widget. Pure, so it is tested. Every question is sent as a normal chat message.
export type Welcome = { id: string; label: string; ask: string };

/** The four welcome cards. `ask` is the real message that starts the conversation. */
export const WELCOME_CARDS: Welcome[] = [
  { id: "prospects", label: "Find my ideal prospects", ask: "Help me find my ideal prospects. I will tell you who I want to reach." },
  { id: "explore", label: "Explore available databases", ask: "What databases are available?" },
  { id: "packages", label: "Compare packages", ask: "Compare the available packages for me." },
  { id: "quality", label: "Ask about data quality", ask: "How do you verify your data, and what is your replacement policy?" },
];

const HOME = ["Find my ideal database", "Explore countries", "Browse industries", "How does BeigeLeads work?"];
const PRODUCT = ["What fields are included?", "Compare available packages", "When was this verified?", "Can I preview a sample?"];
const CART = ["How will I receive my data?", "Is this a one-time payment?", "Can I change my package?"];
const AFTER_CARDS = ["Compare packages", "Can I preview a sample?", "How will I receive my data?"];
const AFTER_TEXT = ["Find my ideal database", "How do you verify your data?", "How does delivery work?"];

/** A single `/lists/<x>` page is a database or category page; the cart and home have their own sets. */
export function suggestionsFor(path: string, admin: string[] = []): string[] {
  if (path.startsWith("/cart")) return CART;
  if (/^\/lists\/[^/]+\/?$/.test(path)) return PRODUCT;
  return admin.length ? admin.slice(0, 4) : HOME;
}

/** Follow-up chips shown under the latest answer. */
export const followUps = (hadCards: boolean, asked: string[]): string[] =>
  (hadCards ? AFTER_CARDS : AFTER_TEXT).filter((q) => !asked.includes(q)).slice(0, 3);
