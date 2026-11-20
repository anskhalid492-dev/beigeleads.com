import { SITE_URL } from "@/lib/site";
import { startingPriceCents, type Category, type Country, type Product } from "@/lib/catalog";

/** "the United States" but "Germany". Used inside sentences. */
export const withThe = (k: Country) => (/^united /i.test(k.name) ? `the ${k.name}` : k.name);
const short = (k: Country) => (k.code === "US" ? "USA" : k.name);

/** Title (the layout adds " | BeigeLeads"). Keyword first, no counts or prices. */
export const productTitle = (p: Product, k: Country) => `${p.name} ${short(k)}: Buy Verified Contacts`;

export function productMetaDescription(p: Product, c: Category, k: Country) {
  const fields = ["email", "phone", "address", "website"].filter((f) => p.fields.some((x) => x.toLowerCase() === f));
  const list = fields.length ? fields.join(", ") : "contact details";
  return `Buy the ${p.name} for ${withThe(k)}: ${c.reachLabel} with ${list}. Masked sample first, one-time crypto payment, CSV, Excel or TXT.`;
}

/** Original, honest overview copy. Built only from catalog facts (no counts, no accuracy, no prices). */
export function productOverview(p: Product, c: Category, k: Country) {
  const s = c.singular.toLowerCase();
  const fields = p.fields.map((f) => f.toLowerCase());
  const fieldText = fields.length > 1 ? `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}` : fields[0] ?? "contact details";
  return {
    heading: `About the ${p.name}`,
    paragraphs: [
      `The ${p.name} is a ready-made ${s} email database for ${withThe(k)}. Each record is one business, with ${fieldText} where the business publishes them. Use it as a ${s} mailing list for cold email outreach, phone campaigns, direct mail or market research, without finding ${c.reachLabel} one by one.`,
      `You pay once and keep the file in CSV, Excel or TXT. There is no subscription and no account. Before you buy, check the masked sample on this page or request a free sample by email.`,
    ],
    // Links are written in the component so they stay real routes.
    s,
  };
}

export function productJsonLd(p: Product, c: Category, k: Country, forSale: boolean) {
  const url = `${SITE_URL}/product/${p.slug}`;
  const start = startingPriceCents(p);
  const priced = forSale && !p.placeholderData && start !== null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: productMetaDescription(p, c, k),
    url,
    category: `${c.name} contact database, ${k.name}`,
    brand: { "@type": "Brand", name: "BeigeLeads" },
    // Prices are published only when real (never placeholders).
    ...(priced && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "USD",
        lowPrice: (start / 100).toFixed(2),
        offerCount: p.packages.length,
        availability: "https://schema.org/InStock",
        url,
      },
    }),
  };
}
