import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminShell } from "@/components/admin/shell";
import { logoutAction } from "./login/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Display only. Every page still calls requireAdmin() itself and fails closed.
  let email: string | null = null;
  try { email = (await requireAdmin()).email; } catch { /* not signed in: the page redirects */ }
  return <AdminShell email={email} logout={logoutAction}>{children}</AdminShell>;
}
