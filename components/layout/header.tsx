"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainNav, megaMenu } from "./nav-data";

export function Header() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" aria-label="BeigeLeads home" className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="size-7" aria-hidden>
            <rect width="24" height="24" rx="5" fill="#0f2a1d" />
            <rect x="5" y="6" width="14" height="2.5" rx="1.25" fill="#fbf8f1" />
            <rect x="5" y="10.75" width="14" height="2.5" rx="1.25" fill="#fbf8f1" />
            <rect x="5" y="15.5" width="8" height="2.5" rx="1.25" fill="#d8c9a3" />
          </svg>
          <span className="display text-2xl text-forest-900">BeigeLeads</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <div ref={ref} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="true"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-forest-900 hover:bg-sand-100"
            >
              Lists <ChevronDown className="size-4" aria-hidden />
            </button>
            {open && (
              <div className="absolute left-0 top-12 w-[28rem] rounded-2xl border border-sand-200 bg-white p-5 shadow-lg">
                <div className="grid grid-cols-3 gap-4">
                  {megaMenu.map((group) => (
                    <div key={group.heading}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-forest-500">
                        {group.heading}
                      </p>
                      <ul className="space-y-1">
                        {group.items.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={() => setOpen(false)}
                              className="text-sm text-forest-900 hover:underline"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <Link
                  href="/lists"
                  onClick={() => setOpen(false)}
                  className="mt-4 block border-t border-sand-200 pt-3 text-sm font-semibold text-forest-700 hover:underline"
                >
                  Browse all categories &rarr;
                </Link>
              </div>
            )}
          </div>
          {mainNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-forest-900 hover:bg-sand-100"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/sample">Free sample</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/lists">Browse lists</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
