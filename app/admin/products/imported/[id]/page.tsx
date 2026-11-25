import Link from "next/link";
import { FIELD_NAMES, LOCAL_FIELD_NAMES } from "@/lib/product-fields";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getCategories, autoProductFaqs, type Product } from "@/lib/catalog";
import { cleanFaqs } from "@/lib/catalog-db";
import { PRODUCT_VERIFIED } from "@/lib/product-fields";
import { schema } from "@/lib/db";
import { getProductRow, rowFields, rowSamples, rowFlags, rowPackages, rowRestricted, loadCustomFields } from "@/lib/import/store";
import { EditForm } from "./edit-form";

function fieldsCustomOf(sj: string | null): boolean { try { return !!(JSON.parse(sj || "{}") as { fieldsCustom?: unknown }).fieldsCustom; } catch { return false; } }
function extraNames(sj: string | null): string[] { try { const v = (JSON.parse(sj || "{}") as { extraCategories?: { name?: unknown }[] }).extraCategories; return (Array.isArray(v) ? v : []).flatMap((x) => (typeof x?.name === "string" ? [x.name] : [])); } catch { return []; } }

function storedFaqs(sj: string | null) { try { return cleanFaqs((JSON.parse(sj || "{}") as { faqs?: unknown }).faqs); } catch { return []; } }

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
  const defaults: string[] = r.categorySlug === "local-businesses-database" ? [...LOCAL_FIELD_NAMES] : [...FIELD_NAMES];
  const custom = fieldsCustomOf(r.sourceJson) && rowFields(r).length > 0;
  const pseudo = { name: r.name, fields: custom ? rowFields(r) : defaults, recordCount: r.recordCount, lastVerified: r.lastUpdated && r.lastUpdated > PRODUCT_VERIFIED ? r.lastUpdated : PRODUCT_VERIFIED } as unknown as Product;
  const autoFaqs = autoProductFaqs(pseudo, { singular: r.categoryName } as never, { name: r.countryName } as never).map(([q, a]) => ({ q, a }));
  const savedFields = await loadCustomFields(db);
  const savedFaqs = storedFaqs(r.sourceJson);
  return (
    <>
      <PageHeader title={r.name} text={`${r.status} · ${r.categoryName} · ${r.countryName}${r.region ? ` · ${r.region}` : ""} · /lists/${r.slug}`} actions={<Link href="/admin/products" className="text-sm underline">Back to imported products</Link>} />
      <EditForm savedFields={savedFields} autoFaqs={autoFaqs} defaults={defaults} categories={categories} samples={rowSamples(r)} origin={r.origin} id={r.id} status={r.status} slug={r.slug} restricted={rowRestricted(r)} flags={rowFlags(r)}
        initial={{ faqs: savedFaqs.length ? savedFaqs : autoFaqs, categoryName: r.categoryName, extraCategories: extraNames(r.sourceJson), recordCount: r.recordCount, dataFields: fieldsCustomOf(r.sourceJson) && rowFields(r).length ? rowFields(r).join("\n") : defaults.join("\n"), fieldsCustom: fieldsCustomOf(r.sourceJson), fileFormats: r.fileFormats ?? "", coverage: r.coverage ?? "", lastUpdated: r.lastUpdated ?? "", placeholder: !!r.placeholder, forSale: !!r.forSale, name: r.name, title: r.title, description: r.description, seoTitle: r.seoTitle ?? "", metaDescription: r.metaDescription ?? "", packages: rowPackages(r).map((k) => ({ name: k.name as "Starter" | "Professional" | "Complete", records: k.records, priceUsdCents: k.priceUsdCents, highlighted: !!k.highlighted })) }} />
    </>
  );
}
