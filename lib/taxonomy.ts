/**
 * List-type taxonomy (CLAUDE.md section 76). A category can exist before inventory:
 * `available` = real ready-made lists can be bought under it today, `upcoming` = no product yet
 * (page offers a custom request). Nothing here creates a product, a count or a price.
 * Phase 2 will let the admin edit this tree in D1; the shape below is what that table will mirror.
 */
export type TaxStatus = "available" | "upcoming";
/** Extra rules shown on the page for data types that need consent or special care. */
export type Compliance = "consumer" | "whatsapp" | "phone";
export type TaxIcon = "mail" | "phone" | "message" | "briefcase" | "users" | "building" | "globe";

/** Fields only the admin editor (D1) sets; the built-in code tree leaves them out. */
export type TaxExtra = { id?: number; seoTitle?: string; metaDescription?: string; content?: string; productSlugs?: string[]; featured?: boolean; menuVisible?: boolean; published?: boolean };
export type TaxChild = { slug: string; name: string; short: string; blurb: string; status: TaxStatus; compliance?: Compliance } & TaxExtra;
export type TaxGroup = { slug: string; name: string; menuName: string; icon: TaxIcon; short: string; blurb: string; status: TaxStatus; compliance?: Compliance; children: TaxChild[] } & TaxExtra;

const up = (slug: string, name: string, short: string, blurb: string, compliance?: Compliance): TaxChild => ({ slug, name, short, blurb, status: "upcoming", ...(compliance ? { compliance } : {}) });
const live = (slug: string, name: string, short: string, blurb: string): TaxChild => ({ slug, name, short, blurb, status: "available" });

