// Built-in glossary categories. They are used until the admin saves a category (then the database is the source).
export type GCategory = { slug: string; name: string; description: string; sortOrder: number };
export const DEFAULT_CATEGORIES: GCategory[] = [
  ["b2b-databases", "B2B Databases", "How business contact databases are built, sold and used."],
  ["b2c-data", "B2C Data", "Consumer data concepts. BeigeLeads does not sell consumer lists."],
  ["lead-generation", "Lead Generation", "Finding and qualifying people who may want what you sell."],
  ["email-marketing", "Email Marketing", "Sending email to people who expect to hear from you."],
  ["cold-emailing", "Cold Emailing", "First-contact outreach to people who do not know you yet."],
  ["email-verification", "Email Verification", "Checking that an address can receive mail before you send."],
  ["data-enrichment", "Data Enrichment", "Adding missing facts to a record you already have."],
  ["sales-prospecting", "Sales Prospecting", "Building target lists and starting sales conversations."],
  ["crm", "CRM", "Systems that store customer and prospect records."],
  ["data-segmentation", "Data Segmentation", "Splitting a list into groups that need different messages."],
  ["marketing-automation", "Marketing Automation", "Software that sends messages from rules and triggers."],
  ["privacy-compliance", "Data Privacy & Compliance", "Rules for collecting, storing and contacting people."],
].map(([slug, name, description], i) => ({ slug, name, description, sortOrder: i }));
