/**
 * Slugs of case studies that are REAL, documented customer stories published with the customer's written permission.
 * Every other case study is shown with the label "Illustrative use case" (a composite scenario, not a customer report).
 * Empty today: no customer outcomes have been documented yet. Do not add a slug without that evidence.
 */
export const REAL_CUSTOMER_SLUGS: ReadonlySet<string> = new Set<string>();
export const isIllustrative = (slug: string) => !REAL_CUSTOMER_SLUGS.has(slug);

export const CASE_CTA = {
  title: "Explore business email lists",
  text: "Browse ready-made databases by industry and location, and look at a masked sample before you decide.",
  label: "Explore Databases",
  href: "/lists",
};
