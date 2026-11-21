"use client";
import { useSyncExternalStore } from "react";
import { MAX_CART_ITEMS, normalizeBundleSlugs, normalizeItems, type CartItem } from "./model";

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

// Curated bundles live in their own key (slugs only). Same rules: nothing personal, memory fallback, synced across tabs.
const BKEY = "bl-cart-bundles-v1";
const NO_BUNDLES: string[] = [];
let bcache: { raw: string | null; items: string[] } = { raw: null, items: NO_BUNDLES };
let bmemory: string[] | null = null;
function readBundles(): string[] {
  if (bmemory) return bmemory;
  let raw: string | null = null;
  try { raw = localStorage.getItem(BKEY); } catch { return bcache.items; }
  if (raw === bcache.raw) return bcache.items;
  let items = NO_BUNDLES;
  try { items = raw ? normalizeBundleSlugs(JSON.parse(raw)) : NO_BUNDLES; } catch { items = NO_BUNDLES; }
  bcache = { raw, items: items.length ? items : NO_BUNDLES };
  return bcache.items;
}
function writeBundles(slugs: string[]) {
  const next = normalizeBundleSlugs(slugs);
  try {
    const raw = next.length ? JSON.stringify(next) : null;
    if (raw) localStorage.setItem(BKEY, raw); else localStorage.removeItem(BKEY);
    bmemory = null;
    bcache = { raw, items: next.length ? next : NO_BUNDLES };
  } catch { bmemory = next.length ? next : NO_BUNDLES; }
  window.dispatchEvent(new Event(EVT));
}

// Email Verification service: at most one package name (nothing personal). The server validates it against its own settings.
const VKEY = "bl-cart-verification-v1";
let vcache: { raw: string | null; pkg: string | null } = { raw: null, pkg: null };
let vmemory: { pkg: string | null } | null = null;
function readVerification(): string | null {
  if (vmemory) return vmemory.pkg;
  let raw: string | null = null;
  try { raw = localStorage.getItem(VKEY); } catch { return vcache.pkg; }
  if (raw === vcache.raw) return vcache.pkg;
  const pkg = raw && raw.length <= 40 ? raw : null;
  vcache = { raw, pkg };
  return pkg;
}
function writeVerification(pkg: string | null) {
  const next = pkg && pkg.trim().length <= 40 ? pkg.trim() : null;
  try {
    if (next) localStorage.setItem(VKEY, next); else localStorage.removeItem(VKEY);
    vmemory = null;
    vcache = { raw: next, pkg: next };
  } catch { vmemory = { pkg: next }; }
  window.dispatchEvent(new Event(EVT));
}

// DFY Outbound: one package NAME + the ownership choice (nothing personal). The server validates both against its own settings.
const DKEY = "bl-cart-dfy-v1";
export type CartDfy = { pkg: string; own: boolean };
const NO_DFY: CartDfy | null = null;
let dcache: { raw: string | null; v: CartDfy | null } = { raw: null, v: NO_DFY };
let dmemory: { v: CartDfy | null } | null = null;
function readDfy(): CartDfy | null {
  if (dmemory) return dmemory.v;
  let raw: string | null = null;
  try { raw = localStorage.getItem(DKEY); } catch { return dcache.v; }
  if (raw === dcache.raw) return dcache.v;
  let v: CartDfy | null = null;
  try { const j = raw ? (JSON.parse(raw) as Partial<CartDfy>) : null; if (j && typeof j.pkg === "string" && j.pkg.length > 0 && j.pkg.length <= 40) v = { pkg: j.pkg, own: j.own === true }; } catch { /* ignore */ }
  dcache = { raw, v };
  return v;
}
function writeDfy(v: CartDfy | null) {
  try {
    if (v) { const raw = JSON.stringify(v); localStorage.setItem(DKEY, raw); dcache = { raw, v }; } else { localStorage.removeItem(DKEY); dcache = { raw: null, v: null }; }
    dmemory = null;
  } catch { dmemory = { v }; }
  window.dispatchEvent(new Event(EVT));
}

export const cartActions = {
  /** Add, change or (null) remove DFY Outbound. One line only; ownership is OFF unless the customer ticks it. */
  setDfy(v: CartDfy | null) { writeDfy(v); },
  /** Add, change or (null) remove the Email Verification service. One line only: choosing again replaces the package. */
  setVerification(pkg: string | null) { writeVerification(pkg); },
  /** Adds several lists at once (Build Your Own Bundle). All or nothing: if they do not fit in the cart, nothing is added. */
  addMany(items: CartItem[]): "ok" | "full" {
    const cur = read();
    const fresh = items.filter((i) => !cur.some((c) => c.slug === i.slug));
    if (cur.length + new Set(fresh.map((i) => i.slug)).size > MAX_CART_ITEMS) return "full";
    const map = new Map(cur.map((c) => [c.slug, c]));
    for (const i of items) map.set(i.slug, i);
    write([...map.values()]);
    return "ok";
  },
  /** A curated bundle is one cart line. Adding it again changes nothing. */
  addBundle(slug: string): "added" | "exists" | "full" {
    const cur = readBundles();
    if (cur.includes(slug)) return "exists";
    const next = normalizeBundleSlugs([...cur, slug]);
    if (next.length === cur.length) return "full";
    writeBundles(next);
    return "added";
  },
  removeBundle(slug: string) { writeBundles(readBundles().filter((s) => s !== slug)); },
  replaceBundles(slugs: string[]) { writeBundles(slugs); },
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
  clear() { write([]); writeBundles([]); writeVerification(null); writeDfy(null); },
};

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
export function useCartBundles(): string[] {
  return useSyncExternalStore(subscribe, readBundles, () => NO_BUNDLES);
}
export function useCartVerification(): string | null {
  return useSyncExternalStore(subscribe, readVerification, () => null);
}
export function useCartDfy(): CartDfy | null {
  return useSyncExternalStore(subscribe, readDfy, () => null);
}
/** Number of cart lines: single lists, bundles and the verification service. */
export const useCartCount = () => useCart().length + useCartBundles().length + (useCartVerification() ? 1 : 0) + (useCartDfy() ? 1 : 0);

/** false on the server and during hydration, true afterwards (so the cart is only drawn once the browser's own cart is known). */
export const useMounted = () => useSyncExternalStore(() => () => undefined, () => true, () => false);
