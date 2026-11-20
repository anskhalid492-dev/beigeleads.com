"use client";

import { CartHeaderLink } from "@/components/cart/header-link";
import { BrandLogo } from "@/components/shared/brand-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListsMegaPanel, ListsMobile } from "@/components/layout/lists-mega";
import { SolutionIcon } from "@/components/solutions/icons";
import { getSolution } from "@/lib/solutions";
import { TAXONOMY, type TaxGroup } from "@/lib/taxonomy";

const GROUPS = [
  { heading: "By use case", slugs: ["b2b-lead-generation", "cold-email-marketing", "sales-prospecting", "market-research"] },
  { heading: "By audience", slugs: ["marketing-agencies", "recruitment-staffing", "local-business-marketing", "business-expansion"] },
  { heading: "By industry", slugs: ["healthcare-marketing", "real-estate-prospecting", "ecommerce-market-research", "influencer-marketing"] },
] as const;

const LINKS = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Compare", href: "/compare" },
  { label: "Help Center", href: "/help-center" },
] as const;

type Key = "lists" | "solutions" | null;

export type ListsMenuData = { industries: { slug: string; name: string }[]; countries: { slug: string; name: string }[] };

/** Order the menu by the admin's featured slugs; unknown slugs are ignored, empty = everything. */
const pick = <T extends { slug: string }>(all: T[], featured: string[] | undefined) => {
  if (!featured?.length) return all;
  const out = featured.flatMap((f) => all.filter((a) => a.slug === f));
  return out.length ? out : all;
};

