"use client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isProductPath, pageTypeOf, pickCampaign } from "@/lib/popups/engine";
import type { Campaign, Visitor } from "@/lib/popups/types";
import type { CatalogLite } from "./blocks";
import { PopupView } from "./popup-view";
import { loadVisitor, saveVisitor, startSession, trackingAllowed } from "./visitor";

type Payload = { campaigns: Campaign[]; catalog?: CatalogLite };
let cache: Promise<Payload> | null = null;
const load = () => (cache ??= fetch("/api/popups").then((r) => (r.ok ? (r.json() as Promise<Payload>) : { campaigns: [] })).catch(() => ({ campaigns: [] })));

/**
 * Runs the live popup campaigns. Loads after the page is ready from a cached endpoint (empty while every campaign
 * is a draft), reads only real browser events, shows at most ONE popup per page view, never in the admin.
 */
export function PopupHost() {
  const path = usePathname();
  const [data, setData] = useState<Payload | null>(null);
  const [shown, setShownRaw] = useState<Campaign | null>(null);
  const [extra, setExtra] = useState({ query: "", custom: "/custom-list" });
  const setShown = (c: Campaign | null) => setShownRaw(c);
  const visitor = useRef<Visitor | null>(null);
  const signals = useRef<Set<string>>(new Set());
  const query = useRef("");
  const customHref = useRef("/custom-list");
  const seconds = useRef(0);
  const scroll = useRef(0);
  const exit = useRef(false);
  const done = useRef(false); // one popup per page view

  const admin = path === "/admin" || path.startsWith("/admin/");
  const save = useCallback(() => { if (visitor.current) saveVisitor(visitor.current); }, []);
  const send = useCallback((id: string, event: string) => {
    if (!trackingAllowed()) return;
    try { navigator.sendBeacon?.("/api/popups/event", new Blob([JSON.stringify({ id, event, page: pageTypeOf(location.pathname) })], { type: "application/json" })); } catch { /* ignore */ }
  }, []);

  // Load campaigns + visitor once.
  useEffect(() => {
    if (admin) return;
    visitor.current = startSession(loadVisitor());
    save();
    let off = false;
    const t = setTimeout(() => load().then((d) => { if (!off && d.campaigns.length) setData(d); }), 1500);
    return () => { off = true; clearTimeout(t); };
  }, [admin, save]);

  // Per page view: counters, scroll, exit intent, real events.
  useEffect(() => {
    if (admin || !visitor.current) return;
    const v = visitor.current;
    v.pages += 1;
    if (isProductPath(path)) v.productViews += 1;
    if (path.startsWith("/checkout/")) v.checkoutStarted = true;
    save();
    done.current = false; seconds.current = 0; scroll.current = 0; exit.current = false; signals.current = new Set(); query.current = "";
    setShown(null);

    const onScroll = () => { const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; if (max > 0) scroll.current = Math.max(scroll.current, Math.round((h.scrollTop / max) * 100)); };
    const onOut = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) exit.current = true; };
    const sig = (name: string, fn?: (d: Record<string, string>) => void) => (e: Event) => { signals.current.add(name); fn?.(((e as CustomEvent).detail ?? {}) as Record<string, string>); };
    const onNoRes = sig("search_noresults", (d) => { query.current = d.query ?? ""; if (d.href && d.href.startsWith("/custom-list")) customHref.current = d.href; });
    const onBought = () => { signals.current.add("purchased"); v.purchased = true; save(); };
    const onSample = () => { v.sampleRequested = true; save(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onOut);
    window.addEventListener("bl:search-noresults", onNoRes);
    window.addEventListener("bl:purchased", onBought);
    window.addEventListener("bl:sample-requested", onSample);
    const tick = setInterval(() => { if (document.visibilityState === "visible") seconds.current += 1; }, 1000);
    return () => { clearInterval(tick); window.removeEventListener("scroll", onScroll); document.removeEventListener("mouseout", onOut); window.removeEventListener("bl:search-noresults", onNoRes); window.removeEventListener("bl:purchased", onBought); window.removeEventListener("bl:sample-requested", onSample); };
  }, [path, admin, save]);

  // Decide. Never while the visitor is typing in a field.
  useEffect(() => {
    if (admin || !data) return;
    const t = setInterval(() => {
      const v = visitor.current;
      if (!v || done.current) return;
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      const c = pickCampaign(data.campaigns, { pageType: pageTypeOf(path), path, seconds: seconds.current, scrollPct: scroll.current, exitIntent: exit.current, signals: signals.current, visitor: v, now: Date.now() });
      if (!c) return;
      done.current = true;
      const s = v.popups[c.id] ?? { n: 0, last: 0 };
      v.popups[c.id] = { ...s, n: s.n + 1, last: Date.now() };
      v.lastAnyShown = Date.now();
      save(); send(c.id, "impression"); setExtra({ query: query.current, custom: customHref.current }); setShown(c);
    }, 1000);
    return () => clearInterval(t);
  }, [data, path, admin, save, send]);

  if (admin || !shown || !data) return null;
  const slug = /^\/product\/([^/?#]+)/.exec(path)?.[1] ?? "";
  const href = (raw: string) => raw.replace("{product_url}", `/lists/${slug}`).replace("{product_slug}", slug).replace("{custom_href}", extra.custom);
  const secondary = shown.secondary ? href(shown.secondary.href) : null;
  const mark = (k: "dismissedAt" | "converted") => { const v = visitor.current; if (!v) return; const s = v.popups[shown.id] ?? { n: 1, last: Date.now() }; v.popups[shown.id] = { ...s, ...(k === "dismissedAt" ? { dismissedAt: Date.now() } : { converted: true }) }; save(); };
  const catalog: CatalogLite = data.catalog ?? { categories: [], countries: [], products: [], samples: {} };
  return (
    <PopupView c={shown} href={href} secondaryHref={secondary}
      ctx={{ catalog, productSlug: slug, query: extra.query, onNavigate: () => { mark("converted"); send(shown.id, "click"); setShown(null); } }}
      onClose={() => { mark("dismissedAt"); send(shown.id, "dismiss"); setShown(null); }}
      onCta={() => { mark("converted"); send(shown.id, "click"); setShown(null); }} />
  );
}
