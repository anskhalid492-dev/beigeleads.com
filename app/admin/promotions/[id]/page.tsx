import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getDb, schema } from "@/lib/db";
import { epochToZoned } from "@/lib/promos/admin";
import { rowToPromo } from "@/lib/promos/store";
import { catalogLite } from "../catalog";
import { PromoForm, type FormState } from "../form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit promotion", robots: { index: false, follow: false } };

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [row] = await getDb().select().from(schema.promotions).where(eq(schema.promotions.id, id)).catch(() => []);
  if (!row) notFound();
  const p = rowToPromo(row);
  const initial: FormState = {
    name: p.name, title: p.title, description: p.description, kind: p.kind, value: p.kind === "fixed" ? String(p.value / 100) : String(p.value),
    mode: p.automatic ? "automatic" : "code", code: p.code ?? "", productSlugs: p.productSlugs, categorySlugs: p.categorySlugs, packageNames: p.packageNames,
    minCart: p.minCartCents ? String(p.minCartCents / 100) : "", maxDiscount: p.maxDiscountCents ? String(p.maxDiscountCents / 100) : "",
    startsLocal: epochToZoned(p.startsAt, row.timezone), endsLocal: epochToZoned(p.endsAt, row.timezone), timezone: row.timezone,
    usageLimit: p.usageLimit ? String(p.usageLimit) : "", perCustomerLimit: p.perCustomerLimit ? String(p.perCustomerLimit) : "",
    eligibility: p.partnerOnly ? "partners" : p.firstPurchaseOnly ? "first" : "everyone", combinable: p.combinable, bannerPlaces: p.bannerPlaces, status: p.status,
  };
  return (
    <>
      <PageHeader title={`Edit: ${p.name}`} text="Changes apply to new carts and checkouts right away. Orders already created keep the price they were quoted." />
      <PromoForm catalog={catalogLite()} initial={initial} id={id} />
    </>
  );
}
