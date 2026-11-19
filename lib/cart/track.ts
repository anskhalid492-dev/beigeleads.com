"use client";
export type CartEvent = "add_to_cart" | "remove_from_cart" | "view_cart" | "begin_checkout";

/**
 * Anonymous funnel counters (event name + number of items, nothing else). Skipped entirely when the browser sends
 * Global Privacy Control or Do Not Track.
 */
export function trackCart(event: CartEvent, items: number): void {
  try {
    const n = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (n.globalPrivacyControl || n.doNotTrack === "1") return;
    void fetch("/api/cart/event", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event, items }), keepalive: true }).catch(() => undefined);
  } catch { /* analytics must never break the cart */ }
}

/** view_cart is counted once per browser session. */
export function trackCartViewOnce(items: number): void {
  try {
    if (sessionStorage.getItem("bl-cart-viewed")) return;
    sessionStorage.setItem("bl-cart-viewed", "1");
  } catch { /* count anyway */ }
  trackCart("view_cart", items);
}
