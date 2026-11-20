import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { catalogLite } from "../catalog";
import { PromoForm } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New promotion", robots: { index: false, follow: false } };

export default async function NewPromotionPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  return (
    <>
      <PageHeader title="Create promotion" text="Everything you set here is enforced on the server at checkout. Nothing is live until you set the status to Active." />
      <PromoForm catalog={catalogLite()} />
    </>
  );
}
