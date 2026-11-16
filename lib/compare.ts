// Competitors we plan to write honest comparison pages for (CLAUDE.md section 5).
// Pages are stubs until written. No claims about any competitor until each is verified.
export const competitors = [
  { slug: "leadsmunch", name: "LeadsMunch" },
  { slug: "cognism", name: "Cognism" },
  { slug: "zoominfo", name: "ZoomInfo" },
  { slug: "apollo", name: "Apollo" },
  { slug: "lusha", name: "Lusha" },
  { slug: "seamless-ai", name: "Seamless.AI" },
  { slug: "rocketreach", name: "RocketReach" },
  { slug: "uplead", name: "UpLead" },
  { slug: "hunter", name: "Hunter" },
  { slug: "subscription-tools", name: "subscription tools" },
] as const;

export const compareHref = (slug: string) => `/compare/beigeleads-vs-${slug}`;
export const compareTitle = (name: string) => `BeigeLeads vs ${name}`;