export function Header({ lists }: { lists: ListsMenuData }) {
  const [featured, setFeatured] = useState<{ industries: string[]; countries: string[] } | null>(null);
  const [tax, setTax] = useState<TaxGroup[]>(TAXONOMY);
  const pathname = usePathname();
  useEffect(() => {
    let live = true;
    fetch("/api/menu/taxonomy").then((r) => (r.ok ? (r.json() as Promise<{ tax?: TaxGroup[] }>) : null)).then((x) => { if (live && x?.tax?.length) setTax(x.tax); }).catch(() => {});
    fetch("/api/public-settings").then((r) => (r.ok ? (r.json() as Promise<{ featured?: { industries: string[]; countries: string[] } }>) : null)).then((x) => { if (live && x?.featured) setFeatured(x.featured); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const industries = pick(lists.industries, featured?.industries);
  const [open, setOpen] = useState<Key>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const listsBtn = useRef<HTMLSpanElement>(null);
  const [listsLeft, setListsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(null);
  }, []);
  // Anchor the Lists panel under its nav item, clamped so the widest state (20rem) stays inside the bar.
  const place = () => {
    const w = wrap.current, b = listsBtn.current;
    if (!w || !b) return;
    const left = b.getBoundingClientRect().left - w.getBoundingClientRect().left - 12;
    setListsLeft(Math.max(0, Math.min(left, w.clientWidth - 336)));
  };
  const hoverOpen = (k: Key) => {
    clearTimeout(timer.current);
    if (k === "lists") place();
    setOpen(k);
  };
  const hoverClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 180); // grace period: no flicker when the cursor crosses gaps
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        close();
        setMobile(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [close]);

  // Close menus after navigation (state adjusted during render, not in an effect).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(null);
    setMobile(false);
  }

  const linkClass = (href: string) =>
    `relative rounded-full px-4 py-2 text-base font-semibold tracking-[-0.005em] [font-stretch:90%] text-forest-900 transition-colors hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
      pathname === href || pathname.startsWith(`${href}/`) ? "bg-sand-100 after:absolute after:inset-x-4 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-forest-900" : ""
    }`;
  const trigger = (k: Exclude<Key, null>, label: string, active: boolean) => (
    <button
      type="button"
      aria-expanded={open === k}
      aria-haspopup="true"
      aria-controls={`menu-${k}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (k === "lists") place();
          setOpen(k);
          requestAnimationFrame(() => document.querySelector<HTMLElement>(`#menu-${k} button, #menu-${k} a`)?.focus());
        }
      }}
      onClick={() => { if (k === "lists") place(); setOpen((v) => (v === k ? null : k)); }}
      className={`flex items-center gap-1 rounded-full px-4 py-2 text-base font-semibold tracking-[-0.005em] [font-stretch:90%] text-forest-900 transition-colors hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${open === k || active ? "bg-sand-100" : ""}`}
    >
      {label} <ChevronDown className={`size-4 transition-transform ${open === k ? "rotate-180" : ""}`} aria-hidden />
    </button>
  );

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div ref={wrap} className="relative mx-auto max-w-6xl">
        <div
          className={`flex items-center justify-between gap-3 rounded-full border border-sand-200 bg-sand-50/90 px-3 shadow-[0_8px_30px_rgba(15,42,29,0.08)] backdrop-blur transition-all duration-300 sm:px-4 ${scrolled ? "h-14" : "h-[4.25rem]"}`}
        >
          <Link href="/" aria-label="BeigeLeads home" className="flex items-center gap-2 rounded-full pl-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            <BrandLogo className="h-9 w-auto" />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
            <div onMouseEnter={() => hoverOpen("lists")} onMouseLeave={hoverClose}>
              <span ref={listsBtn} className="inline-flex">{trigger("lists", "Lists", pathname.startsWith("/lists"))}</span>
            </div>
            <div onMouseEnter={() => hoverOpen("solutions")} onMouseLeave={hoverClose}>
              {trigger("solutions", "Solutions", pathname.startsWith("/solutions"))}
            </div>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <CartHeaderLink />
            <Button asChild variant="secondary" size="sm" className="h-10 rounded-full px-5 text-[0.9375rem] tracking-[-0.005em] [font-stretch:90%] transition-all duration-200 hidden border-forest-900/20 hover:border-forest-900 hover:bg-sand-100 xl:inline-flex">
              <Link href="/sample">Try a Sample</Link>
            </Button>
            <Button asChild size="sm" className="h-10 rounded-full px-5 text-[0.9375rem] tracking-[-0.005em] [font-stretch:90%] transition-all duration-200 hidden shadow-[0_6px_16px_rgba(124,58,237,0.28)] hover:-translate-y-px hover:shadow-[0_8px_20px_rgba(109,40,217,0.34)] sm:inline-flex">
              <Link href="/custom-list">Build My List</Link>
            </Button>
            <button
              type="button"
              aria-label={mobile ? "Close menu" : "Open menu"}
              aria-expanded={mobile}
              aria-controls="mobile-menu"
              onClick={() => setMobile((v) => !v)}
              className="grid size-10 place-items-center rounded-full hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 lg:hidden"
            >
              {mobile ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Desktop panels. pt-3 is a hover bridge between the bar and the panel. */}
        {open && (
          <div
            className="absolute inset-x-0 top-full hidden pt-3 lg:block"
            onMouseEnter={() => hoverOpen(open)}
            onMouseLeave={hoverClose}
          >
            {open === "solutions" ? (
              <div id="menu-solutions" className="mega-in grid gap-6 rounded-3xl border border-sand-200 bg-white p-6 shadow-2xl lg:grid-cols-[repeat(3,1fr)_15rem]">
                {GROUPS.map((g) => (
                  <div key={g.heading}>
                    <p className="mb-3 text-sm font-bold text-forest-900">{g.heading}</p>
                    <ul className="space-y-1">
                      {g.slugs.map((slug) => {
                        const s = getSolution(slug);
                        if (!s) return null;
                        return (
                          <li key={slug}>
                            <Link href={`/solutions/${slug}`} onClick={close} className="group flex gap-3 rounded-xl p-2 transition-colors hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-forest-900 text-forest-300 transition-transform group-hover:-translate-y-0.5">
                                <SolutionIcon name={s.icon} className="size-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-forest-900">{s.navName}</span>
                                <span className="line-clamp-2 block text-xs">{s.tagline}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
                <Link href="/#find-leads" onClick={close} className="flex flex-col justify-between rounded-2xl bg-forest-900 p-5 text-sand-50 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-purple-600">
                  <span>
                    <Sparkles className="size-5 text-sand-300" aria-hidden />
                    <span className="display mt-3 block text-2xl">Lead discovery co-pilot</span>
                    <span className="mt-2 block text-sm text-sand-200">Describe your audience and we search the catalog for a match.</span>
                  </span>
                  <span className="mt-4 text-sm font-semibold text-sand-50 underline underline-offset-4">Try it</span>
                </Link>
                <div className="border-t border-sand-200 pt-3 lg:col-span-4">
                  <Link href="/solutions" onClick={close} className="text-sm font-semibold text-forest-700 underline-offset-4 hover:underline">All solutions &rarr;</Link>
                </div>
              </div>
            ) : (
              <div style={{ marginLeft: listsLeft }} className="w-fit max-w-full"><ListsMegaPanel tax={tax} industries={industries} onNavigate={close} /></div>
            )}
          </div>
        )}

        {/* Mobile menu */}
        {mobile && (
          <div id="mobile-menu" className="mega-in absolute inset-x-0 top-full mt-3 max-h-[75vh] overflow-y-auto rounded-3xl border border-sand-200 bg-white p-4 shadow-2xl lg:hidden">
            <ul className="space-y-1 text-base font-medium text-forest-900">
              <li><ListsMobile tax={tax} industries={industries} onNavigate={() => setMobile(false)} /></li>
              <li><CartHeaderLink withLabel onClick={close} /></li>
              <li>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-3 hover:bg-sand-100">
                    Solutions <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="space-y-3 pb-2 pl-3">
                    {GROUPS.map((g) => (
                      <div key={g.heading}>
                        <p className="px-3 pt-2 text-xs font-bold text-forest-500">{g.heading}</p>
                        {g.slugs.map((slug) => {
                          const s = getSolution(slug);
                          return s ? <Link key={slug} href={`/solutions/${slug}`} className="block rounded-lg px-3 py-2 text-sm hover:bg-sand-100">{s.navName}</Link> : null;
                        })}
                      </div>
                    ))}
                  </div>
                </details>
              </li>
              {LINKS.map((l) => (
                <li key={l.href}><Link href={l.href} className="block rounded-xl px-3 py-3 hover:bg-sand-100">{l.label}</Link></li>
              ))}
            </ul>
            <div className="mt-3 grid gap-2 border-t border-sand-200 pt-3">
              <Button asChild size="lg" className="rounded-full"><Link href="/custom-list">Build My List</Link></Button>
              <Button asChild variant="secondary" size="lg" className="rounded-full"><Link href="/sample">Try a Sample</Link></Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
