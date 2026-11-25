"use client";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { OrderLookupForm } from "@/components/orders/lookup-form";
import type { Extra } from "@/lib/beigepilot/tools";

/** Interactive blocks under a Pilo answer. The order form talks to /api/order-lookup directly: what is typed in it is not sent to the AI provider. */
export function ChatExtra({ x }: { x: Extra }) {
  if (x.kind === "order") {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-3">
        <p className="mb-2 text-xs text-forest-500">Your order number and email go straight to our order system, not to the AI.</p>
        <OrderLookupForm compact />
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-3 text-sm text-forest-900">
      <p className="flex items-center gap-2 font-semibold"><ClipboardList className="size-4" aria-hidden /> Custom list request</p>
      <p className="mt-1 text-forest-700">I filled in what I understood: <strong>{x.summary}</strong>. You check it and send it yourself.</p>
      <Link href={x.href} className="mt-2 inline-flex rounded-full bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">Start my custom list request</Link>
    </div>
  );
}
