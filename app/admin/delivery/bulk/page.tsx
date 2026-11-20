import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb } from "@/lib/db";
import { existingLinks, linkTargets } from "@/lib/delivery/bulk";
import { Bulk } from "./bulk";

export const dynamic = "force-dynamic";

export default async function BulkLinksPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const db = getDb();
  const [targets, have] = await Promise.all([linkTargets(db), existingLinks(db)]);
  return (
    <>
      <PageHeader title="Bulk delivery links" text="Upload a CSV with one link per product. Works for every product, including drafts that are not published yet." actions={<Link href="/admin/delivery" className="text-sm underline">Back to delivery links</Link>} />
      <Bulk targets={targets} existing={Object.fromEntries([...have.entries()].map(([k, v]) => [k, v]))} />
    </>
  );
}