export const TAXONOMY: TaxGroup[] = [
  {
    slug: "email-lists", name: "Email Lists", menuName: "Email Lists", icon: "mail", status: "available",
    short: "Verified business emails by industry and place.",
    blurb: "Ready-made business email lists. Each one is checked with in-house SMTP tests and re-verified every 60 days, with a masked sample on the page before you pay.",
    children: [
      live("b2b-email-lists", "B2B Email Lists", "Business contacts, ready to download", "Business-to-business email lists with business name, address, city, country, phone, email and website."),
      live("industry-email-lists", "Industry Email Lists", "Pick one industry", "Email lists scoped to a single industry, so one message can fit every recipient."),
      live("geographic-email-lists", "Geographic Email Lists", "Country, state or city", "Business email lists you can view by country, state or region, and city where we have recorded inventory."),
      up("professional-email-lists", "Professional Email Lists", "Contacts by profession", "Contacts grouped by profession rather than by business type. Yes, we sell these; request yours."),
      up("b2c-email-lists", "B2C Email Lists", "Consumer email lists", "Yes, we sell consumer email lists. Use them under the consent rules of each country.", "consumer"),
    ],
  },
  {
    slug: "phone-number-lists", name: "Phone Number Lists", menuName: "Phone Number Lists", icon: "phone", status: "upcoming", compliance: "phone",
    short: "Business and mobile numbers, by country or industry.",
    blurb: "Phone is one of the fields in our ready-made business lists. Browse the ready-made databases below or request a custom phone list.",
    children: [
      up("business-phone-number-lists", "Business Phone Number Lists", "Landlines and main lines", "Phone numbers for businesses in an industry or place.", "phone"),
      up("business-mobile-number-lists", "Business Mobile Number Lists", "Mobile numbers of business contacts", "Mobile numbers of business contacts. Mobile calling and texting rules are stricter than landline rules in many countries.", "phone"),
      up("consumer-phone-number-lists", "Consumer Phone Number Lists", "Consumer phone lists", "Yes, we sell consumer phone lists. Calling and texting consumers is regulated, so follow the consent rules where you operate.", "consumer"),
      up("country-specific-phone-lists", "Country-Specific Phone Lists", "One country at a time", "Phone lists for one country, built to that country's calling rules.", "phone"),
      up("industry-phone-number-lists", "Industry Phone Number Lists", "One industry at a time", "Phone lists for one industry, such as clinics or restaurants.", "phone"),
    ],
  },
  {
    slug: "whatsapp-number-lists", name: "WhatsApp Number Lists", menuName: "WhatsApp Lists", icon: "message", status: "upcoming", compliance: "whatsapp",
    short: "Only with a lawful, permission-based approach.",
    blurb: "WhatsApp number lists for outreach. Having a phone number is not permission to message it on WhatsApp, so use every list lawfully and follow WhatsApp's rules.",
    children: [
      up("business-whatsapp-contact-lists", "Business WhatsApp Contact Lists", "Businesses that list WhatsApp", "Businesses that publish a WhatsApp contact for customers. Publishing a number for enquiries is not consent to marketing.", "whatsapp"),
      up("country-specific-whatsapp-lists", "Country-Specific WhatsApp Lists", "One country at a time", "WhatsApp contact data for one country, subject to that country's consent and messaging rules.", "whatsapp"),
      up("industry-specific-whatsapp-lists", "Industry-Specific WhatsApp Lists", "One industry at a time", "WhatsApp contact data for one industry, subject to consent and platform rules.", "whatsapp"),
      up("permission-based-whatsapp-marketing-contacts", "Permission-Based WhatsApp Marketing Contacts", "Opt-in contacts only", "Contacts who have opted in to receive WhatsApp marketing. Request it as a custom list.", "whatsapp"),
    ],
  },
  {
    slug: "job-title-lists", name: "Job Title Lists", menuName: "Job Title Lists", icon: "briefcase", status: "upcoming",
    short: "CEOs, founders, CFOs, CTOs and more.",
    blurb: "Lists built around who the buyer is rather than what the business does. Yes, we sell these; request a custom list to target a role.",
    children: [
      up("ceos", "CEO Email Lists", "Chief executives", "Email contacts for chief executives of businesses in an industry or place."),
      up("founders", "Founder Email Lists", "Company founders", "Email contacts for founders, often the buyer in small businesses."),
      up("directors", "Director Email Lists", "Directors", "Email contacts for directors across functions."),
      up("managers", "Manager Email Lists", "Managers", "Email contacts for managers who run teams and budgets."),
      up("cfos", "CFO Email Lists", "Finance chiefs", "Email contacts for chief financial officers."),
      up("ctos", "CTO Email Lists", "Technology chiefs", "Email contacts for chief technology officers."),
      up("hr-managers", "HR Manager Email Lists", "Human resources", "Email contacts for human resources managers."),
      up("marketing-directors", "Marketing Director Email Lists", "Marketing leaders", "Email contacts for marketing directors."),
    ],
  },
  {
    slug: "job-function-lists", name: "Job Function Lists", menuName: "Job Function Lists", icon: "users", status: "upcoming",
    short: "Sales, marketing, HR, finance, IT and more.",
    blurb: "Contacts grouped by the department they work in. Yes, we sell these; request a list for one function in an industry or place.",
    children: [
      up("sales", "Sales Contacts", "Sales teams", "Contacts working in sales."),
      up("marketing", "Marketing Contacts", "Marketing teams", "Contacts working in marketing."),
      up("human-resources", "Human Resources Contacts", "HR teams", "Contacts working in human resources."),
      up("finance", "Finance Contacts", "Finance teams", "Contacts working in finance."),
      up("it", "IT Contacts", "IT teams", "Contacts working in information technology."),
      up("operations", "Operations Contacts", "Operations teams", "Contacts working in operations."),
      up("procurement", "Procurement Contacts", "Procurement teams", "Contacts who buy on behalf of a business."),
      up("executive-leadership", "Executive Leadership Contacts", "Senior leaders", "Contacts in executive leadership."),
    ],
  },
  {
    slug: "management-levels", name: "Management Levels", menuName: "Management Levels", icon: "users", status: "upcoming",
    short: "C-suite, directors and managers.",
    blurb: "Lists built around seniority rather than job title. Yes, we sell these; request a list for one management level in an industry or place.",
    children: [
      up("c-suite", "C-Suite Contacts", "Chief executives and officers", "Email contacts at chief-officer level."),
      up("vice-presidents", "VP Contacts", "Vice presidents", "Email contacts at vice-president level."),
      up("directors", "Director Contacts", "Directors", "Email contacts at director level."),
      up("managers", "Manager Contacts", "Managers", "Email contacts at manager level."),
      up("owners-partners", "Owner and Partner Contacts", "Owners and partners", "Email contacts for business owners and partners."),
    ],
  },
  {
    slug: "industry-databases", name: "Industry Databases", menuName: "Industry Lists", icon: "building", status: "available",
    short: "Dentists, restaurants and more.",
    blurb: "Pick the type of business you sell to. Industries with a ready-made list link straight to it; the others are open for custom requests.",
    // Industries that have a real product come from the catalog (see groupChildren); these are the ones without one yet.
    children: [
      up("healthcare", "Healthcare", "Clinics and care providers", "Healthcare businesses and providers."),
      up("retail", "Retail", "Shops and stores", "Retail businesses and stores."),
      up("real-estate", "Real Estate", "Agencies and agents", "Real estate agencies and agents."),
      up("technology", "Technology", "Software and IT firms", "Technology businesses."),
      up("financial-services", "Financial Services", "Finance and insurance", "Financial services businesses."),
      up("professional-services", "Professional Services", "Legal, accounting, consulting", "Professional services firms."),
    ],
  },
  {
    slug: "geographic-databases", name: "Geographic Databases", menuName: "Geographic Lists", icon: "globe", status: "available",
    short: "Browse by country, state or region, and city.",
    blurb: "Every ready-made list can be viewed by place. Place pages show only the inventory we have recorded there.",
    children: [
      live("browse-by-country", "Browse by Country", "Countries we cover", "Countries with recorded inventory."),
      live("browse-by-state-region", "Browse by State / Region", "States and regions", "States and regions with recorded inventory."),
      live("browse-by-city", "Browse by City", "Cities", "Cities with recorded inventory."),
      up("international-business-databases", "International Business Databases", "Outside the United States", "Business databases outside the United States. Yes, we sell databases for many countries; browse them or request yours."),
    ],
  },
  {
    slug: "business-email-lists", name: "Business Email Lists", menuName: "Business Email Lists", icon: "mail", status: "available",
    short: "Verified business email databases by country and industry.",
    blurb: "Ready-made business email databases. Each one is checked with in-house SMTP tests and re-verified every 60 days, with a masked sample on the page before you pay.",
    children: [
      live("by-country", "Business Emails by Country", "A whole country", "Business email databases that cover a whole country."),
      live("by-industry", "Business Emails by Industry", "One industry", "Business email databases scoped to a single industry."),
    ],
  },
  {
    slug: "consumer-email-lists", name: "Consumer Email Lists", menuName: "Consumer Email Lists", icon: "mail", status: "upcoming", compliance: "consumer",
    short: "Consumer email databases by country.",
    blurb: "Consumer data needs a lawful basis and consent rules that differ by country. Lists that can be sold lawfully appear here as they are cleared.",
    children: [],
  },
  {
    slug: "healthcare-lists", name: "Healthcare Lists", menuName: "Healthcare Lists", icon: "building", status: "available",
    short: "Dentists, doctors, nurses and other care providers.",
    blurb: "Email databases of healthcare businesses and professionals. Open a list to see its masked sample, fields and packages.",
    children: [],
  },
];

