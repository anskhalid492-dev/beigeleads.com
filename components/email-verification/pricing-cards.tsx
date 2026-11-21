"use client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cartActions } from "@/lib/cart/client";
import { formatUsd } from "@/lib/catalog";

type P = { name: string; limit: number; priceCents: number; featured: boolean };
const usd0 = (c: number) => formatUsd(c).replace(/\.00$/, "");

/** Every button starts the real purchase: the package goes into the cart (the server checks it again) and the customer lands on checkout. */
export function PricingCards({ packages, enabled }: { packages: P[]; enabled: boolean }) {
  const router = useRouter();
  const features = (p: P) => [`Up to ${p.limit.toLocaleString("en-US")} email addresses`, "CSV, XLSX, and TXT support", "Paste or securely upload your list", "Syntax and domain checks", "Mailbox checks where supported", "Duplicate and risk identification", "Downloadable verification results"];
  return (
    <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {packages.map((p) => (
        <li key={p.name} className={`relative flex flex-col rounded-3xl border bg-white p-7 ${p.featured ? "border-purple-600 shadow-[0_24px_60px_-32px_rgba(124,58,237,0.55)] ring-1 ring-purple-600" : "border-sand-200"}`}>
          {p.featured && <span className="absolute -top-3 left-7 rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">Featured</span>}
          <h3 className="text-xl font-bold text-forest-900">{p.name}</h3>
          <p className="mt-1 text-sm">Up to {p.limit.toLocaleString("en-US")} emails</p>
          <p className="mt-4 flex items-baseline gap-2"><span className="display text-6xl leading-none text-forest-900">{usd0(p.priceCents)}</span><span className="text-sm">one-time payment</span></p>
          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {features(p).map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{f}</li>)}
          </ul>
          <button type="button" disabled={!enabled} onClick={() => { cartActions.setVerification(p.name); router.push("/checkout/cart"); }} aria-label={`Select ${p.name} package, ${usd0(p.priceCents)}`}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-purple-600 px-6 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
            Select Package
          </button>
        </li>
      ))}
    </ul>
  );
}
