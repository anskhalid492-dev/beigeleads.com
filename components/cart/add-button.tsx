"use client";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_CART_ITEMS } from "@/lib/cart/model";
import { cartActions, useCart } from "@/lib/cart/client";
import { trackCart } from "@/lib/cart/track";

/** Adds one package to the cart. A list can be in the cart only once: adding it again switches the package instead of duplicating it. */
export function AddToCartButton({ slug, pkg, variant = "primary", size = "lg", className = "", label }: { slug: string; pkg: string; variant?: "primary" | "secondary"; size?: "sm" | "md" | "lg"; className?: string; label?: string }) {
  const cart = useCart();
  const [note, setNote] = useState("");
  const line = cart.find((i) => i.slug === slug);
  const same = line?.pkg === pkg;

  function click() {
    const r = cartActions.add(slug, pkg);
    if (r === "full") { setNote(`Your cart holds up to ${MAX_CART_ITEMS} lists. Check out or remove one first.`); return; }
    setNote(r === "updated" ? "Package changed in your cart." : "Added to your cart.");
    trackCart("add_to_cart", cart.length + (r === "added" ? 1 : 0));
  }

  if (same) {
    return (
      <div className={className}>
        <Button type="button" variant="secondary" size={size} className="w-full" asChild>
          <Link href="/cart"><Check className="size-4" aria-hidden /> In your cart. View cart</Link>
        </Button>
        <p role="status" className="sr-only">{note}</p>
      </div>
    );
  }
  return (
    <div className={className}>
      <Button type="button" variant={variant} size={size} className="w-full" onClick={click}>
        <ShoppingCart className="size-4" aria-hidden /> {label ?? (line ? "Switch to this package" : "Add to cart")}
      </Button>
      <p role="status" className="mt-2 min-h-5 text-center text-xs">{note}</p>
    </div>
  );
}
