import { redirect } from "next/navigation";

// The product manager moved to /admin/products (Nov 2026).
export default async function Moved({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = new URLSearchParams(Object.entries(await searchParams).filter(([, v]) => v) as [string, string][]).toString();
  redirect(`/admin/products${q ? `?${q}` : ""}`);
}
