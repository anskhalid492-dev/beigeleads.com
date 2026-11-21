// Database Bundles: the data the public pages show. Published bundles only, priced from the live catalog by the same pure code as the cart.
import { getDbFromEnv } from "@/lib/db";
import { hydrateCatalog } from "@/lib/catalog-db";
import { loadCategories, loadPublished } from "./store";
import { priceBundle, type BundleContext, type PricedBundle } from "./pricing";

export const ctxOf = (env: CloudflareEnv): BundleContext => ({ checkoutOpen: env.CHECKOUT_ENABLED === "true", allowPlaceholder: env.CHECKOUT_ALLOW_PLACEHOLDER === "true" });

/** True when every list in the bundle can really be sold (checkout being closed does not matter for showing it). */
export const showable = (b: PricedBundle) => b.components.length >= 2 && b.components.every((c) => c.available) && b.priceCents < b.listCents;

export async function loadBundlesView(env: CloudflareEnv) {
  await hydrateCatalog(env);
  const ctx = ctxOf(env);
  const defs = await loadPublished(env);
  const all = defs.map((d) => priceBundle(d, ctx)).filter(showable);
  const cats = (await loadCategories(getDbFromEnv(env))).filter((c) => all.some((b) => b.categorySlug === c.slug));
  return { bundles: all, categories: cats };
}

export async function loadBundleView(env: CloudflareEnv, slug: string) {
  await hydrateCatalog(env);
  const def = (await loadPublished(env)).find((d) => d.slug === slug);
  if (!def) return null;
  const priced = priceBundle(def, ctxOf(env));
  const related = (await loadBundlesView(env)).bundles.filter((b) => b.slug !== slug).sort((a, b) => Number(b.categorySlug === def.categorySlug) - Number(a.categorySlug === def.categorySlug)).slice(0, 3);
  return { def, bundle: priced, related };
}
