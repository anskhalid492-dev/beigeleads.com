// Catalog access layer. TEMPORARY: reads static placeholder data.
// When D1 has real data, re-implement these functions with getDb() and keep the signatures,
// so pages do not change. Tracked in TODO-BEFORE-LAUNCH.md.

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  description: string;
  buyers: readonly string[];
};

export type Country = { slug: string; code: string; name: string };
export type City = { slug: string; name: string; countrySlug: string };

export type Product = {
  slug: string;
  categorySlug: string;
  countrySlug: string;
  title: string;
  // null means "not known yet". Never show an invented number.
  recordCount: number | null;
  lastVerified: string | null;
  status: "draft" | "live";
  fields: readonly string[];
};

export const FIELDS = [
  "Business name",
  "Address",
  "City",
  "Country",
  "Phone",
  "Email",
  "Website",
] as const;

const categories: readonly Category[] = [
  {
    slug: "dentists",
    name: "Dentists",
    blurb: "Practices and clinics",
    description: "Contact details for dental practices and clinics.",
    buyers: ["Dental equipment suppliers", "Practice-software vendors", "Marketing agencies", "Recruiters"],
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    blurb: "Restaurants, cafés and bars",
    description: "Contact details for restaurants, cafés, bars and bakeries.",
    buyers: ["Food and drink suppliers", "POS and delivery software", "Local marketing agencies", "Equipment sellers"],
  },
  {
    slug: "ski-shops",
    name: "Ski shops",
    blurb: "Retail, rental and repair",
    description: "Contact details for ski and snowboard retailers, rental shops and repair services.",
    buyers: ["Outdoor-gear brands", "Wholesalers", "Seasonal marketing agencies", "Rental-software vendors"],
  },
];

const countries: readonly Country[] = [{ slug: "us", code: "US", name: "United States" }];

const cities: readonly City[] = [
  { slug: "denver", name: "Denver", countrySlug: "us" },
  { slug: "chicago", name: "Chicago", countrySlug: "us" },
];

const products: readonly Product[] = categories.map((c) => ({
  slug: `${c.slug}-us`,
  categorySlug: c.slug,
  countrySlug: "us",
  title: `${c.name} in the United States`,
  recordCount: null,
  lastVerified: null,
  status: "draft" as const,
  fields: FIELDS,
}));

export const getCategories = () => categories;
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const getCountries = () => countries;
export const getCountry = (slug: string) => countries.find((c) => c.slug === slug);
export const getCities = (countrySlug: string) => cities.filter((c) => c.countrySlug === countrySlug);
export const getCity = (countrySlug: string, slug: string) =>
  cities.find((c) => c.countrySlug === countrySlug && c.slug === slug);
export const getProducts = (categorySlug?: string) =>
  categorySlug ? products.filter((p) => p.categorySlug === categorySlug) : products;
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const getProductFor = (categorySlug: string, countrySlug: string) =>
  products.find((p) => p.categorySlug === categorySlug && p.countrySlug === countrySlug);
