import Link from "next/link";
import { Check } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AddToCartButton } from "@/components/cart/add-button";
import { formatUsd, offeredPackages, type Product } from "@/lib/catalog";
import { getPublicPromos, shownPrice } from "@/lib/promos/public";
import { fmtNum } from "./meta";
import { PromoBanner } from "@/components/promos/banner";
import { loadSalesSettings } from "@/lib/sales/settings";

export async function ProductPricing({ product, forSale: _forSale }: { product: Product; forSale: boolean }) {
  const volTiers = await (async () => { try { const { volume: v } = await loadSalesSettings(getCloudflareContext().env); if (!v.enabled || v.excludedProducts.includes(product.slug) || v.excludedCategories.includes(product.categorySlug)) return []; return v.tiers.map((t) => ({ min: t.min, percent: t.percent })); } catch { return []; } })();
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
        <h2 className={`display max-w-3xl text-5xl text-forest-900 sm:text-6xl ${offeredPackages(product).length < 3 ? "mx-auto text-center" : ""}`}>{product.name} pricing: pick a package, pay once</h2>
        <PromoBanner place="product" slug={product.slug} className="mt-6" />

        <div className={`mt-12 grid items-stretch gap-6 ${offeredPackages(product).length === 1 ? "mx-auto max-w-md" : offeredPackages(product).length === 2 ? "mx-auto max-w-3xl lg:grid-cols-2" : "lg:grid-cols-3"}`}>
          {offeredPackages(product).map((pk) => {
            const dark = pk.highlighted;
            const sp = shownPrice(promos, { slug: product.slug, categorySlug: product.categorySlug }, pk);
            const shown = sp.auto ?? sp.code;
            return (
              <div
                key={pk.name}
                className={`flex flex-col rounded-3xl p-8 transition-transform hover:-translate-y-1 ${
                  dark
                    ? "bg-forest-900 text-sand-100 shadow-[0_30px_60px_-25px_rgba(15,42,29,0.8)] lg:-my-4 lg:py-12"
                    : "border border-sand-300 bg-sand-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`rounded-full px-3 py-1 text-sm font-semibold ${dark ? "bg-forest-700 text-forest-100" : "bg-forest-100 text-forest-700"}`}>{pk.name}</h3>
                  {dark && <span className="text-xs font-semibold text-forest-300">Recommended</span>}
                </div>
                {pk.records > 0 ? (
                  <>
                    <p className={`mt-6 flex items-baseline gap-2 ${dark ? "text-sand-50" : "text-forest-900"}`}>
                      <span className="display text-6xl">{fmtNum(pk.records)}</span>
                      <span className="display text-3xl opacity-70">records</span>
                    </p>
                    <div className={`mt-4 h-1.5 overflow-hidden rounded-full ${dark ? "bg-forest-700" : "bg-sand-200"}`} aria-hidden>
                      <div className={`h-full rounded-full ${dark ? "bg-forest-300" : "bg-forest-500"}`} style={{ width: `${Math.max(8, Math.round((pk.records / Math.max(...offeredPackages(product).map((x) => x.records), 1)) * 100))}%` }} />
                    </div>
                  </>
                ) : (
                  <p className={`display mt-6 text-5xl ${dark ? "text-sand-50" : "text-forest-900"}`}>Full list</p>
                )}
                {shown ? (
                  <div className="mt-6">
                    <p className="text-sm">Original: <s>{formatUsd(shown.originalCents)}</s></p>
                    <p className={`display text-5xl ${dark ? "text-sand-50" : "text-forest-900"}`}><span className="sr-only">Now </span>{formatUsd(shown.nowCents)} <span className="text-base font-semibold opacity-70">one-time</span></p>
                    <p className="mt-1 inline-block rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
                      Save {shown.savePercent}% ({formatUsd(shown.saveCents)}){shown.code ? ` with code ${shown.code}` : ", applied automatically"}
                    </p>
                  </div>
                ) : (
                  <p className={`mt-6 flex items-baseline gap-2 ${dark ? "text-sand-50" : "text-forest-900"}`}><span className="display text-5xl">{formatUsd(pk.priceUsdCents)}</span><span className="text-base font-semibold opacity-70">one-time</span></p>
                )}
                <div className={`mt-6 border-t pt-5 ${dark ? "border-forest-700" : "border-sand-300"}`}>
                  <p className={`text-xs font-semibold ${dark ? "text-forest-300" : "text-forest-500"}`}>What you get</p>
                  <ul className="mt-4 flex-1 space-y-3 text-[0.82rem]">
                    {pk.records > 0 && <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span><strong>{pk.records.toLocaleString("en-US")} records</strong> included</span></li>}
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span><strong>{product.fields.length}+ data fields</strong> per record</span></li>
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span>Format: <strong>{product.fileFormats?.trim() || "CSV, Excel or TXT"}</strong></span></li>
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span>Emailed link, <strong>unlimited downloads</strong></span></li>
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span><strong>Refreshed every 90 days</strong></span></li>
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span>Bounced emails replaced</span></li>
                    <li className="flex items-center gap-2.5 whitespace-nowrap"><Check className="size-4 shrink-0 text-forest-500" aria-hidden /><span><strong>Pay once</strong>, you own the list</span></li>
                  </ul>
                </div>
                <AddToCartButton slug={product.slug} pkg={pk.name} variant={dark ? "primary" : "secondary"} className="mt-8" label="Get This Package" />
              </div>
            );
          })}
        </div>

        {volTiers.length > 0 && (
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border border-sand-300 bg-sand-50 px-6 py-4">
            <p className="text-sm font-semibold text-forest-900">Buying more than one list?</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {volTiers.map((t) => (
                <li key={t.min} className="rounded-full bg-forest-100 px-3.5 py-1.5 text-sm font-semibold text-forest-900">{t.min}+ lists <span className="text-forest-500">·</span> {t.percent}% off</li>
              ))}
            </ul>
            <p className="w-full text-center text-xs">Applied automatically in your cart.</p>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="font-semibold text-forest-900">Not sure which size?</span>
          <Link href={`/sample?product=${product.slug}`} className="rounded-full border border-forest-900 px-4 py-2 font-semibold text-forest-900 hover:bg-forest-900 hover:text-sand-50">Get a free sample</Link>
          <Link href="/custom-list" className="rounded-full border border-sand-300 bg-sand-50 px-4 py-2 font-semibold text-forest-900 hover:border-forest-900">Ask for a custom list</Link>
        </div>
      </div>
    </section>
  );
}
