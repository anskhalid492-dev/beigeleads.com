// Exit-intent rescue (CLAUDE.md section 122). Pure rules; the browser hook feeds it signals. It SHARES the proactive state of
// lib/beigepilot/proactive/schedule.ts: it is one of the three unsolicited messages of a session, never an extra one.
import type { SState } from "@/lib/beigepilot/proactive/schedule";
import { t, type Lang } from "./lang";

export type ExitVariant = "product" | "cart" | "catalog" | "general";
export const MIN_ACTIVE_BEFORE_EXIT_MS = 8000; // never on arrival

export function exitVariant(path: string): ExitVariant {
  if (/^\/lists\/[^/?#]+\/?$/.test(path)) return "product"; // a product (or category) page
  if (path.startsWith("/cart")) return "cart";
  if (path === "/lists" || path.startsWith("/lists?")) return "catalog";
  return "general";
}
/** Where exit intent must never appear. */
export const exitBlockedPath = (path: string) => path.startsWith("/checkout") || path.startsWith("/admin") || path.startsWith("/purchase-request") || path.startsWith("/download");

export type ExitGate = { chatOpen: boolean; bubbleVisible: boolean; path: string; enabled: boolean; formFocused?: boolean };
/** May the exit message appear now? Max one per session, counts toward the 3-message cap, not after a dismissal/click/chat, not on arrival. */
export function exitDue(s: SState, g: ExitGate): boolean {
  if (!g.enabled || s.stop || s.exit || s.stage >= 3) return false;
  if (g.chatOpen || g.bubbleVisible || g.formFocused || exitBlockedPath(g.path)) return false;
  return s.activeMs >= MIN_ACTIVE_BEFORE_EXIT_MS;
}

/** Desktop: the pointer left through the top edge while moving up. `prevY` = a recent pointer Y (px), `y` = where it left. */
export const leftThroughTop = (prevY: number, y: number, relatedTarget: unknown) => !relatedTarget && y <= 8 && prevY > y && prevY <= 160;
/** Touch devices have no cursor to read, so there is no fake "exit" signal. Only a deliberate pattern counts: the visitor scrolled well
 *  down the page and then flicked quickly back to the top. */
export function flickedToTop(samples: { y: number; at: number }[], pageHeight: number, viewport: number): boolean {
  if (samples.length < 2 || pageHeight < viewport * 2) return false;
  const last = samples[samples.length - 1];
  const peak = Math.max(...samples.map((x) => x.y));
  const first = samples.find((x) => x.y === peak) ?? samples[0];
  return peak >= (pageHeight - viewport) * 0.5 && last.y <= viewport * 0.5 && peak - last.y >= 600 && last.at - first.at <= 900;
}

const GENERAL_OPEN: Record<Lang, string> = { en: "Happy to help! What are you looking for?", es: "¡Encantado de ayudar! ¿Qué estás buscando?", fr: "Avec plaisir ! Que recherchez-vous ?", de: "Gern! Wonach suchst du?", it: "Volentieri! Cosa stai cercando?", pt: "Com prazer! O que você procura?", ar: "يسعدني مساعدتك! ماذا تبحث عن؟", ur: "خوشی سے! آپ کیا تلاش کر رہے ہیں؟" };
const OPEN_EN: Record<ExitVariant, string> = { product: "Happy to help with this list. What would you like to know, or shall I compare packages?", cart: "Happy to look at your cart with you. What would you like to check?", catalog: "Happy to help you find the right database. Who do you want to reach?", general: GENERAL_OPEN.en };
const TEXT_EN: Record<ExitVariant, string> = {
  general: t("en", "exitText"),
  product: "👀 Still deciding on this list? Before you go, I can compare packages, explain what's included, or answer any questions about your order. Want a hand? 🎯",
  cart: "👀 Still deciding? Before you go, I can double-check your cart, compare packages, or answer any questions about your order. Want a hand? 🎯",
  catalog: "👀 Still deciding? Before you go, I can help you find the right database, compare packages, or answer any questions about your order. Want a hand? 🎯",
};
export function exitCopy(lang: Lang, v: ExitVariant): { text: string; cta: string; secondary: string; opening: string } {
  return { text: lang === "en" ? TEXT_EN[v] : t(lang, "exitText"), cta: t(lang, "helpMe"), secondary: t(lang, "noThanks"), opening: lang === "en" ? OPEN_EN[v] : GENERAL_OPEN[lang] };
}
