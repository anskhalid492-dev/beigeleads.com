// Owner decision (20 Nov 2026): every product page states the same 40+ field catalog, "18 November 2026" as last verified and 95% accuracy.
export const PRODUCT_VERIFIED = "2026-11-18";
export const PRODUCT_ACCURACY = 95;

export type FieldGroup = "Business" | "Location" | "Contact" | "Online presence" | "Operations" | "Google listing";
export const FIELD_GROUPS: readonly FieldGroup[] = ["Business", "Location", "Contact", "Online presence", "Operations"];
export const ALL_FIELD_GROUPS: readonly FieldGroup[] = [...FIELD_GROUPS, "Google listing"];

const g = (group: FieldGroup, rows: [string, string][]) => rows.map(([name, text]) => ({ name, group, text }));

export const FIELD_CATALOG = [
  ...g("Business", [
    ["Business name", "The registered or trading name of the business."],
    ["Legal name", "Legal entity name where one is published."],
    ["Business category", "The main category the business operates in."],
    ["Sub-category", "A more specific niche within the category."],
    ["Business description", "A short description of what the business does."],
    ["Year founded", "The year the business started, when published."],
    ["Employee count range", "Size band by number of employees."],
    ["Revenue range", "Estimated annual revenue band."],
    ["Ownership type", "Independent, franchise or chain."],
    ["Registration number", "Company registry number where public."],
    ["Owner name", "Owner or decision maker name, when found."],
    ["Contact job title", "Role of the named contact."],
  ]),
  ...g("Location", [
    ["Address", "Full street address of the business."],
    ["Street", "Street line, split out for filtering."],
    ["City", "City, so you can buy or filter by place."],
    ["State or region", "State, province or region."],
    ["Postal code", "ZIP or postal code."],
    ["Country", "Country the business operates in."],
    ["Latitude", "Map latitude of the location."],
    ["Longitude", "Map longitude of the location."],
    ["Time zone", "Local time zone for scheduling outreach."],
  ]),
  ...g("Contact", [
    ["Phone", "Business phone number."],
    ["Mobile phone", "Mobile number where published."],
    ["Email", "Business email address, checked by our team."],
    ["Secondary email", "A second email, when one is found."],
    ["Email type", "Generic (info@) or named mailbox."],
    ["Email verification status", "Result of our email check."],
    ["Fax", "Fax number where published."],
    ["Contact page URL", "Link to the business's contact page."],
  ]),
  ...g("Online presence", [
    ["Website", "The business's own website."],
    ["Website domain", "Root domain, ready for matching."],
    ["Website technology", "Main platform or tools the site uses."],
    ["Facebook", "Facebook page link."],
    ["Instagram", "Instagram profile link."],
    ["LinkedIn", "LinkedIn company page link."],
    ["X (Twitter)", "X profile link."],
    ["YouTube", "YouTube channel link."],
    ["Google Maps link", "Link to the Google Maps listing."],
    ["Rating", "Public review rating, when listed."],
    ["Review count", "Number of public reviews."],
  ]),
  ...g("Operations", [
    ["Opening hours", "Published opening hours."],
    ["Languages", "Languages the business serves."],
    ["Payment methods", "Accepted payment methods."],
    ["Services offered", "Main services or products."],
    ["Business status", "Open, closed or unverified."],
    ["Number of locations", "How many sites the business runs."],
    ["Last verified date", "When the record was last checked."],
    ["Source type", "Where the record was collected from."],
  ]),
] as const;

// Owner decision (23 Nov 2026): local business lists carry this field set (64 fields).
export const LOCAL_FIELD_CATALOG = [
  ...g("Business", [
    ["Business Name", "Name of the business as listed."],
    ["Pricing", "Price level shown on the listing."],
    ["Description", "Description from the business listing."],
    ["Summary", "Short summary of the business."],
    ["First Category", "Main business category."],
    ["Second Category", "Second category, when listed."],
    ["Claimed GMB", "Whether the Google listing is claimed."],
    ["Price", "Price range symbol, when listed."],
    ["Business Status", "Open, closed or temporarily closed."],
    ["Uuid", "Unique record identifier."],
    ["Offerings", "Products or services offered."],
    ["From the Business", "Text the business wrote about itself."],
  ]),
  ...g("Location", [
    ["Full Address", "Complete address on one line."],
    ["Street Address", "Street line of the address."],
    ["City", "City of the business."],
    ["Zip", "ZIP or postal code."],
    ["Municipality", "Municipality or locality."],
    ["State", "State or region."],
    ["Country", "Country of the business."],
    ["Timezone", "Local time zone."],
    ["Latitude", "Map latitude."],
    ["Longitude", "Map longitude."],
    ["Coordinates", "Latitude and longitude together."],
    ["Plus Code", "Google Plus Code for the location."],
  ]),
  ...g("Contact", [
    ["Phone 1", "Main phone number."],
    ["Phone Standard Format", "Phone number in a standard international format."],
    ["Phone Numbers", "All phone numbers found."],
    ["Email", "Business email address."],
  ]),
  ...g("Online presence", [
    ["Website", "The business's website."],
    ["Domain", "Root domain of the website."],
    ["Image URL", "Main listing image link."],
    ["Favicon", "Website icon link."],
    ["Facebook URL", "Facebook page link."],
    ["LinkedIn URL", "LinkedIn page link."],
    ["Twitter URL", "X (Twitter) profile link."],
    ["Instagram URL", "Instagram profile link."],
    ["Meta Description", "Meta description of the website."],
    ["Meta Keywords", "Meta keywords of the website."],
    ["YouTube URL", "YouTube channel link."],
    ["Yelp URL", "Yelp page link."],
  ]),
  ...g("Operations", [
    ["Hours", "Opening hours summary."],
    ["Saturday", "Opening hours on Saturday."],
    ["Sunday", "Opening hours on Sunday."],
    ["Monday", "Opening hours on Monday."],
    ["Tuesday", "Opening hours on Tuesday."],
    ["Wednesday", "Opening hours on Wednesday."],
    ["Thursday", "Opening hours on Thursday."],
    ["Friday", "Opening hours on Friday."],
    ["Menu Link", "Link to the menu, when listed."],
    ["Reserve a Table", "Reservation link, when listed."],
    ["Accessibility", "Accessibility features listed."],
    ["Amenities", "Amenities listed."],
    ["Service Options", "Service options such as dine-in or delivery."],
    ["Payments", "Accepted payment methods."],
    ["Crowd", "Customer crowd details listed."],
    ["Planning", "Planning details listed, such as booking."],
  ]),
  ...g("Google listing", [
    ["Reviews Count", "Number of public reviews."],
    ["Average Rating", "Average public review rating."],
    ["Place ID", "Google Place ID."],
    ["GMB URL", "Link to the Google Business listing."],
    ["CID", "Google customer ID of the listing."],
    ["Google Knowledge URL", "Google Knowledge Panel link."],
    ["Kgmid", "Google Knowledge Graph ID."],
    ["Review URL", "Link to the reviews page."],
  ]),
] as const;
export const LOCAL_FIELD_NAMES: readonly string[] = LOCAL_FIELD_CATALOG.map((f) => f.name);
export const LOCAL_FIELD_COUNT = LOCAL_FIELD_NAMES.length;

export const FIELD_NAMES: readonly string[] = FIELD_CATALOG.map((f) => f.name);

/** Short field text for cards and meta descriptions: the first few names and how many more. */
export function fieldSummary(fields: readonly string[], n = 6): string {
  return fields.length <= n ? fields.join(", ") : `${fields.slice(0, n).join(", ")} and ${fields.length - n} more`;
}
