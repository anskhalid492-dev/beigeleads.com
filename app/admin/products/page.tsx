import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge, Empty, PageHeader, Panel, usd } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getCategory, getCountry, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  try { await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const products = getProducts();
  return (
    <>
      <PageHeader title="Products" actions={<span className="flex gap-4 text-sm"><Link href="/admin/products/import" className="underline">Import products</Link><Link href="/admin/products/imported" className="underline">Imported products</Link></span>} text="The catalog lives in code (lib/catalog.ts), so products are read-only here. Changes to names, counts and prices are made in code and deployed. Delivery links are managed on the Delivery Links page." />
      <Panel>
        {products.length === 0 ? <Empty title="No products yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-sand-100 text-xs font-bold text-forest-900"><tr>
                <th className="px-4 py-3">Product</th><th className="px-4 py-3">Industry</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Records</th><th className="px-4 py-3">Packages and prices</th><th className="px-4 py-3">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-sand-200">
                {products.map((p) => (
                  <tr key={p.slug}>
                    <td className="px-4 py-3 font-semibold text-forest-900">{p.name}</td>
                    <td className="px-4 py-3">{getCategory(p.categorySlug)?.name ?? p.categorySlug}</td>
                    <td className="px-4 py-3">{getCountry(p.countrySlug)?.name ?? p.countrySlug}</td>
                    <td className="px-4 py-3">{p.recordCount?.toLocaleString("en-US") ?? "—"}</td>
                    <td className="px-4 py-3"><ul className="space-y-0.5">{p.packages.map((k) => <li key={k.name}>{k.name}: {k.records.toLocaleString("en-US")} · {usd(k.priceUsdCents)}</li>)}</ul></td>
                    <td className="px-4 py-3"><div className="flex flex-col items-start gap-1"><Badge tone={p.status === "live" ? "good" : "warn"}>{p.status === "live" ? "Live" : "Draft"}</Badge>{p.placeholderData && <Badge tone="info">Placeholder data</Badge>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
