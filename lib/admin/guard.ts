import { redirect } from "next/navigation";
import { requireAdmin } from "./require-admin";

/** Page guard: sends the visitor to the admin login instead of showing a 404 for session problems. */
export async function guardAdmin() {
  try { return await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
}
