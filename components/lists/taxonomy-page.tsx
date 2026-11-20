import { TaxLanding } from "@/components/category/tax-landing";
import type { ShopProduct } from "@/lib/shop";
import type { TaxChild, TaxGroup } from "@/lib/taxonomy";

type Props = { group: TaxGroup; child?: TaxChild; country?: { slug: string; name: string }; tax: TaxGroup[]; products: ShopProduct[]; industries: { slug: string; name: string }[] };

/** One shopping landing template for a list-type group (/lists/<group>), a subcategory and a subcategory scoped to a country. */
export function TaxonomyPage(props: Props) {
  return <TaxLanding {...props} />;
}
