"use client";
import { usePathname } from "next/navigation";

/** The public header/footer are not shown inside the admin area, which has its own shell. */
export function PublicChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path === "/admin" || path.startsWith("/admin/")) return null;
  return <>{children}</>;
}
