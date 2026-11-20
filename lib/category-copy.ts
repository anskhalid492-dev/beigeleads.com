// Copy for the category landing pages (/lists/<group>[/<child>]). Original text, honest by design:
// no counts, prices or inventory are claimed here. Anything numeric comes from the catalog.
import type { Compliance } from "@/lib/taxonomy";

export type GroupCopy = {
  /** Short noun for headings, e.g. "email lists". */
  noun: string;
  headline: string;
  whatIs: string[];
  uses: [string, string][];
  choose: [string, string][];
};

const COMMON_CHOOSE: [string, string][] = [
  ["Check the fields", "Look at which fields the list includes before you look at anything else. Business name, address, city, country, phone, email and website are in our ready-made lists."],
  ["Preview the sample", "Every list page shows a masked sample, and you can request a free sample file by email."],
  ["Pick the place", "A country, state or city keeps a campaign local, so language, time zone and sending rules fit every recipient."],
  ["Read how it is checked", "Emails are checked with in-house SMTP tests and every list is re-verified every 60 days."],
];

export const GROUP_COPY: Record<string, GroupCopy> = {
  "email-lists": {
    noun: "email lists",
    headline: "Business Email Lists, Ready to Download.",
    whatIs: [
      "A business email list is a database of companies with the contact details you need to reach them. Instead of researching one business at a time, you start from a finished file and filter it down to your market.",
      "Our ready-made lists are collected from public listings, company websites, registries and directories, checked with in-house SMTP tests and re-verified every 60 days. Each record is one business, so some cells can be empty when a business does not publish a detail.",
    ],
    uses: [
      ["Sales teams", "Build a prospect list for outbound by industry and place."],
      ["Marketing agencies", "Plan local campaigns for clients who sell into one market."],
      ["Recruitment firms", "Find employers in a sector and region you place candidates in."],
      ["Local SEO and web agencies", "Reach businesses that need a site, listings or reviews."],
      ["Market research teams", "Contact businesses for surveys and interviews."],
    ],
    choose: COMMON_CHOOSE,
  },
  "phone-number-lists": {
    noun: "phone number lists",
    headline: "Phone Numbers for the Businesses You Call.",
    whatIs: [
      "Phone is one of the fields in every ready-made business list we sell: the business phone number sits next to the name, address and email. Stand-alone phone lists are a different product, and we do not sell them yet.",
      "Rules for calling and texting differ by country and by number type, and mobile numbers are usually treated more strictly than landlines. That is why the lists below are the ready-made ones you can buy today, each with the phone field included.",
    ],
    uses: [
      ["Inside sales teams", "Call local businesses in one industry or city."],
      ["Appointment setters", "Book meetings for clients who sell to local businesses."],
      ["Service companies", "Offer equipment, supplies or maintenance to businesses nearby."],
      ["Research teams", "Run phone interviews with businesses in a defined market."],
    ],
    choose: [
      ["Confirm the phone field", "Check that phone is listed in the fields of the database you choose."],
      ["Know the calling rules", "Rules for calling businesses differ by country. You are responsible for following the ones that apply."],
      ["Preview the sample", "Every list page shows masked rows, including the phone column."],
      ["Pick a place", "A country or city keeps your calling hours and language consistent."],
    ],
  },
  "whatsapp-number-lists": {
    noun: "WhatsApp contact lists",
    headline: "Know What You Can, and Cannot, Message.",
    whatIs: [
      "WhatsApp marketing runs on permission. A phone number on a business listing is not the same as consent to receive marketing on WhatsApp, and the platform and many countries require opt-in first.",
      "BeigeLeads does not sell WhatsApp lists today and does not offer opt-in contacts, because we cannot yet document opt-in at the source. The ready-made business lists below include a phone field you can use for permitted, lawful outreach.",
    ],
    uses: [
      ["Businesses with existing customers", "Message people who already opted in to hear from you."],
      ["Agencies", "Set up compliant WhatsApp flows for clients."],
      ["Sales teams", "Use business data to find who to contact first, then ask for permission."],
    ],
    choose: [
      ["Start with permission", "Only message people who have opted in. A number alone is not consent."],
      ["Read the platform rules", "WhatsApp has its own business messaging terms. You are responsible for following them."],
      ["Use business data for research", "Our ready-made lists help you find businesses, then reach them through channels they allow."],
      ["Check local law", "Messaging rules differ by country."],
    ],
  },
  "job-title-lists": {
    noun: "job title lists",
    headline: "Reach the People Who Decide.",
    whatIs: [
      "A job title list is built around who the buyer is rather than what the business does. Instead of a general company inbox, your message is aimed at a role such as CEO, founder, CFO or marketing director.",
      "Our ready-made lists are business lists: they hold the business, not a named person or their title. Role-based lists are not on sale yet. The databases below are the ones you can buy now, and you can use them to build a role-targeted campaign by researching the owners and decision makers at the businesses you pick.",
    ],
    uses: [
      ["Sales teams selling high-value services", "Open conversations where the decision is made."],
      ["Agencies pitching retainers", "Reach owners of growing businesses first."],
      ["Software vendors", "Contact the executive who sponsors a tool."],
      ["Executive recruiters", "Map leaders in one industry or city."],
    ],
    choose: [
      ["Match the role to the buyer", "In a small business the owner is often the buyer. In a large one a director or a chief of one function may suit you better."],
      ["Narrow by industry first", "One message fits one industry."],
      ["Decide the place", "Choose a country, state or city, and check the sending rules there."],
      ["Plan lawful use up front", "You are responsible for following the laws that apply to your sending."],
    ],
  },
  "job-function-lists": {
    noun: "job function lists",
    headline: "Reach One Department at a Time.",
    whatIs: [
      "A job function list groups contacts by the department they work in, such as sales, marketing, finance, IT or operations. It lets you write to the team that owns the problem you solve.",
      "Function-based lists are not on sale yet. Our ready-made business lists are organised by industry and place, so the databases below are what you can buy today.",
    ],
    uses: [
      ["Software vendors", "Sell a tool to the department that will use it."],
      ["Training and consulting firms", "Reach the team that buys development."],
      ["Recruitment agencies", "Find teams that are hiring in one function."],
    ],
    choose: COMMON_CHOOSE,
  },
  "management-levels": {
    noun: "management level lists",
    headline: "Reach the Right Level of Seniority.",
    whatIs: [
      "A management level list groups contacts by seniority: C-suite, vice presidents, directors, managers, owners and partners. Seniority decides who signs off and who shortlists.",
      "Seniority-based lists are not on sale yet. The ready-made business lists below are what you can buy today, organised by industry and place.",
    ],
    uses: [
      ["Enterprise sales", "Reach sponsors who control budget."],
      ["Agencies", "Match the message to the level you are writing to."],
      ["Recruiters", "Map leadership in one sector."],
    ],
    choose: COMMON_CHOOSE,
  },
  "industry-databases": {
    noun: "industry databases",
    headline: "One Industry. One Clean Database.",
    whatIs: [
      "An industry database is a ready-made list of one type of business, such as dentists or restaurants. Because every record is the same kind of business, one message can fit every recipient.",
      "Industries with a ready-made list link straight to their own page. Each has a masked sample, a list of fields and a one-time price on its product page.",
    ],
    uses: [
      ["Suppliers and distributors", "Sell equipment and consumables to one trade."],
      ["Software vendors", "Offer software built for one type of business."],
      ["Marketing agencies", "Run campaigns for one niche."],
      ["Franchise and expansion teams", "Map who operates in a market."],
    ],
    choose: COMMON_CHOOSE,
  },
  "geographic-databases": {
    noun: "geographic databases",
    headline: "Start With Where. Then Choose What.",
    whatIs: [
      "Geographic targeting means choosing contacts by where the business is: a country, a state or region, or a city. It keeps a campaign local, so language, time zone and rules fit every recipient.",
      "Place pages show only the inventory we have recorded there. A country or city that is not shown has no ready-made database yet.",
    ],
    uses: [
      ["Regional sales teams", "Cover one territory completely."],
      ["Local marketing agencies", "Plan campaigns for one city or country."],
      ["Expansion teams", "Size up a market before entering it."],
      ["Recruitment firms", "Find employers in one region."],
    ],
    choose: [
      ["Start with the country", "Pick the market first. Rules for business email differ from one country to the next."],
      ["Narrow to a region or city", "Where we have recorded inventory, place pages show it."],
      ["Add the industry", "A place and an industry together make a list one message can fit."],
      ["Check the rules before you send", "You are responsible for following the laws of the recipient's country."],
    ],
  },
};

export const fallbackCopy = (name: string): GroupCopy => ({
  noun: name.toLowerCase(),
  headline: `Find the Right ${name}.`,
  whatIs: ["Ready-made business contact databases, checked with in-house SMTP tests and re-verified every 60 days."],
  uses: [["Sales teams", "Build a prospect list."], ["Agencies", "Plan campaigns for clients."]],
  choose: COMMON_CHOOSE,
});

export const SHOP_STEPS: [string, string][] = [
  ["Pick a database", "Choose the list that fits your market."],
  ["Preview the sample", "Check masked rows, or request a free sample by email."],
  ["Choose a package", "Select the size on the list page and pay once in crypto."],
  ["Get your file", "Receive a link by email to your file in CSV, Excel or TXT."],
];

export type { Compliance };
