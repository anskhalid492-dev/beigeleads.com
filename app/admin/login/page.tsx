import { notFound } from "next/navigation";
import { requireAccess } from "@/lib/admin/require-admin";
import { LoginForm } from "./form";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  let who;
  try { who = await requireAccess(); } catch { notFound(); }
  return (
    <div className="mx-auto max-w-md">
      <h1 className="display text-4xl text-forest-900">Admin sign in</h1>
      <p className="mt-2 mb-6">Cloudflare Access verified {who.email}. Enter your password and authenticator code to continue. Sessions last 15 minutes.</p>
      <LoginForm />
    </div>
  );
}
