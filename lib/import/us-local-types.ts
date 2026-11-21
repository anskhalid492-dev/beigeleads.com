// US local-business landing pages (section 137). Pure: one entry per local-business type. Creates NO data: counts, delivery links
// and publishing stay with the owner. Names/SEO text use only the type itself (no counts, accuracy or price claims).
import { FIELD_NAMES, PRODUCT_VERIFIED } from "@/lib/product-fields";
import { LOCAL_NAME } from "@/lib/import/local-business";
import type { NewProduct } from "@/lib/import/store";

/** [singular label, plural audience used in the list name] grouped like the category page industries. */
export const US_LOCAL_TYPES: { industry: string; types: string[] }[] = [
  { industry: "Restaurants, cafes and bars", types: ["Restaurants", "Cafes and Coffee Shops", "Bars and Pubs", "Bakeries", "Pizzerias", "Food Trucks and Caterers", "Breweries", "Ice Cream Shops", "Juice Bars and Smoothie Shops", "Delis and Sandwich Shops", "Wineries and Wine Bars", "Donut Shops"] },
  { industry: "Hotels and hospitality", types: ["Hotels and Motels", "Bed and Breakfasts", "Vacation Rental Companies", "Hostels", "Campgrounds and RV Parks", "Event Venues and Banquet Halls"] },
  { industry: "Salons, barbers and spas", types: ["Hair Salons", "Barber Shops", "Nail Salons", "Day Spas", "Massage Therapy Clinics", "Tattoo Studios", "Eyebrow and Lash Studios", "Waxing Studios", "Medical Spas"] },
  { industry: "Gyms and fitness studios", types: ["Gyms and Fitness Centers", "Yoga and Pilates Studios", "Martial Arts Schools", "Dance Studios", "CrossFit Gyms", "Personal Trainers", "Boxing Gyms"] },
  { industry: "Dentists, chiropractors, vets and pharmacies", types: ["Dentists", "Chiropractors", "Veterinary Clinics", "Pet Groomers", "Pharmacies", "Optometrists and Eye Care Clinics", "Physical Therapy Clinics", "Urgent Care Clinics", "Dermatology Clinics", "Acupuncture Clinics", "Pet Stores", "Animal Hospitals", "Orthodontists", "Counseling Practices"] },
  { industry: "Home services and trades", types: ["Plumbers", "Electricians", "HVAC Contractors", "Roofing Contractors", "Locksmiths", "Painters", "Flooring Installers", "Handyman Services", "Pool Service Companies", "Garage Door Companies", "Window Installers", "Carpet Cleaners", "Appliance Repair Companies", "Remodeling Contractors", "Fence Contractors", "Concrete Contractors", "Siding Contractors", "General Contractors"] },
  { industry: "Cleaning, landscaping and pest control", types: ["Cleaning Services", "Landscapers and Lawn Care Companies", "Pest Control Companies", "Tree Service Companies", "Moving Companies", "Pressure Washing Companies", "Janitorial Services", "Maid Services", "Junk Removal Companies", "Window Cleaning Companies"] },
  { industry: "Auto repair, car washes and dealerships", types: ["Auto Repair Shops", "Car Washes", "Car Dealerships", "Tire Shops", "Auto Body Shops", "Towing Companies", "Auto Parts Stores", "Used Car Dealers", "Motorcycle Dealers", "Oil Change Shops", "Auto Detailing Shops"] },
  { industry: "Local retail stores", types: ["Grocery and Convenience Stores", "Florists", "Boutiques and Clothing Stores", "Furniture Stores", "Jewelry Stores", "Liquor Stores", "Bookstores and Gift Shops", "Pawn Shops", "Thrift Stores", "Antique Shops", "Pet Supply Stores", "Hardware Stores", "Sporting Goods Stores"] },
  { industry: "Real estate agencies and property managers", types: ["Real Estate Agencies", "Property Management Companies", "Real Estate Brokers", "Title and Escrow Companies"] },
  { industry: "Local accounting, legal and insurance offices", types: ["Accountants and CPAs", "Tax Preparers", "Law Firms", "Insurance Agencies", "Mortgage Brokers", "Financial Advisors", "Notaries", "Bookkeeping Services", "Immigration Attorneys", "Personal Injury Lawyers"] },
  { industry: "Other local service businesses", types: ["Child Care Centers", "Driving Schools", "Tutoring Centers", "Funeral Homes", "Laundromats and Dry Cleaners", "Photographers", "Print Shops", "Travel Agencies", "Self Storage Facilities", "Preschools", "Music Schools", "Wedding Planners", "Event Planners", "Sign Shops", "Tailors and Alterations", "Interior Designers", "Architects", "Arborists", "Art Galleries", "Auction Houses"] },
];

export const allUsTypes = () => US_LOCAL_TYPES.flatMap((g) => g.types.map((t) => ({ industry: g.industry, type: t })));

const PACKAGES = [
  { name: "Starter" as const, records: 100_000, priceUsdCents: 9900 },
  { name: "Professional" as const, records: 1_000_000, priceUsdCents: 19900, highlighted: true },
  { name: "Complete" as const, records: 5_000_000, priceUsdCents: 29900 },
];

/** One draft product for a type: no count yet (owner adds it), 3 packages, placeholder until the owner confirms. */
export function usLocalProduct(type: string): NewProduct {
  const name = `${type} Email List in the United States`;
  return {
    name, title: name,
    description: `A ready-made list of ${type.toLowerCase()} in the United States, with business name, address, phone, email and website. See a masked sample first, then pay once and receive the file in CSV, Excel or TXT.`,
    seoTitle: `${type} Email List USA | BeigeLeads`.slice(0, 62),
    metaDescription: `Buy a one-time ${type.toLowerCase()} email list for the United States. See a masked sample first, pay once and download in CSV, Excel or TXT.`.slice(0, 158),
    categoryName: LOCAL_NAME, countryName: "United States", countryCode: "US", region: "", channel: "business-email",
    recordCount: null, dataFields: [...FIELD_NAMES].slice(0, 40), fileFormats: "CSV, Excel or TXT", coverage: "United States", lastUpdated: PRODUCT_VERIFIED,
    placeholder: true, forSale: false, packages: PACKAGES,
  };
}