export const getGroup = (slug: string, tax: TaxGroup[] = TAXONOMY) => tax.find((g) => g.slug === slug);
export const getChild = (g: TaxGroup, slug: string) => g.children.find((c) => c.slug === slug);

/** Industry Databases lists real catalog industries first (they link to their own page), then the upcoming ones that have no product yet. */
export function industryChildren(industries: { slug: string; name: string }[], tax: TaxGroup[] = TAXONOMY): TaxChild[] {
  const g = getGroup("industry-databases", tax);
  if (!g) return industries.map((i) => live(i.slug, i.name, "Ready-made list", `${i.name} business lists.`));
  const have = new Set(industries.map((i) => i.slug));
  const real = industries.map((i) => live(i.slug, i.name, "Ready-made list", `${i.name} business lists.`));
  return [...real, ...g.children.filter((c) => !have.has(c.slug))];
}
export const childHref = (g: TaxGroup, c: TaxChild) => (g.slug === "industry-databases" && c.status === "available" ? `/lists/${c.slug}` : `/lists/${g.slug}/${c.slug}`);

/** Sitemap paths: only categories that have real products behind them (upcoming ones are thin, noindex pages). */
export const taxonomyPaths = (tax: TaxGroup[] = TAXONOMY) => tax.filter((g) => g.published !== false).flatMap((g) => [...(g.status === "available" || g.children.some((c) => c.status === "available" && c.published !== false) ? [`/lists/${g.slug}`] : []), ...g.children.filter((c) => c.published !== false && c.status === "available" && g.slug !== "industry-databases").map((c) => `/lists/${g.slug}/${c.slug}`)]);

