"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, ChevronsLeft, ChevronsRight, ClipboardList, FileText, ImageIcon, Mail, LogOut, Menu, Package, Send, Settings, ShoppingCart, Wallet, X } from "lucide-react";
import { ToastProvider } from "./toast";

const NAV = [
  ["Overview", "/admin", BarChart3],
  ["Products", "/admin/products", Package],
  ["Delivery Links", "/admin/delivery", Send],
  ["Orders", "/admin/orders", ShoppingCart],
  ["Payments & Wallets", "/admin/wallets", Wallet],
  ["Custom Requests", "/admin/custom-requests", ClipboardList],
  ["Blog", "/admin/blog", FileText],
  ["Media", "/admin/media", ImageIcon],
  ["Newsletter", "/admin/newsletter", Mail],
  ["Settings", "/admin/settings", Settings],
] as const;

const TITLES: Record<string, string> = Object.fromEntries(NAV.map(([l, h]) => [h, l]));

export function AdminShell({ email, role = "admin", logout, children }: { email: string | null; role?: "admin" | "editor"; logout: () => Promise<void>; children: React.ReactNode }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    try { return typeof localStorage !== "undefined" && localStorage.getItem("admin-collapsed") === "1"; } catch { return false; }
  });
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState(path);
  if (prev !== path) { setPrev(path); setOpen(false); }
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem("admin-collapsed", c ? "0" : "1"); } catch { /* ignore */ } return !c; });

  if (path === "/admin/login") return <main className="mx-auto w-full max-w-md px-5 py-16">{children}</main>;

  const title = TITLES[path] ?? NAV.find(([, h]) => h !== "/admin" && path.startsWith(h))?.[0] ?? "Admin";
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));

  const links = (compact: boolean) => (
    <ul className="space-y-1">
      {NAV.filter(([, href]) => role === "admin" || href === "/admin/blog" || href === "/admin/media").map(([label, href, Icon]) => (
        <li key={href}>
          <Link href={href} prefetch={false} title={label} aria-current={active(href) ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-purple-600 ${active(href) ? "bg-forest-100 text-forest-900" : "text-sand-200 hover:bg-forest-700 hover:text-sand-50"} ${active(href) ? "!text-forest-900" : ""}`}>
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className={compact ? "sr-only" : ""}>{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-sand-50">
        <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-forest-900 p-3 transition-[width] duration-200 lg:flex ${collapsed ? "w-[4.5rem]" : "w-64"}`}>
          <Link href="/admin" prefetch={false} className="mb-6 flex items-center gap-2 px-3 py-2 text-sand-50">
            <span className="grid size-8 place-items-center rounded-lg bg-sand-50 font-black text-forest-900">B</span>
            {!collapsed && <span className="display text-2xl text-sand-50">BeigeLeads</span>}
          </Link>
          <nav aria-label="Admin" className="flex-1">{links(collapsed)}</nav>
          <button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-sand-200 hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-purple-600">
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
              <nav aria-label="Admin">{links(false)}</nav>
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
