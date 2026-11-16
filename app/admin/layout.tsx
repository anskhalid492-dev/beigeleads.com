import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8">{children}</div>;
}
