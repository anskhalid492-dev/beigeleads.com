"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Global "see a sample" band. Hidden on /solutions and /verification, which end with their own CTA. */
export function FooterCta() {
  const path = usePathname();
  if (path === "/solutions" || path.startsWith("/solutions/") || path === "/verification") return null;
  return (
    <div className="border-b border-forest-700">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="display max-w-xl text-5xl text-sand-50 sm:text-6xl">See a sample before you spend a cent.</h2>
        <Button asChild size="lg">
          <Link href="/sample">Request a free sample</Link>
        </Button>
      </div>
    </div>
  );
}
