import Link from "next/link";
import { Check } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AddToCartButton } from "@/components/cart/add-button";
import { formatUsd, offeredPackages, type Product } from "@/lib/catalog";
import { getPublicPromos, shownPrice } from "@/lib/promos/public";
import { PromoBanner } from "@/components/promos/banner";

export async function ProductPricing({ product, forSale }: { product: Product; forSale: boolean }) {
  // Promotions only change what is SHOWN here; the cart and checkout re-price everything on the server.
  const promos = await getPublicPromos(getCloudflareContext().env).catch(() => []);
  if (!offeredPackages(product).length) {
    return (
      <section id="pricing" className="scroll-mt-20 bg-sand-100 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="display text-5xl text-forest-900 sm:text-6xl">{product.name} pricing</h2>
          <p className="mt-4 max-w-xl text-lg">Packages for this list are not set yet. Request a free sample and we will tell you when they are.</p>
        </div>
      </section>
    );
  }
  return (
    <section id="pricing" className="scroll-mt-20 bg-sand-100 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="display max-w-3xl text-5xl text-forest-900 sm:text-6xl">{product.name} pricing: pick a package, pay once</h2>
        <p className="mt-4 max-w-2xl text-lg">
          <strong className="text-forest-900">One-time payment. No subscription.</strong> You pay in crypto, download your file and keep it. No account needed.
        </p>

        <PromoBanner place="product" slug={product.slug} className="mt-6" />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {offeredPackages(product).map((pk) => {
            const dark = pk.highlighted;
            const sp = shownPrice(promos, { slug: product.slug, categorySlug: product.categorySlug }, pk);
            const shown = sp.auto ?? sp.code;
            const per1000 = pk.records > 0 ? (pk.priceUsdCents / 100 / (pk.records / 1000)).toFixed(2) : "";
            return (
              <div
                key={pk.name}
                className={`flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-1 ${
                  dark
                    ? "bg-forest-900 text-sand-100 shadow-[0_30px_60px_-25px_rgba(15,42,29,0.8)] lg:-my-4 lg:py-12"
                    : "border border-sand-300 bg-sand-50"
                }`}
              >
                <h3 className={`text-lg font-semibold ${dark ? "text-forest-300" : "text-forest-500"}`}>{pk.name}</h3>
                {pk.records > 0 ? (
                  <>
                    <p className={`display mt-3 text-6xl ${dark ? "text-sand-50" : "text-forest-900"}`}>{pk.records.toLocaleString("en-US")}</p>
                    <p className="mt-1">records</p>
                  </>
                ) : (
                  <p className={`display mt-3 text-5xl ${dark ? "text-sand-50" : "text-forest-900"}`}>Full list</p>
                )}
                {shown ? (
                  <div className="mt-6">
                    <p className="text-sm">Original: <s>{formatUsd(shown.originalCents)}</s></p>
                    <p className={`display text-5xl ${dark ? "text-sand-50" : "text-forest-900"}`}><span className="sr-only">Now </span>{formatUsd(shown.nowCents)}</p>
                    <p className="mt-1 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                      Save {shown.savePercent}% ({formatUsd(shown.saveCents)}){shown.code ? ` with code ${shown.code}` : ", applied automatically"}
                    </p>
                  </div>
                ) : (
                  <p className={`display mt-6 text-5xl ${dark ? "text-sand-50" : "text-forest-900"}`}>{formatUsd(pk.priceUsdCents)}</p>
                )}
                <p className="mt-1 text-sm">{pk.records > 0 ? `$${per1000} per 1,000 records. ` : ""}Paid once.</p>
                <ul className="mt-6 flex-1 space-y-3 text-sm">
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{product.fields.length} fields: {product.fields.join(", ")}</li>
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />{product.fileFormats?.trim() || "CSV, Excel or TXT"} file</li>
                  <li className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-forest-500" aria-hidden />Download link by email, unlimited downloads</li>
                </ul>
                <AddToCartButton slug={product.slug} pkg={pk.name} variant={dark ? "primary" : "secondary"} className="mt-8" label="Get This Package" />
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-sm">
          Not sure which size? <Link href={`/sample?product=${product.slug}`} className="font-semibold text-forest-900 underline underline-offset-4">Get a free sample first</Link>, or{" "}
          <Link href="/custom-list" className="font-semibold text-forest-900 underline underline-offset-4">ask for a custom list</Link>.
          {!forSale && " Package sizes and prices shown here are placeholders, and checkout is not open yet."}
        </p>
      </div>
    </section>
  );
}
