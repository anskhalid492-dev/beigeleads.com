import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">
      <nav aria-label="Admin" className="mb-6 flex gap-4 text-sm font-semibold text-forest-900">
        <Link href="/admin/wallets" prefetch={false} className="underline">Wallets</Link>
        <Link href="/admin/delivery" prefetch={false} className="underline">Delivery</Link>
        <Link href="/admin/orders" prefetch={false} className="underline">Orders</Link>
      </nav>
      {children}
    </div>
  );
}
