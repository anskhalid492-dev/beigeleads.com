import type { Metadata } from "next";
import { CartCheckout } from "@/components/cart/checkout-form";
import { FormPage } from "@/components/shared/form-page";
import { OPTIONS } from "@/lib/payments/options";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CartCheckoutPage() {
  return (
    <FormPage title="Checkout" intro="Review your lists, enter your email and choose how to pay. One order, one payment, no account." crumbs={[{ name: "Cart", href: "/cart" }, { name: "Checkout", href: "/checkout/cart" }]}>
      <CartCheckout options={Object.values(OPTIONS).map((o) => ({ value: o.id, label: o.label }))} />
    </FormPage>
  );
}
