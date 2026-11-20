// Which real products belong under each list-type group (rules over the product's own name, channel and place).
// Used by the group landing pages and the Lists menu so every menu category shows real products when they exist.
import type { ShopProduct } from "@/lib/shop";

const MGMT = /\b(ceo|cfo|cto|cmo|coo|ciso|cio|clo|chro|cxo|c-level|c-suite|chief|founders?|co-?founders?|owners?|presidents?|vp|vice president|directors?|head of|managers?|executives?|partners?)\b/i;
const FUNCTION = /\b(sales|marketing|hr|human resources|finance|financial|operations|it|information technology|engineering|procurement|purchasing|talent acquisition|recruit\w*|customer (success|service)|supply chain|legal|product|software|security|project|data|analytics?)\b/i;
const ROLE = /\b(vp|vice president|directors?|heads?|managers?|officers?|executives?|professionals|specialists?|analysts?|engineers?|leaders?|decision makers?|ceo|cfo|cto|cmo|coo|ciso|clo|founders?|owners?|presidents?)\b/i;
const HEALTH = /dentist|dental|physician|doctor|nurs|medical|health|clinic|hospital|pharmac|therap|surgeon|surgery|urolog|dermat|psycholog|psychiatr|veterinar|chiropract|acupunct|optom|ophthalm|cardiolog|gynec|obstetric|pediatr|oncolog|radiolog|endocrin|orthop|neurolog|midwi|caregiver|nursing|medspa|med spa|wellness/i;

const text = (p: ShopProduct) => `${p.name} ${p.categoryName}`;
const RULES: Record<string, (p: ShopProduct) => boolean> = {
  "business-email-lists": (p) => !["consumer-email", "phone"].includes(p.channel ?? "") && !/whatsapp/i.test(p.name),
  "consumer-email-lists": (p) => p.channel === "consumer-email",
  "phone-number-lists": (p) => p.channel === "phone" && !/whatsapp/i.test(p.name),
  "whatsapp-number-lists": (p) => /whatsapp/i.test(p.name),
  "job-title-lists": (p) => ROLE.test(p.name) && !/whatsapp/i.test(p.name),
  "management-levels": (p) => MGMT.test(p.name),
  "job-function-lists": (p) => FUNCTION.test(p.name) && ROLE.test(p.name),
  "healthcare-lists": (p) => HEALTH.test(text(p)),
  "geographic-databases": (p) => !!p.region || p.scope === "city",
};

/** The products a group's rule selects, or null when the group has no rule. */
export function poolFor(groupSlug: string, products: readonly ShopProduct[]): ShopProduct[] | null {
  const rule = RULES[groupSlug];
  return rule ? products.filter(rule) : null;
}
