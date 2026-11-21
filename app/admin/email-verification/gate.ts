import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
export const gate = async () => { try { return await requireAdmin(); } catch (e) { const m = e instanceof Error ? e.message : ""; redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`); } };
