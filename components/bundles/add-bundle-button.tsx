"use client";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cartActions, useCartBundles, useCartCount } from "@/lib/cart/client";
import { trackCart } from "@/lib/cart/track";
import { MAX_CART_BUNDLES } from "@/lib/bundles/pricing";

/** Adds a curated bundle to the cart as one line. Adding it twice does nothing: the button turns into a link to the cart. */
export function AddBundleButton({ slug, disabled = false, size = "md", className = "", reason = "" }: { slug: string; disabled?: boolean; size?: "sm" | "md" | "lg"; className?: string; reason?: string }) {
  const inCart = useCartBundles().includes(slug);
  const count = useCartCount();
  const [note, setNote] = useState("");
  function click() {
    const r = cartActions.addBundle(slug);
    if (r === "full") { setNote(`Your cart holds up to ${MAX_CART_BUNDLES} bundles. Check out or remove one first.`); return; }
    setNote("Bundle added to your cart.");
    if (r === "added") trackCart("add_to_cart", count + 1);
  }
  if (inCart) {
    return (
      <div className={className}>
        <Button variant="secondary" size={size} className="w-full" asChild><Link href="/cart"><Check className="size-4" aria-hidden /> In your cart. View cart</Link></Button>
        <p role="status" className="sr-only">{note}</p>
      </div>
    );
  }
  return (
    <div className={className}>
      <Button type="button" size={size} className="w-full" onClick={click} disabled={disabled}><ShoppingCart className="size-4" aria-hidden /> Add Bundle to Cart</Button>
      <p role="status" className="mt-2 min-h-4 text-center text-xs">{disabled ? reason : note}</p>
    </div>
  );
}
