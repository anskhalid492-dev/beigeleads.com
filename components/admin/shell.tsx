"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Database, Bot, TicketPercent, Handshake, BookMarked, BookOpen, Presentation, BarChart3, ChevronDown, ChevronsLeft, ChevronsRight, ClipboardList, Globe, FileText, Inbox, Search, ImageIcon, LifeBuoy, Mail, MailCheck, MessageSquare, LogOut, Users, UsersRound, Menu, Package, Send, Settings, ShieldCheck, ShoppingCart, Wallet, X } from "lucide-react";
import { ToastProvider } from "./toast";

const NAV = [
  ["Overview", "/admin", BarChart3],
  ["Orders", "/admin/orders", ShoppingCart],
  ["Delivery Links", "/admin/delivery", Send],
  ["Cart funnel", "/admin/cart", ShoppingCart],
  ["Payments & Wallets", "/admin/wallets", Wallet],
  ["Promotions", "/admin/promotions", TicketPercent],
  ["Sales Features", "/admin/sales", TicketPercent],
  ["Volume Discounts", "/admin/sales/volume", TicketPercent],
  ["Second Purchase Offer", "/admin/sales/reward", TicketPercent],
  ["Team Purchase Requests", "/admin/sales/team", UsersRound],
  ["Partner Requests", "/admin/partner-requests", Handshake],
  ["Products", "/admin/products", Package],
  ["Database Bundles", "/admin/bundles", Package],
  ["List categories", "/admin/categories", Package],
  ["Catalog setup", "/admin/catalog", Package],
  ["Geography", "/admin/geography", Globe],
  ["Geography pages SEO", "/admin/geography/pages", Globe],
  ["DFY Outbound Orders", "/admin/dfy", ShieldCheck],
  ["DFY Outbound Settings", "/admin/dfy/settings", ShieldCheck],
  ["Email List Verification Orders", "/admin/email-verification", ShieldCheck],
  ["Email List Verification Settings", "/admin/email-verification/settings", ShieldCheck],
  ["Custom Requests", "/admin/custom-requests", ClipboardList],
  ["Sample Requests", "/admin/sample-requests", Inbox],
  ["Contact Inquiries", "/admin/contact-inquiries", MessageSquare],
  ["Creator Inquiries", "/admin/creator-inquiries", Users],
  ["Reviews & Follow-ups", "/admin/reviews", MessageSquare],
  ["Customer Success", "/admin/customer-success", Users],
  ["Blog", "/admin/blog", FileText],
  ["Authors", "/admin/blog/authors", Users],
  ["Guides", "/admin/guides", BookOpen],
  ["Case Studies", "/admin/case-studies", Presentation],
  ["Glossary", "/admin/glossary", BookMarked],
  ["Our Data page", "/admin/our-data", Database],
  ["Help Center", "/admin/help", LifeBuoy],
  ["Media", "/admin/media", ImageIcon],
  ["Media Kit", "/admin/media-kit", ImageIcon],
  ["Newsletter", "/admin/newsletter", Mail],
  ["SEO", "/admin/seo", Search],
  ["Website pages SEO", "/admin/seo/site-pages", Search],
  ["Keywords", "/admin/seo/keywords", Search],
  ["Redirects", "/admin/seo/redirects", Search],
  ["Sitemap", "/admin/seo/sitemap", Search],
  ["Site audit", "/admin/seo/audit", Search],
  ["Search Console", "/admin/seo/search-console", Search],
  ["BeigePilot AI", "/admin/beigepilot", Bot],
  ["Popups", "/admin/popups", MessageSquare],
  ["System Emails", "/admin/system-emails", MailCheck],
  ["Social Links", "/admin/website/social-links", Globe],
  ["AI Platforms", "/admin/website/ai-platforms", Bot],
  ["AI Information", "/admin/website/ai-information", FileText],
  ["Settings", "/admin/settings", Settings],
] as const;

const GROUPS: { name: string; hrefs: string[] }[] = [
  { name: "", hrefs: ["/admin"] },
  { name: "Sales & Orders", hrefs: ["/admin/orders", "/admin/delivery", "/admin/cart", "/admin/wallets", "/admin/promotions", "/admin/sales", "/admin/sales/volume", "/admin/sales/reward", "/admin/sales/team", "/admin/partner-requests"] },
  { name: "Catalog", hrefs: ["/admin/products", "/admin/bundles", "/admin/categories", "/admin/catalog", "/admin/geography", "/admin/geography/pages"] },
  { name: "Services", hrefs: ["/admin/dfy", "/admin/dfy/settings", "/admin/email-verification", "/admin/email-verification/settings", "/admin/custom-requests"] },
  { name: "Inbox", hrefs: ["/admin/sample-requests", "/admin/contact-inquiries", "/admin/creator-inquiries", "/admin/reviews", "/admin/customer-success"] },
  { name: "Content", hrefs: ["/admin/blog", "/admin/blog/authors", "/admin/guides", "/admin/case-studies", "/admin/glossary", "/admin/our-data", "/admin/help", "/admin/media", "/admin/media-kit", "/admin/newsletter"] },
  { name: "SEO", hrefs: ["/admin/seo", "/admin/seo/site-pages", "/admin/seo/keywords", "/admin/seo/redirects", "/admin/seo/sitemap", "/admin/seo/audit", "/admin/seo/search-console"] },
  { name: "Assistant & Messaging", hrefs: ["/admin/beigepilot", "/admin/popups", "/admin/system-emails"] },
  { name: "Website", hrefs: ["/admin/website/social-links", "/admin/website/ai-platforms", "/admin/website/ai-information", "/admin/settings"] },
];

