import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getCategories } from "@/lib/catalog";
import { schema } from "@/lib/db";
import { getProductRow, rowFields, rowSamples, rowFlags, rowPackages, rowRestricted } from "@/lib/import/store";
import { EditForm } from "./edit-form";

function extraNames(sj: string | null): string[] { try { const v = (JSON.parse(sj || "{}") as { extraCategories?: { name?: unknown }[] }).extraCategories; return (Array.isArray(v) ? v : []).flatMap((x) => (typeof x?.name === "string" ? [x.name] : [])); } catch { return []; } }

export const dynamic = "force-dynamic";

export default async function EditImported({ params }: { params: Promise<{ id: string }> }) {
  await guardAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = getDbFromEnv(getCloudflareContext().env);
  const r = await getProductRow(db, id);
  if (!r) notFound();
  const names = new Set<string>(getCategories().map((c) => c.name));
  for (const c of await db.selectDistinct({ n: schema.catalogProducts.categoryName }).from(schema.catalogProducts)) names.add(c.n);
  const categories = [...names].sort((a, b) => a.localeCompare(b));
  return (
    <>
      <PageHeader title={r.name} text={`${r.status} · ${r.categoryName} · ${r.countryName}${r.region ? ` · ${r.region}` : ""} · /lists/${r.slug}`} actions={<Link href="/admin/products" className="text-sm underline">Back to imported products</Link>} />
      <EditForm categories={categories} samples={rowSamples(r)} origin={r.origin} id={r.id} status={r.status} slug={r.slug} restricted={rowRestricted(r)} flags={rowFlags(r)}
        initial={{ categoryName: r.categoryName, extraCategories: extraNames(r.sourceJson), recordCount: r.recordCount, dataFields: rowFields(r).join("\n"), fileFormats: r.fileFormats ?? "", coverage: r.coverage ?? "", lastUpdated: r.lastUpdated ?? "", placeholder: !!r.placeholder, forSale: !!r.forSale, name: r.name, title: r.title, description: r.description, seoTitle: r.seoTitle ?? "", metaDescription: r.metaDescription ?? "", packages: rowPackages(r).map((k) => ({ name: k.name as "Starter" | "Professional" | "Complete", records: k.records, priceUsdCents: k.priceUsdCents, highlighted: !!k.highlighted })) }} />
    </>
  );
}
