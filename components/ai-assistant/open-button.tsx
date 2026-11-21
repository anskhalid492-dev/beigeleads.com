"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { openPilo } from "@/components/beigepilot/open";

/** Opens the existing BeigePilot widget (optionally with a first question). If the assistant is switched off or not loaded yet, says so and offers real alternatives instead of doing nothing. */
export function OpenPilo({ ask, action, className, children, fallbackDark }: { ask?: string; action?: "support"; className?: string; children: ReactNode; fallbackDark?: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setMissing(!openPilo({ ask, action }))}>{children}</button>
      {missing && (
        <p role="alert" className={`mt-3 w-full text-sm ${fallbackDark ? "text-sand-200" : "text-forest-700"}`}>
          The assistant isn&rsquo;t available right now. You can <Link href="/lists" className="underline">browse the databases</Link> or <Link href="/contact" className="underline">contact us</Link>.
        </p>
      )}
    </>
  );
}