const TITLES: Record<string, string> = Object.fromEntries(NAV.map(([l, h]) => [h, l]));

export function AdminShell({ email, role = "admin", logout, pendingPartners = 0, children }: { email: string | null; role?: "admin" | "editor"; logout: () => Promise<void>; pendingPartners?: number; children: React.ReactNode }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    try { return typeof localStorage !== "undefined" && localStorage.getItem("admin-collapsed") === "1"; } catch { return false; }
  });
  const [open, setOpen] = useState(false);
  const [shut, setShut] = useState<Record<string, boolean>>({});
  const [prev, setPrev] = useState(path);
  if (prev !== path) { setPrev(path); setOpen(false); }
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem("admin-collapsed", c ? "0" : "1"); } catch { /* ignore */ } return !c; });

  if (path === "/admin/login") return <main className="mx-auto w-full max-w-md px-5 py-16">{children}</main>;

  const best = NAV.filter(([, h]) => (h === "/admin" ? path === "/admin" : path === h || path.startsWith(h + "/"))).sort((x, y) => y[1].length - x[1].length)[0]?.[1];
  const title = TITLES[best ?? ""] ?? "Admin";
  const active = (h: string) => h === best;
  const allowed = (href: string) => role === "admin" || href === "/admin/blog" || href === "/admin/media";
  const linkOf = (href: string, compact: boolean) => {
    const [label, , Icon] = NAV.find(([, h]) => h === href)!;
    return (
      <li key={href}>
        <Link href={href} prefetch={false} title={label} aria-current={active(href) ? "page" : undefined}
          className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-purple-600 ${active(href) ? "bg-forest-100 !text-forest-900" : "text-sand-200 hover:bg-forest-700 hover:text-sand-50"}`}>
          <Icon className="size-5 shrink-0" aria-hidden />
          <span className={compact ? "sr-only" : ""}>{label}</span>
          {href === "/admin/partner-requests" && pendingPartners > 0 && (
            <span className={`ml-auto grid min-w-5 place-items-center rounded-full bg-purple-600 px-1.5 text-xs font-bold leading-5 text-white ${compact ? "absolute right-1.5 top-1" : ""}`}><span className="sr-only">Pending: </span>{pendingPartners}</span>
          )}
        </Link>
      </li>
    );
  };

  const links = (compact: boolean) => (
    <div className="space-y-1">
      {GROUPS.map((g) => {
        const hrefs = g.hrefs.filter(allowed);
        if (!hrefs.length) return null;
        if (!g.name || compact) return <ul key={g.name || "top"} className="space-y-0.5">{hrefs.map((h) => linkOf(h, compact))}</ul>;
        const hasActive = hrefs.some(active);
        const isOpen = hasActive || !shut[g.name];
        return (
          <section key={g.name}>
            <button type="button" aria-expanded={isOpen} onClick={() => setShut((m) => ({ ...m, [g.name]: isOpen }))}
              className="mt-3 flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs font-bold text-forest-300 hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-purple-600">
              {g.name}<ChevronDown className={`size-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} aria-hidden />
            </button>
            {isOpen && <ul className="space-y-0.5">{hrefs.map((h) => linkOf(h, false))}</ul>}
          </section>
        );
      })}
    </div>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-sand-50">
        <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-forest-900 p-3 transition-[width] duration-200 lg:flex ${collapsed ? "w-[4.5rem]" : "w-64"}`}>
          <Link href="/admin" prefetch={false} className="mb-3 flex shrink-0 items-center gap-2 px-3 py-2 text-sand-50">
            <span className="grid size-8 place-items-center rounded-lg bg-sand-50 font-black text-forest-900">B</span>
            {!collapsed && <span className="display text-2xl text-sand-50">BeigeLeads</span>}
          </Link>
          <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-forest-500)_transparent]">{links(collapsed)}</nav>
          <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="mt-2 flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-200 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-purple-600">
            {collapsed ? <ChevronsRight className="size-5" aria-hidden /> : <><ChevronsLeft className="size-5" aria-hidden /> Collapse</>}
          </button>
        </aside>

        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-forest-900/60" onClick={() => setOpen(false)} />
            <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-forest-900 p-3">
              <div className="mb-4 flex items-center justify-between px-3 py-2">
                <span className="display text-2xl text-sand-50">BeigeLeads</span>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="text-sand-50"><X className="size-6" /></button>
              </div>
              <nav aria-label="Admin" className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">{links(false)}</nav>
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sand-200 bg-sand-50/95 px-4 py-3 backdrop-blur sm:px-6">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-forest-900 hover:bg-sand-100 lg:hidden"><Menu className="size-6" /></button>
            <p className="text-lg font-bold text-forest-900">{title}</p>
            <div className="ml-auto flex items-center gap-3">
              {email && <span className="hidden text-sm sm:inline">{email}</span>}
              <form action={logout}>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-purple-600">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
              </form>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
