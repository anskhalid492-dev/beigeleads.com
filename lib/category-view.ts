// Category Pages 2.0 (prototype): one content model, three visual templates (role, industry, place).
// All copy is original and honest: no counts, prices or inventory are claimed here. Numbers and prices only
// ever come from the catalog (and only when they are real). While the redesign awaits approval, only the
// three prototype pages use it (see `isPrototype*`).
import type { Category } from "@/lib/catalog";
import { FIELDS } from "@/lib/catalog";

/** Prototype gate: the redesign is shown on exactly these pages until the owner approves a roll-out. */
export const isRolePrototype = (group: string, child?: string) => group === "job-title-lists" && child === "ceos";
export const isPlacePrototype = (group: string, child: string | undefined, country: string | undefined) => group === "geographic-databases" && child === "international-business-databases" && country === "germany";
export const isIndustryPrototype = (slug: string) => slug === "dentists";

export type Tier = { title: string; note: string; roles: { slug: string; name: string }[] };

/** Role hierarchy for job-title pages. Slugs are real children of the job-title-lists group. */
export const ROLE_TIERS: Tier[] = [
  { title: "Top of the company", note: "Owners and chief executives who sign off on strategy and large spend.", roles: [{ slug: "ceos", name: "CEOs" }, { slug: "founders", name: "Founders" }] },
  { title: "Chiefs by function", note: "Officers who own one budget: money or technology.", roles: [{ slug: "cfos", name: "CFOs" }, { slug: "ctos", name: "CTOs" }] },
  { title: "Leaders of teams", note: "Directors who shape a department and shortlist vendors.", roles: [{ slug: "directors", name: "Directors" }, { slug: "marketing-directors", name: "Marketing Directors" }, { slug: "hr-managers", name: "HR Managers" }] },
  { title: "Day-to-day managers", note: "Managers who run teams and use what you sell.", roles: [{ slug: "managers", name: "Managers" }] },
];

const ROLE_HEAD: Record<string, string> = {
  ceos: "Reach the People Who Lead.",
  founders: "Reach the People Who Started It.",
  cfos: "Reach the People Who Hold the Budget.",
  ctos: "Reach the People Who Choose the Tech.",
};

export function roleView(name: string, slug: string) {
  const who = name.replace(/ Email Lists$/, "");
  return {
    headline: ROLE_HEAD[slug] ?? `Reach the ${who}s Who Decide.`,
    lead: `Request ${who} contact lists by industry, company size and location. Ready-made ${who} lists are not on sale yet, so we build them to order.`,
    who,
  };
}

export const CEO_CONTENT = {
  whatIs: [
    "A CEO email list is a database of business contacts for chief executives. Instead of a general company inbox, your message is aimed at the person who signs off on strategy, budgets and large purchases.",
    "BeigeLeads does not sell a ready-made CEO list yet. Our ready-made lists cover businesses (name, address, city, country, phone, email and website). A CEO list is built to order: tell us the industry, place and company size you need, and we review what can be sourced and verified.",
  ],
  uses: [
    ["Sales teams selling high-value B2B services", "Open conversations where the decision is made at the top."],
    ["Agencies pitching retainers", "Reach owners of growing businesses before a competitor does."],
    ["Software vendors with top-down purchases", "Contact the executive who sponsors a company-wide tool."],
    ["Executive recruiters", "Build a map of leaders in one industry or city."],
    ["Advisors, investors and partnership teams", "Start introductions with the people who decide."],
  ] as [string, string][],
  choose: [
    ["Match the role to the buyer", "In a small business the CEO often is the buyer. In a large one, a director or a chief of one function may suit you better."],
    ["Narrow by industry first", "One message fits one industry. A focused list is easier to write for than a broad one."],
    ["Decide the place", "Choose a country, state or city, and check the sending rules that apply there."],
    ["Ask how contacts are sourced and checked", "Ours are collected from public sources, checked with in-house SMTP tests and re-verified every 60 days."],
    ["Plan the lawful use up front", "You are responsible for following the laws that apply to your sending. Our lawful-use policy applies to every list."],
  ] as [string, string][],
};

/** Sentence-case plural noun for an industry ("dental businesses" -> "Dental businesses"). */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const INDUSTRY_HEAD: Record<string, string> = {
  dentists: "Reach Every Dental Practice You Sell To.",
  restaurants: "Reach the Kitchens That Buy From You.",
  "ski-shops": "Reach the Shops Behind the Season.",
};
export function industryView(c: Category) {
  const s = c.singular.toLowerCase();
  return {
    headline: INDUSTRY_HEAD[c.slug] ?? `Reach ${cap(c.reachLabel)} Without the Research.`,
    lead: `${c.description} Check a masked sample, pay once, and keep the file.`,
    whatIs: [
      `A ${s} email list is a ready-made database of ${c.reachLabel}. Each record is one business with its name, address, city, country, phone, email and website, so you can contact a whole market without researching it one business at a time.`,
      `Our team collects the data from public listings, company websites, registries and directories, checks emails with in-house SMTP tests, and re-verifies every list every 60 days. Not every business publishes every detail, so some cells can be empty.`,
    ],
    choose: [
      ["Look at the fields", "Check that the fields you need, such as email or phone, are in the list."],
      ["Check the sample", "Every list page shows a masked sample, and you can request a free sample by email."],
      ["Pick the place", "Lists are national. Use the place pages to see where we have recorded inventory."],
      ["Read the checking policy", "See how data is verified and what happens if too many emails bounce."],
    ] as [string, string][],
  };
}

export function placeView(country: string) {
  return {
    headline: `Reach Businesses Across ${country}.`,
    lead: `Business email lists for ${country} are not on sale yet. Tell us the industry and region you need and we will review the request.`,
    whatIs: [
      `Geographic targeting means choosing contacts by where the business is: a country, a state or region, or a city. It keeps a campaign local, so the language, time zone and rules fit every recipient.`,
      `BeigeLeads sells United States data today. We do not sell ${country} or other non-US lists until we have a lawful basis and compliant sourcing for that country. If you need ${country}, a custom request is the way to start; we will tell you what is possible.`,
    ],
    choose: [
      ["Start with the country", "Pick the market first. Rules for business email differ from one country to the next."],
      ["Narrow to a region or city", "Where we have recorded inventory, place pages show it. Elsewhere, a custom request can target a region."],
      ["Add the industry", "A place and an industry together make a list one message can fit."],
      ["Check the rules before you send", "You are responsible for following the laws of the recipient's country."],
    ] as [string, string][],
  };
}

export const FIELD_NOTES: Record<string, string> = {
  "Business name": "The registered or trading name.",
  Address: "Street address.",
  City: "City, for local targeting.",
  Country: "Country of operation.",
  Phone: "Business phone number.",
  Email: "Business email, SMTP-checked.",
  Website: "The business's own site.",
};
export const STANDARD_FIELDS = FIELDS;
