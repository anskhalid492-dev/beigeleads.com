"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartCount } from "@/lib/cart/client";

/** Cart icon with the number of lists in it. The count comes from this browser's cart only. */
export function CartHeaderLink({ onClick, withLabel = false }: { onClick?: () => void; withLabel?: boolean }) {
  const n = useCartCount();
  return (
    <Link
      href="/cart"
      onClick={onClick}
      aria-label={n > 0 ? `Cart, ${n} ${n === 1 ? "list" : "lists"}` : "Cart, empty"}
      className={`relative inline-flex items-center gap-2 rounded-full text-forest-900 hover:bg-sand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${withLabel ? "px-3 py-3" : "size-10 justify-center"}`}
    >
      <ShoppingCart className="size-5" aria-hidden />
      {withLabel && <span>Cart</span>}
      {n > 0 && (
        <span className={`grid min-w-5 place-items-center rounded-full bg-forest-900 px-1.5 text-xs font-bold leading-5 text-sand-50 ${withLabel ? "" : "absolute -right-0.5 -top-0.5"}`} aria-hidden>{n}</span>
      )}
    </Link>
  );
}
