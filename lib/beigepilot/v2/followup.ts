// Smart follow-up questions + quick replies (CLAUDE.md section 122). Pure. ONE relevant question at a time, from the slots still missing.
// It never forces a questionnaire: with enough information the assistant searches the real catalog instead of asking.
import type { Memory, Slot } from "./memory";
import type { Lang } from "./lang";

export type Quick = { label: string; text: string };

/** Which slot to ask about next; null = enough to search the catalog. Industry + country are enough; budget or quantity refine. */
export function nextSlot(m: Memory, opts: { hasCards?: boolean } = {}): Slot | null {
  if (!m.industry && m.picked.length === 0) return "industry";
  if (!m.country && m.picked.length === 0) return "country";
  if (opts.hasCards && !m.quantity && !m.budgetCents && m.picked.length === 0) return "budget";
  if (opts.hasCards && m.picked.length > 0) return "package";
  return null;
}

const Q: Record<Slot, string> = {
  industry: "Which industry or type of business do you want to reach?",
  country: "Which country should the contacts be in?",
  quantity: "Roughly how many contacts do you need?",
  budget: "Do you have a budget in mind?",
  package: "Which package would you like to look at?",
};
/** The question the assistant should ask next (injected into the system prompt; the model words it in the visitor's language). */
export const questionFor = (s: Slot | null) => (s ? Q[s] : "");

const REPLIES: Record<Lang, { country: Quick[]; industry: Quick[]; budget: Quick[]; package: Quick[] }> = {
  en: { country: [{ label: "USA", text: "USA" }, { label: "UK", text: "United Kingdom" }, { label: "Germany", text: "Germany" }], industry: [{ label: "Healthcare", text: "Healthcare" }, { label: "Real Estate", text: "Real estate" }, { label: "Dentists", text: "Dentists" }], budget: [{ label: "Under $100", text: "My budget is under $100" }, { label: "Under $300", text: "My budget is under $300" }], package: [{ label: "Show Packages", text: "Show me the packages" }, { label: "Add to Cart", text: "Add it to my cart" }] },
  es: { country: [{ label: "EE. UU.", text: "USA" }, { label: "Reino Unido", text: "United Kingdom" }, { label: "Alemania", text: "Germany" }], industry: [{ label: "Salud", text: "Salud" }, { label: "Inmobiliaria", text: "Inmobiliaria" }, { label: "Dentistas", text: "Dentistas" }], budget: [{ label: "Menos de $100", text: "Mi presupuesto es menos de $100" }, { label: "Menos de $300", text: "Mi presupuesto es menos de $300" }], package: [{ label: "Ver paquetes", text: "Muéstrame los paquetes" }, { label: "Añadir al carrito", text: "Añádelo a mi carrito" }] },
  fr: { country: [{ label: "États-Unis", text: "USA" }, { label: "Royaume-Uni", text: "United Kingdom" }, { label: "Allemagne", text: "Germany" }], industry: [{ label: "Santé", text: "Santé" }, { label: "Immobilier", text: "Immobilier" }, { label: "Dentistes", text: "Dentistes" }], budget: [{ label: "Moins de 100 $", text: "Mon budget est de moins de $100" }, { label: "Moins de 300 $", text: "Mon budget est de moins de $300" }], package: [{ label: "Voir les forfaits", text: "Montrez-moi les forfaits" }, { label: "Ajouter au panier", text: "Ajoutez-le à mon panier" }] },
  de: { country: [{ label: "USA", text: "USA" }, { label: "UK", text: "United Kingdom" }, { label: "Deutschland", text: "Germany" }], industry: [{ label: "Gesundheit", text: "Gesundheit" }, { label: "Immobilien", text: "Immobilien" }, { label: "Zahnärzte", text: "Zahnärzte" }], budget: [{ label: "Unter $100", text: "Mein Budget liegt unter $100" }, { label: "Unter $300", text: "Mein Budget liegt unter $300" }], package: [{ label: "Pakete anzeigen", text: "Zeig mir die Pakete" }, { label: "In den Warenkorb", text: "Lege es in meinen Warenkorb" }] },
  it: { country: [{ label: "USA", text: "USA" }, { label: "Regno Unito", text: "United Kingdom" }, { label: "Germania", text: "Germany" }], industry: [{ label: "Sanità", text: "Sanità" }, { label: "Immobiliare", text: "Immobiliare" }, { label: "Dentisti", text: "Dentisti" }], budget: [{ label: "Meno di $100", text: "Il mio budget è meno di $100" }, { label: "Meno di $300", text: "Il mio budget è meno di $300" }], package: [{ label: "Mostra i pacchetti", text: "Mostrami i pacchetti" }, { label: "Aggiungi al carrello", text: "Aggiungilo al mio carrello" }] },
  pt: { country: [{ label: "EUA", text: "USA" }, { label: "Reino Unido", text: "United Kingdom" }, { label: "Alemanha", text: "Germany" }], industry: [{ label: "Saúde", text: "Saúde" }, { label: "Imobiliário", text: "Imobiliário" }, { label: "Dentistas", text: "Dentistas" }], budget: [{ label: "Menos de $100", text: "Meu orçamento é menos de $100" }, { label: "Menos de $300", text: "Meu orçamento é menos de $300" }], package: [{ label: "Ver pacotes", text: "Mostre os pacotes" }, { label: "Adicionar ao carrinho", text: "Adicione ao meu carrinho" }] },
  ar: { country: [{ label: "أمريكا", text: "USA" }, { label: "بريطانيا", text: "United Kingdom" }, { label: "ألمانيا", text: "Germany" }], industry: [{ label: "الرعاية الصحية", text: "الرعاية الصحية" }, { label: "العقارات", text: "العقارات" }, { label: "أطباء الأسنان", text: "أطباء الأسنان" }], budget: [{ label: "أقل من $100", text: "ميزانيتي أقل من $100" }, { label: "أقل من $300", text: "ميزانيتي أقل من $300" }], package: [{ label: "عرض الباقات", text: "اعرض لي الباقات" }, { label: "أضف إلى السلة", text: "أضفها إلى سلتي" }] },
  ur: { country: [{ label: "امریکہ", text: "USA" }, { label: "برطانیہ", text: "United Kingdom" }, { label: "جرمنی", text: "Germany" }], industry: [{ label: "ہیلتھ کیئر", text: "ہیلتھ کیئر" }, { label: "ریئل اسٹیٹ", text: "ریئل اسٹیٹ" }, { label: "ڈینٹسٹ", text: "ڈینٹسٹ" }], budget: [{ label: "$100 سے کم", text: "میرا بجٹ $100 سے کم ہے" }, { label: "$300 سے کم", text: "میرا بجٹ $300 سے کم ہے" }], package: [{ label: "پیکجز دکھائیں", text: "مجھے پیکجز دکھائیں" }, { label: "کارٹ میں شامل کریں", text: "اسے میرے کارٹ میں ڈالیں" }] },
};
/** Reply buttons for the slot just asked, shown ONLY when relevant (never after a plain answer, never while the slot is already known). */
export function quickReplies(slot: Slot | null, lang: Lang): Quick[] {
  if (!slot || slot === "quantity") return [];
  const r = REPLIES[lang] ?? REPLIES.en;
  return slot === "country" ? r.country : slot === "industry" ? r.industry : slot === "budget" ? r.budget : r.package;
}
