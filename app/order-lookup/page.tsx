import type { Metadata } from "next";
import Link from "next/link";
import { OrderLookupForm } from "@/components/orders/lookup-form";
import { fitMeta } from "@/lib/seo/fit";

const metadataRaw: Metadata = { title: "Find my order | BeigeLeads", description: "Check the status of a BeigeLeads order with your order number and email. No account needed." , alternates: { canonical: "/order-lookup" } };
export const metadata: Metadata = fitMeta(metadataRaw);

export default function Page() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-12 sm:px-6">
      <h1 className="display text-5xl text-forest-900 sm:text-6xl">Find my order</h1>
      <p className="mt-4 text-forest-700">No account needed. Enter the order number from your email and the email address you used at checkout.</p>
      <div className="mt-6 rounded-2xl border border-sand-200 bg-sand-100 p-5"><OrderLookupForm /></div>
      <p className="mt-5 text-sm text-forest-500">Lost your order number? <Link className="underline" href="/contact">Contact us</Link> from the email you used at checkout. Download links are never shown on this page; they are only emailed to the order address. See <Link className="underline" href="/help-center">the Help Center</Link> for delivery questions.</p>
    </main>
  );
}
