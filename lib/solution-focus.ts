// Short audience labels used in section headings of the solution pages (reference-style template).
// `audience` completes "Why {audience} choose BeigeLeads"; `focus` completes "{focus} challenges".
export const solutionFocus: Record<string, { audience: string; focus: string }> = {
  "b2b-lead-generation": { audience: "B2B teams", focus: "lead generation" },
  "cold-email-marketing": { audience: "cold email teams", focus: "cold email" },
  "sales-prospecting": { audience: "sales teams", focus: "prospecting" },
  "marketing-agencies": { audience: "marketing agencies", focus: "agency" },
  "market-research": { audience: "research teams", focus: "market research" },
  "local-business-marketing": { audience: "local marketers", focus: "local marketing" },
  "healthcare-marketing": { audience: "healthcare marketers", focus: "healthcare marketing" },
  "real-estate-prospecting": { audience: "real estate teams", focus: "real estate" },
  "recruitment-staffing": { audience: "recruiters", focus: "recruitment" },
  "ecommerce-market-research": { audience: "e-commerce teams", focus: "e-commerce" },
  "influencer-marketing": { audience: "creator marketers", focus: "influencer marketing" },
  "business-expansion": { audience: "expanding businesses", focus: "expansion" },
};
export const getFocus = (slug: string) => solutionFocus[slug] ?? { audience: "teams", focus: "outreach" };
