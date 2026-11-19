"use client";
import { useSyncExternalStore } from "react";
import { MAX_CART_ITEMS, normalizeItems, type CartItem } from "./model";

const KEY = "bl-cart-v1";
const EVT = "bl-cart-change";
const EMPTY: CartItem[] = [];
let cache: { raw: string | null; items: CartItem[] } = { raw: null, items: EMPTY };

/** The cart lives only in this browser (localStorage: product + package, nothing personal). Falls back to memory when storage is blocked. */
let memory: CartItem[] | null = null;

function read(): CartItem[] {
  if (memory) return memory;
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch { return cache.items; }
  if (raw === cache.raw) return cache.items;
  let items = EMPTY;
  try { items = raw ? normalizeItems(JSON.parse(raw)) : EMPTY; } catch { items = EMPTY; }
  cache = { raw, items: items.length ? items : EMPTY };
  return cache.items;
}

function write(items: CartItem[]) {
  const next = normalizeItems(items);
  try {
    const raw = next.length ? JSON.stringify(next) : null;
    if (raw) localStorage.setItem(KEY, raw); else localStorage.removeItem(KEY);
    memory = null;
    cache = { raw, items: next.length ? next : EMPTY };
  } catch { memory = next.length ? next : EMPTY; }
  window.dispatchEvent(new Event(EVT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb); // another tab changed the cart
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener("storage", cb); };
}

export const cartActions = {
  /** One line per product: adding a product that is already in the cart changes its package instead of duplicating it. Returns "added" | "updated" | "full". */
  add(slug: string, pkg: string): "added" | "updated" | "full" {
    const cur = read();
    const had = cur.some((i) => i.slug === slug);
    if (!had && cur.length >= MAX_CART_ITEMS) return "full";
    write(had ? cur.map((i) => (i.slug === slug ? { slug, pkg } : i)) : [...cur, { slug, pkg }]);
    return had ? "updated" : "added";
  },
  remove(slug: string) { write(read().filter((i) => i.slug !== slug)); },
  setPackage(slug: string, pkg: string) { write(read().map((i) => (i.slug === slug ? { ...i, pkg } : i))); },
  replaceAll(items: CartItem[]) { write(items); },
  clear() { write([]); },
};

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
export const useCartCount = () => useCart().length;

/** false on the server and during hydration, true afterwards (so the cart is only drawn once the browser's own cart is known). */
export const useMounted = () => useSyncExternalStore(() => () => undefined, () => true, () => false);