export const STATUS_LABEL: Record<TaxStatus, string> = { available: "Available", upcoming: "Upcoming" };

export const COMPLIANCE_NOTE: Record<Compliance, { title: string; text: string }> = {
  consumer: { title: "Consumer data rules apply", text: "Yes, we sell consumer data. It often needs consent, and the rules differ by country and state, so follow them where you operate." },
  whatsapp: { title: "A phone number is not permission to message on WhatsApp", text: "WhatsApp's rules and many countries' laws require opt-in before marketing messages. Our lists are for lawful use under our lawful-use policy, and you are responsible for following the rules where you operate." },
  phone: { title: "Calling and texting rules apply", text: "Rules for calling and texting businesses differ by country, and mobile numbers are usually treated more strictly than landlines. Check the rules where you operate before you contact anyone. Our lawful-use policy applies to every list." },
};

/** FAQs written per node, so no two pages share the same text. */
export function nodeFaqs(name: string, status: TaxStatus, compliance?: Compliance): [string, string][] {
  const out: [string, string][] = [
    [`Can I buy ${name} today?`, status === "available" ? `Yes, where a ready-made list exists you can add it to your cart and pay once in crypto. The lists shown on this page are the real ones; nothing here is a placeholder product.` : `Yes, we do sell ${name}. Pick a database on this page, add it to your cart and pay once in crypto. If you need a different audience or region, request a custom list.`],
    [`Can I see a sample before paying?`, `Every ready-made list page shows a masked sample, and you can request a free sample by email. Request one for any list on this page.`],
  ];
  if (compliance === "whatsapp") out.push([`Does having a phone number mean I can message it on WhatsApp?`, `Not by itself. Yes, we do sell WhatsApp number lists, and marketing on WhatsApp generally needs the recipient's opt-in, so follow WhatsApp's rules and your local law when you message.`]);
  else if (compliance === "consumer") out.push([`Do consumer lists have special rules?`, `Yes, we sell them. Consumer contact data is regulated differently from business data and often needs consent, so follow the rules where you operate.`]);
  else if (compliance === "phone") out.push([`Are there rules for calling or texting these contacts?`, `Yes. They differ by country and by number type. You are responsible for following them, and our lawful-use policy applies to every list.`]);
  else out.push([`How is the data checked?`, `Emails are checked with in-house SMTP tests and every list is re-verified every 60 days. See the verification page for the full process.`]);
  return out;
}
