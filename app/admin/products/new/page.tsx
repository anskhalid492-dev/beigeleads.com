import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getCategories, getCountries } from "@/lib/catalog";
import { getDbFromEnv, schema } from "@/lib/db";
import { NewForm } from "./new-form";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  await guardAdmin();
  const db = getDbFromEnv(getCloudflareContext().env);
  const cats = new Set(getCategories().map((c) => c.name));
  const countries = new Map(getCountries().map((c) => [c.name, c.code]));
  try {
    for (const r of await db.selectDistinct({ c: schema.catalogProducts.categoryName, n: schema.catalogProducts.countryName, k: schema.catalogProducts.countryCode }).from(schema.catalogProducts)) { cats.add(r.c); countries.set(r.n, r.k); }
  } catch { /* migrations not applied */ }
  return (
    <>
      <PageHeader title="New product" text="Creates a DRAFT. Add a delivery link in Delivery links, then publish it from the product list." actions={<Link href="/admin/products" className="text-sm underline">Back to products</Link>} />
      <NewForm categories={[...cats].sort()} countries={[...countries.entries()].map(([name, code]) => ({ name, code })).sort((a, b) => a.name.localeCompare(b.name))} />
    </>
  );
}
