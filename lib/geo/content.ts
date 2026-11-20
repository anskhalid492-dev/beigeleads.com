import { fieldSummary } from "@/lib/product-fields";
import type { Category, Country, Product } from "@/lib/catalog";

/** Text for geography pages. Pure. Every number comes from the arguments (real inventory) or is left out. */
export type GeoCopyInput = {
  category: Category;
  country: Country;
  /** The place, or null for the country page. */
  place: { name: string; level: "region" | "city"; parentName?: string } | null;
  product: Product | undefined;
  /** REAL records for this industry in this place; null when no inventory is recorded. */
  records: number | null;
  /** Child places with real counts, biggest first. */
  children: { name: string; records: number }[];
};

const n = (x: number) => x.toLocaleString("en-US");

export function geoCopy(i: GeoCopyInput) {
  const { category: c, country: k, place, product, records, children } = i;
  const where = place ? place.name : k.name;
  const full = place ? (place.parentName ? `${place.name}, ${place.parentName}` : `${place.name}, ${k.name}`) : k.name;
  const h1 = `${where} ${c.singular} Email List`;
  const title = place ? `${h1} | ${full}` : `${h1} | ${c.name} Contact Database`;
  const have = records !== null && records > 0;
  const fields = product ? fieldSummary(product.fields).toLowerCase() : "";
  const kids = children.slice(0, 5).map((x) => `${x.name} (${n(x.records)})`);
  const levelWord = !place ? "country" : place.level === "region" ? "state or region" : "city";

  const description = have
    ? `${c.singular} contacts in ${full}: ${n(records!)} records with ${fields || "business contact details"}. See a masked sample, then pay once.`
    : `${c.name} contact data for ${full}. No separate ${where} inventory is recorded yet: see what exists and request a custom list.`;

  const intro = have
    ? `This page covers ${c.reachLabel} in ${full}. Our records for this ${levelWord} currently hold ${n(records!)} contacts${kids.length ? `, with the most in ${kids.join(", ")}` : ""}. ${product ? `They are part of the ${product.name} for ${k.name}, so you buy one file and filter it to ${where} yourself.` : ""}`
    : `We have not recorded any ${c.singular.toLowerCase()} contacts for ${full} yet, so this page shows the wider ${k.name} list and the places we do cover. If ${where} matters to you, describe it on the custom list page and we will tell you what is possible.`;

  const faqs: [string, string][] = [
    [`What does the ${h1} include?`, product ? `Each record can include ${fields}. The product page lists the exact fields in the file.` : "There is no ready-made list for this place yet. A custom list can include the fields you choose, subject to sourcing."],
    [`How many ${c.singular.toLowerCase()} contacts do you have in ${where}?`, have ? `${n(records!)} records are recorded for ${full} at the moment. The number is updated when we re-verify the data, which we do every 60 days.` : `None are recorded for ${where} at the moment, and we do not estimate. The figure appears here as soon as real records exist.`],
    [`Can I buy only the ${where} contacts?`, product ? `Not as a separate file today. This page is a view of the ${product.name} for ${k.name}: you buy that list once and filter it by ${place ? (place.level === "city" ? "city" : "state or region") : "place"} in Excel or your CRM. If you need a ${where}-only file, request it on the custom list page.` : `Not yet. Request it on the custom list page and we will tell you what is possible.`],
    ...(children.length ? [[`Which places inside ${where} are covered?`, `Places with recorded inventory: ${children.slice(0, 8).map((x) => `${x.name} (${n(x.records)})`).join(", ")}.`] as [string, string]] : []),
    ["How are the emails verified?", "Our team runs SMTP checks and re-verifies all data every 60 days. No check is perfect, so a small share can still bounce. Above a 5% bounce rate our Refund & Returns policy replaces the bounced emails."],
    [`Can I see a sample before buying?`, "Yes. Request a free masked sample by email. Sample files only ever contain masked data."],
  ];
  return { h1, title, description: description.slice(0, 158), intro, faqs, fullName: full, levelWord };
}
