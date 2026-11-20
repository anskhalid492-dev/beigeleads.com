// The ten labels that drop into the /lists hero basket. A label links ONLY to a page that exists:
// a catalog industry page, or a published industry-databases subcategory. Anything else stays a plain label.
import { getChild, getGroup, type TaxGroup } from "@/lib/taxonomy";

export type BasketItem = { name: string; icon: "smile" | "utensils" | "house" | "heart" | "cpu" | "bag" | "hardhat" | "landmark" | "bed" | "megaphone"; industry?: string; tax?: string };
export const BASKET_ITEMS: BasketItem[] = [
  { name: "Dentists", icon: "smile", industry: "dentists" },
  { name: "Restaurants", icon: "utensils", industry: "restaurants" },
  { name: "Real Estate", icon: "house", tax: "real-estate" },
  { name: "Healthcare", icon: "heart", tax: "healthcare" },
  { name: "Technology", icon: "cpu", tax: "technology" },
  { name: "Retail", icon: "bag", tax: "retail" },
  { name: "Construction", icon: "hardhat" },
  { name: "Finance", icon: "landmark", tax: "financial-services" },
  { name: "Hotels", icon: "bed" },
  { name: "Marketing Agencies", icon: "megaphone" },
];

export type BasketLabel = { name: string; icon: BasketItem["icon"]; href: string | null };

export function basketLabels(industries: { slug: string }[], tax: TaxGroup[]): BasketLabel[] {
  const g = getGroup("industry-databases", tax);
  return BASKET_ITEMS.map((i) => {
    let href: string | null = null;
    if (i.industry && industries.some((x) => x.slug === i.industry)) href = `/lists/${i.industry}`;
    else if (i.tax && g && g.published !== false) { const c = getChild(g, i.tax); if (c && c.published !== false) href = `/lists/${g.slug}/${c.slug}`; }
    return { name: i.name, icon: i.icon, href };
  });
}
