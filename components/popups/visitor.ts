import { emptyVisitor, type Visitor } from "@/lib/popups/types";

const KEY = "bl-visitor-v1";

/** Visitor state lives ONLY in this browser (localStorage). Nothing personal is stored: counts, flags, timestamps. */
export function loadVisitor(): Visitor {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyVisitor(), ...(JSON.parse(raw) as Partial<Visitor>) };
  } catch { /* blocked or damaged: start fresh */ }
  return emptyVisitor();
}
export function saveVisitor(v: Visitor): void {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* ignore */ }
}
/** Counts a visit once per browser session. */
export function startSession(v: Visitor): Visitor {
  try {
    if (!sessionStorage.getItem("bl-session")) { sessionStorage.setItem("bl-session", "1"); return { ...v, visits: v.visits + 1 }; }
  } catch { /* ignore */ }
  return v.visits === 0 ? { ...v, visits: 1 } : v;
}
/** Respect Global Privacy Control and Do Not Track: popups still work, but no counters are sent. */
export function trackingAllowed(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return !(n.globalPrivacyControl || n.doNotTrack === "1");
}
