import type { Metadata } from "next";
import Link from "next/link";
import { CartCheckout } from "@/components/cart/checkout-form";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { OPTIONS } from "@/lib/payments/options";

import { fitMeta } from "@/lib/seo/fit";
const metadataRaw: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CartCheckoutPage() {
  const steps = [["Cart", "/cart"], ["Checkout", ""], ["Payment", ""]] as const;
  return (
    <>
      <Breadcrumbs items={[{ name: "Cart", href: "/cart" }, { name: "Checkout", href: "/checkout/cart" }]} />
      <section className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-6">
        <h1 className="display text-5xl text-forest-900 sm:text-6xl">Complete Your Purchase</h1>
        <p className="mt-3 max-w-2xl text-lg">Review your databases, enter your delivery email, and choose how to pay. No account required.</p>
        <ol aria-label="Progress" className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {steps.map(([t, href], i) => (
            <li key={t} className="flex items-center gap-2" aria-current={i === 1 ? "step" : undefined}>
              {i > 0 && <span aria-hidden className="text-sand-300">&rarr;</span>}
              {href ? <Link href={href} className="text-forest-500 underline">{t}</Link> : <span className={i === 1 ? "rounded-full bg-forest-900 px-3 py-1 text-sand-50" : "text-forest-500"}>{t}</span>}
            </li>
          ))}
        </ol>
        <div className="mt-8"><CartCheckout options={Object.values(OPTIONS).map((o) => ({ value: o.id, label: o.label }))} /></div>
      </section>
    </>
  );
}

export const metadata: Metadata = fitMeta(metadataRaw);
