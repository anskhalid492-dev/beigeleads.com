export const EVENTS = ["impression", "click", "dismiss", "chat_open", "conversation_start", "product_rec", "add_to_cart", "purchase"] as const;
export type ProEvent = (typeof EVENTS)[number];
