// Owner decision (20 Nov 2026): every product page states the same 40+ field catalog, "18 November 2026" as last verified and 95% accuracy.
export const PRODUCT_VERIFIED = "2026-11-18";
export const PRODUCT_ACCURACY = 95;

export type FieldGroup = "Business" | "Location" | "Contact" | "Online presence" | "Operations";
export const FIELD_GROUPS: readonly FieldGroup[] = ["Business", "Location", "Contact", "Online presence", "Operations"];

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
    ["Email verification status", "Result of our in-house SMTP check."],
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

export const FIELD_NAMES: readonly string[] = FIELD_CATALOG.map((f) => f.name);

/** Short field text for cards and meta descriptions: the first few names and how many more. */
export function fieldSummary(fields: readonly string[], n = 6): string {
  return fields.length <= n ? fields.join(", ") : `${fields.slice(0, n).join(", ")} and ${fields.length - n} more`;
}
