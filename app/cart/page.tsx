import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

// A private page: it only shows what is in this browser's cart.
export const metadata: Metadata = { title: "Your Cart", robots: { index: false, follow: false }, alternates: { canonical: "/cart" } };

export default function CartPage() {
  return (
    <>
      <Breadcrumbs wide items={[{ name: "Cart", href: "/cart" }]} />
      <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <header className="max-w-3xl pb-8 pt-2">
          <h1 className="display text-6xl text-forest-900 sm:text-8xl">Your Cart</h1>
          <p className="mt-3 text-lg sm:text-xl">You&apos;re one step closer to the business data you need.</p>
        </header>
        <CartView />
      </div>
    </>
  );
}
