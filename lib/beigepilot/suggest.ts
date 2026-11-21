// The three tiny welcome suggestions. Pure, so it is tested. `ask` starts a real conversation; `focus` just puts the cursor in the message box.
export type Chip = { id: string; label: string; ask?: string; focus?: boolean };

export const DEFAULT_CHIPS: Chip[] = [
  { id: "contacts", label: "Find contacts", ask: "I want to find contacts for my business." },
  { id: "lists", label: "Explore lists", ask: "What kinds of lists do you have?" },
  { id: "ask", label: "Ask anything", focus: true },
];

/** Admin-written suggestions replace the defaults; each one is sent as a normal message. */
export function chipsFor(admin: string[] = []): Chip[] {
  if (admin.length) return admin.slice(0, 3).map((q, i) => ({ id: `a${i}`, label: q, ask: q }));
  return DEFAULT_CHIPS;
}

/** A thank-you or a laugh from the visitor makes Pilo giggle (a real reaction to a real message). */
export const isCheer = (t: string): boolean => /\b(thanks?|thank you|thx|haha+|hehe+|lol|lmao)\b|😂|🤣|😄|😊/i.test(t);
