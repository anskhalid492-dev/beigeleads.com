// B2B Benchmarks (section 138). The 20 planned reports as code records. NO figures live here: a report is published only when it has verified,
// attributable data (first-party aggregate the owner approves, or a credible third-party study with permission). Until then it is a draft with a
// documented data requirement, is not linked as a report, and is not in the sitemap.
export type BenchCategory = "email-outreach" | "data-quality" | "lead-generation" | "industry-geo";
export const BENCH_CATEGORIES: { slug: BenchCategory; name: string; text: string }[] = [
  { slug: "email-outreach", name: "Email Outreach", text: "Response, bounce, deliverability, follow-ups and personalization in cold email." },
  { slug: "data-quality", name: "B2B Data Quality", text: "Verification, accuracy, decay, coverage and completeness of contact data." },
  { slug: "lead-generation", name: "Lead Generation", text: "Conversion, prospecting effort, SDR output, cost per lead and sales cycles." },
  { slug: "industry-geo", name: "Industry & Geographic Research", text: "How the same metrics differ by industry and by country." },
];
export type BenchRecord = { slug: string; title: string; category: BenchCategory; keyword: string; need: string; status: "draft" | "published" };
const R = (slug: string, title: string, category: BenchCategory, keyword: string, need: string): BenchRecord => ({ slug, title, category, keyword, need, status: "draft" });
export const BENCHMARKS: BenchRecord[] = [
  R("cold-email-response-rate", "Cold Email Response Rate Benchmarks", "email-outreach", "cold email response rate benchmarks", "A cited third-party study or BeigeLeads-approved aggregate with sample size, period and a written reply definition."),
  R("cold-email-bounce-rate", "Cold Email Bounce Rate Benchmarks", "email-outreach", "cold email bounce rate benchmarks", "Bounce data by list source with sample size, period and hard/soft bounce definitions."),
  R("b2b-email-deliverability", "B2B Email Deliverability Benchmarks", "email-outreach", "b2b email deliverability benchmarks", "Inbox-placement or deliverability study with method, sample and period."),
  R("cold-email-follow-ups", "Cold Email Follow-Up Benchmarks", "email-outreach", "cold email follow up benchmarks", "Sequence-level reply data by follow-up number, with sample and period."),
  R("email-personalization", "Email Personalization Benchmarks", "email-outreach", "email personalization benchmarks", "A study that compares personalised and generic outreach with a stated method."),
  R("email-verification", "Email Verification Benchmarks", "data-quality", "email verification benchmarks", "Verification outcome data (valid, risky, invalid) with the list sources and period."),
  R("b2b-data-accuracy", "B2B Data Accuracy Benchmarks", "data-quality", "b2b data accuracy benchmarks", "Independent accuracy measurement with method and sample; the owner-declared 95% policy figure is not a measured benchmark."),
  R("b2b-data-decay", "B2B Data Decay Benchmarks", "data-quality", "b2b data decay benchmarks", "Decay rate per period from a cited study or re-verification data."),
  R("business-email-coverage", "Business Email Coverage Benchmarks", "data-quality", "business email coverage benchmarks", "Share of records with a business email, by source and segment, with sample size."),
  R("contact-data-completeness", "Contact Data Completeness Benchmarks", "data-quality", "contact data completeness benchmarks", "Field-level completeness measured on a defined record set."),
  R("b2b-lead-conversion", "B2B Lead Conversion Benchmarks", "lead-generation", "b2b lead conversion benchmarks", "Stage-to-stage conversion from a cited study with definitions and sample."),
  R("sales-prospecting", "Sales Prospecting Benchmarks", "lead-generation", "sales prospecting benchmarks", "Prospecting activity and outcome data from a cited study."),
  R("sdr-productivity", "SDR Productivity Benchmarks", "lead-generation", "sdr productivity benchmarks", "SDR activity and meetings data from a cited study with population stated."),
  R("b2b-lead-generation-cost", "B2B Lead Generation Cost Benchmarks", "lead-generation", "b2b lead generation cost benchmarks", "Cost-per-lead data by channel from a cited study with currency and period."),
  R("b2b-sales-cycle", "B2B Sales Cycle Benchmarks", "lead-generation", "b2b sales cycle benchmarks", "Sales-cycle length by deal size or segment from a cited study."),
  R("healthcare-lead-generation", "Healthcare Lead Generation Benchmarks", "industry-geo", "healthcare lead generation benchmarks", "Industry-specific outreach or lead data for healthcare with sample and period."),
  R("saas-lead-generation", "SaaS Lead Generation Benchmarks", "industry-geo", "saas lead generation benchmarks", "Industry-specific data for SaaS with sample and period."),
  R("real-estate-lead-generation", "Real Estate Lead Generation Benchmarks", "industry-geo", "real estate lead generation benchmarks", "Industry-specific data for real estate with sample and period."),
  R("b2b-email-by-country", "B2B Email Benchmarks by Country", "industry-geo", "b2b email benchmarks by country", "Country-level deliverability or response data with sample per country."),
  R("b2b-outreach-by-industry", "B2B Outreach Benchmarks by Industry", "industry-geo", "b2b outreach benchmarks by industry", "Outreach metrics split by industry from one consistent dataset."),
];
export const publishedBenchmarks = () => BENCHMARKS.filter((b) => b.status === "published");
