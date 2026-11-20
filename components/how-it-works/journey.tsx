import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

/** One step of the journey: copy on one side, a visual on the other. Anchored so the step nav can link to it. */
export function Step({ id, n, title, text, bullets, cta, flip, children }: {
  id: string; n: string; title: string; text: string; bullets: readonly string[]; cta: { href: string; label: string }; flip?: boolean; children: ReactNode;
}) {
  return (
    <section id={id} className="reveal scroll-mt-40 py-10 lg:py-14" aria-labelledby={`${id}-h`}>
      <div className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${flip ? "lg:[&>div:first-child]:order-2" : ""}`}>
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-900 px-3 py-1 text-sm font-semibold text-sand-50">Step {n}</span>
          <h3 id={`${id}-h`} className="display mt-4 text-5xl text-forest-900 sm:text-6xl">{title}</h3>
          <p className="mt-3 max-w-xl text-lg">{text}</p>
          <ul className="mt-5 space-y-2">
            {bullets.map((b) => (<li key={b} className="flex gap-2.5"><Check className="mt-1 size-4 shrink-0 text-forest-500" aria-hidden /><span>{b}</span></li>))}
          </ul>
          <div className="mt-6"><Button asChild size="lg"><Link href={cta.href}>{cta.label}</Link></Button></div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

/** Illustration only: no real payment, no real status. The real flow lives at /checkout. */
export function CheckoutIllustration() {
  const rows = [
    ["1", "Choose a coin", "Checkout shows the options currently open."],
    ["2", "Review amount and network", "An exact amount for your order, and the network to use."],
    ["3", "Send the payment", "To the address shown on the checkout page."],
    ["4", "Wait for confirmation", "We watch the blockchain and confirm your order automatically."],
  ] as const;
  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5 shadow-[0_20px_50px_-32px_rgba(15,42,29,0.5)]">
      <p className="text-sm font-semibold text-forest-900">What the checkout page walks you through <span className="font-normal">(illustration)</span></p>
      <ol className="mt-4 space-y-3">
        {rows.map(([n, t, d], i) => (
          <li key={n} className="flex gap-3 rounded-xl border border-sand-200 bg-sand-50 p-3">
            <span className="hiw-float grid size-8 shrink-0 place-items-center rounded-full bg-forest-900 text-sm font-bold text-sand-50" style={{ animationDelay: `${i * 0.4}s` }}>{n}</span>
            <span><span className="block font-semibold text-forest-900">{t}</span><span className="block text-sm">{d}</span></span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm">Add any network or exchange fee on top of the exact amount, so the full amount arrives. Which coins are open depends on the current configuration. <Link href="/help/payments/accepted-payment-methods" className="font-semibold text-forest-900 underline underline-offset-4">Payment methods</Link></p>
    </div>
  );
}

/** Fictional demonstration of the delivery email. */
export function DeliveryEmail({ listTitle }: { listTitle: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-white shadow-[0_20px_50px_-32px_rgba(15,42,29,0.5)]">
      <div className="flex items-center gap-2 border-b border-sand-200 px-5 py-3 text-sm">
        <Mail className="size-4 text-forest-500" aria-hidden /><span className="font-semibold text-forest-900">Example delivery email</span>
        <span className="ml-auto rounded-full bg-sand-100 px-2 py-0.5 text-xs">Illustration</span>
      </div>
      <div className="space-y-3 px-5 py-4 text-sm">
        <p><span className="font-semibold text-forest-900">To:</span> you@yourcompany.example</p>
        <p><span className="font-semibold text-forest-900">Order:</span> EXAMPLE-0000 · {listTitle}</p>
        <p className="rounded-xl bg-forest-100/60 px-4 py-3 font-semibold text-forest-900 hover:bg-forest-100"><ArrowRight className="mr-1 inline size-4" aria-hidden />Your secure file link appears here</p>
        <p>Formats: CSV, Excel or TXT. Open the link as often as you need.</p>
        <p className="text-xs">The real email also links to the lawful-use policy, the replacement policy and an opt-out page.</p>
      </div>
    </div>
  );
}
