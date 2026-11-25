import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck, Hash } from "lucide-react";
import { OrderLookupForm } from "@/components/orders/lookup-form";
import { SolutionFaq } from "@/components/solutions/sections";
import { fitMeta } from "@/lib/seo/fit";

const metadataRaw: Metadata = { title: "Find my order | BeigeLeads", description: "Check the status of a BeigeLeads order with your order number and email. No account needed." , alternates: { canonical: "/order-lookup" } };
export const metadata: Metadata = fitMeta(metadataRaw);

const STEPS: readonly (readonly [string, string, typeof Hash])[] = [
  ["Find your order number", "It is in the confirmation email we sent when you placed the order.", Hash],
  ["Enter the checkout email", "Use the same address you typed at checkout. Both details must match.", Mail],
  ["See the status", "You see whether payment and delivery are done. If it was delivered, you can ask us to send the email again.", ShieldCheck],
];

const FAQ: readonly (readonly [string, string])[] = [
  ["Do I need an account?", "No. The order number and the email you used at checkout are all you need."],
  ["Where do I find my order number?", "In the confirmation email sent right after checkout. If you cannot find it, contact us from the email address you used and we will help."],
  ["Will this page show my download link?", "No. Delivery links are only ever emailed to the address on the order, never shown on a web page."],
  ["My order says it is waiting for payment. What now?", "Payments are in crypto and are matched to the exact amount shown at checkout. The status updates once the payment is confirmed on the network."],
  ["I did not get my delivery email.", "Check your spam folder first. If the order shows as delivered, use the option on the result to send it again to the order address."],
  ["What if the details do not match?", "You get the same message whether the order does not exist or the email is wrong. That protects other buyers' orders."],
];

export default function Page() {
  return (
    <main className="bg-sand-50">
      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pt-20">
        <div>
          <h1 className="display text-5xl text-forest-900 sm:text-6xl lg:text-7xl">Where is my order?</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-forest-700">No account needed. Enter the order number from your email and the address you used at checkout to see its status.</p>
          <p className="mt-6 max-w-xl text-sm text-forest-700">Lost your order number? <Link className="font-semibold underline underline-offset-4" href="/contact">Contact us</Link> from the email you used at checkout. Download links are never shown here; they are only emailed to the order address.</p>
        </div>
        <div className="rounded-[2rem] border border-sand-300 bg-white p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-forest-900">Look up an order</h2>
          <div className="mt-4"><OrderLookupForm /></div>
        </div>
      </section>

      <section className="border-y border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
          <h2 className="display max-w-xl text-3xl text-forest-900 sm:text-4xl">Three quick steps.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map(([t, d, Icon]) => (
              <li key={t} className="rounded-2xl border border-sand-300 bg-white p-6">
                <span className="grid size-10 place-items-center rounded-full bg-forest-900 text-sand-50"><Icon className="size-5" aria-hidden /></span>
                <h3 className="mt-4 text-xl font-semibold text-forest-900">{t}</h3>
                <p className="mt-2 leading-relaxed text-forest-700">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <SolutionFaq name="Find my order" items={FAQ} />

      <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[2rem] bg-forest-900 p-8 text-sand-50 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="display text-3xl sm:text-4xl">Still stuck?</h2>
            <p className="mt-2 text-forest-300">The Help Center covers delivery and payment questions.</p>
          </div>
          <Link href="/help-center" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand-50">Open the Help Center <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>
    </main>
  );
}
