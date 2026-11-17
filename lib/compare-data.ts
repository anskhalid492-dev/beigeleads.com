// Comparison content. RULES (CLAUDE.md sections 2 and 15):
// - Every claim about a competitor comes from that vendor's OWN pages, listed under `sources`, and was read on CHECKED.
// - If a page did not state something we say "not stated", never a guess. No accuracy, quality or "better than" claims.
// - Claims about BeigeLeads come only from owner facts and our published policies (see US below).
// - Prices of BeigeLeads lists are placeholders today, so no BeigeLeads price appears on these pages.
// Re-check every page before launch and whenever a vendor changes its plans.

export const CHECKED = "2026-11-17";
export const CHECKED_LABEL = "17 November 2026";

export type Source = { label: string; url: string };
export type Row = { label: string; them: string; us: string };
export type Comparison = {
  slug: string;
  name: string;
  /** Official logo file under /public/logos/compare (owner-supplied). Text badge is shown until set. */
  logo?: string;
  /** One line used on the hub and in the meta description. */
  tagline: string;
  /** What they are, from their own description. */
  about: string;
  rows: Row[];
  chooseThem: string[];
  chooseUs: string[];
  verdict: string;
  sources: Source[];
  faqs: [string, string][];
};

/** What we can truthfully say about BeigeLeads today. */
export const US = {
  model: "You buy a ready-made list once. No subscription, no seats, no credits to meter.",
  account: "No account. We only need an email address to send your link.",
  payment: "Cryptocurrency only at launch (BTC, USDT, USDC, ETH).",
  sample: "Free masked sample on every list page, before you pay.",
  delivery: "A download link is emailed after the payment is confirmed on the blockchain.",
  guarantee: "If more than 5% of the emails bounce, we replace them until the list is back at 95% verified; otherwise we refund proportionally in crypto. See our refund and replacement policy.",
  freshness: "Re-verified every 60 days, using our own SMTP checks.",
  coverage: "United States businesses only, and three lists so far (dentists, restaurants, ski shops). More categories are added step by step.",
  use: "Lawful business outreach only. No spam, fraud, harassment or resale.",
};

const common = (): [string, string][] => [
  ["Can I try BeigeLeads before paying?", "Yes. Every list page has a free masked sample so you can check the fields and the format before you pay."],
];

export const comparisons: Comparison[] = [
  {
    slug: "leadsmunch",
    name: "LeadsMunch",
    tagline: "Another store where you buy ready-made contact lists once.",
    about: "LeadsMunch sells ready-made business contact lists. Its home page says \"Buy now from $49, no sign-up required\" and promises instant access after purchase.",
    rows: [
      { label: "How you buy", them: "One-time purchase of a list. A separate subscriptions page exists; its terms are not stated on the page we read.", us: US.model },
      { label: "Account", them: "\"No sign-up required\" (their wording).", us: US.account },
      { label: "Payment", them: "\"We accept all major cryptocurrencies.\" Other methods: not stated.", us: US.payment },
      { label: "Free sample", them: "Yes, a free sample before buying.", us: US.sample },
      { label: "Delivery", them: "Instant for ready-made lists, usually CSV or Excel. Custom databases take 24 to 48 hours.", us: US.delivery },
      { label: "Freshness", them: "Datasets are refreshed and verified every 90 days.", us: US.freshness },
      { label: "Accuracy promise", them: "Aims for \"up to 95% accurate\" data. If accuracy falls below 95% they replace inaccurate data free. Money-back terms: not stated on that page.", us: US.guarantee },
      { label: "Catalog size", them: "Claims \"6B+ records, 180+ countries\" and \"800+\" business email lists.", us: US.coverage },
    ],
    chooseThem: ["You need a country or niche outside our three US lists.", "You want a much larger catalog today.", "You want custom databases for a wider set of markets."],
    chooseUs: ["Your target is US dentists, restaurants or ski shops.", "You want the replacement rule written down in a policy you can read before buying.", "You want data we re-verify every 60 days (they state 90)."],
    verdict: "LeadsMunch and BeigeLeads sell the same way: buy a list once, pay in crypto, no account. LeadsMunch has a far bigger catalog today. We are smaller and US-only for now, so choose us only if our lists match your target.",
    sources: [{ label: "LeadsMunch home page", url: "https://leadsmunch.com/" }],
    faqs: common(),
  },
  {
    slug: "cognism",
    name: "Cognism",
    tagline: "A sales-intelligence platform sold on custom pricing.",
    about: "Cognism is a prospecting platform. Its pricing page says pricing \"is tailored based on the product you need, your team setup and how you plan to use the platform.\"",
    rows: [
      { label: "How you buy", them: "Platform packages (Sales Prospecting Standard and Pro, CRM Enrichment). Price tailored to your setup.", us: US.model },
      { label: "Published prices", them: "Not stated on the page we read.", us: "No price shown on this page. See the list page for current packages." },
      { label: "Seats and credits", them: "Standard and Pro each include 5 seats. \"1 credit = 1 revealed contact.\" Extra credits can be bought.", us: "No seats, no credits." },
      { label: "Contract terms", them: "Not stated on the page we read.", us: "One purchase per list. Nothing renews." },
      { label: "Try first", them: "Book a demo. A \"Free data sample\" link appears in their footer; details not stated.", us: US.sample },
      { label: "Extras they describe", them: "CRM enrichment and intent topics (up to 12 topics from a library of over 11,000, per their page).", us: "A static list. No enrichment, no intent data." },
    ],
    chooseThem: ["You need a platform for a whole sales team, with CRM enrichment and intent data.", "You want ongoing updates inside your CRM rather than a file."],
    chooseUs: ["You want one list for one campaign without seats or a sales call.", "You want to see a masked sample and a policy before talking to anyone."],
    verdict: "Cognism is a platform for teams that work from data every day. BeigeLeads is a file you buy once. They solve different problems, so the right pick depends on whether you need a tool or a list.",
    sources: [{ label: "Cognism pricing", url: "https://cognism.com/pricing" }],
    faqs: common(),
  },
  {
    slug: "zoominfo",
    name: "ZoomInfo",
    tagline: "A large go-to-market platform with usage-based credits.",
    about: "ZoomInfo describes itself as a go-to-market platform. Its own information page says it is \"free to start with consumption credits based on usage\" and does not use fixed seat tiers.",
    rows: [
      { label: "How you buy", them: "Consumption credits based on usage. A permanent free plan (ZoomInfo Lite) and a free trial exist.", us: US.model },
      { label: "Published prices", them: "No dollar figures on the pages we read; they point to their pricing page for current details. They also say outside price figures and tier names \"don't describe current pricing.\"", us: "No price shown on this page." },
      { label: "Seats", them: "\"ZoomInfo does not use fixed seat tiers.\"", us: "No seats." },
      { label: "Contract terms", them: "Not stated on the pages we read.", us: "One purchase per list. Nothing renews." },
      { label: "Developer access", them: "Headless access to data through their GTM.AI; their page says it is free and that API access does not require a platform subscription.", us: "No API. A file link by email." },
      { label: "Free plan", them: "ZoomInfo Lite is permanent and \"needs no credit card and no commitment\" (their wording).", us: US.sample },
    ],
    chooseThem: ["You need a full platform with a large database, workflows and API access.", "You want to start free and scale by usage."],
    chooseUs: ["You need a single US list in a file and nothing else.", "You prefer to pay once, in crypto, without creating an account."],
    verdict: "ZoomInfo is a broad platform, and its own pages say pricing depends on usage. We could not confirm its price from the pages we read, so we do not compare prices. If you only need a fixed list, BeigeLeads is the lighter option; if you need ongoing data and integrations, a platform fits better.",
    sources: [
      { label: "ZoomInfo AI information page", url: "https://www.zoominfo.com/ai-information" },
      { label: "ZoomInfo pricing overview", url: "https://zoominfo.com/business/zoominfo-pricing" },
    ],
    faqs: common(),
  },
  {
    slug: "apollo",
    name: "Apollo",
    tagline: "A sales platform with credit-based plans and a free tier.",
    about: "Apollo is a sales engagement and data platform. Its pricing page lists Free, Basic, Professional and Custom plans.",
    rows: [
      { label: "How you buy", them: "Subscription. Monthly (cancel any time) or annual with a 12-month commitment.", us: US.model },
      { label: "Prices", them: "Dollar amounts not shown on the page we read.", us: "No price shown on this page." },
      { label: "Credits", them: "Credits are pooled across the team, granted at the start of each billing cycle, and do not roll over.", us: "No credits." },
      { label: "Exports", them: "Up to 10,000 leads in one click when no record limit applies; higher plans have higher or no limits.", us: "The whole list file, in one download link." },
      { label: "Cancel or downgrade", them: "Cancellation takes effect at the end of the term. Downgrades take effect immediately with no refund for unused time.", us: "Nothing to cancel after you buy." },
      { label: "Use of the data", them: "Plans are for internal business use. Reselling Apollo data needs a separate agreement.", us: US.use },
      { label: "Payment", them: "Card on file. Other methods: not stated.", us: US.payment },
    ],
    chooseThem: ["You want a tool that searches, enriches and sends sequences in one place.", "You want a free plan to start."],
    chooseUs: ["You want a file you keep, without a credit meter or a renewing plan.", "You want to pay with crypto and skip account creation."],
    verdict: "Apollo is a working tool with credits that reset every cycle. BeigeLeads is a one-time file. If you prospect daily, Apollo's workflow may save time. If you need one list for one push, the one-time model avoids paying for a platform you will not use.",
    sources: [{ label: "Apollo pricing", url: "https://www.apollo.io/pricing?solution=outbound" }],
    faqs: common(),
  },
  {
    slug: "lusha",
    name: "Lusha",
    tagline: "Contact lookup sold as monthly or annual credit plans.",
    about: "Lusha offers Free, Starter, Pro and Premium self-serve plans, plus Scale for larger teams. Starter, Pro and Premium use a credit slider.",
    rows: [
      { label: "How you buy", them: "Subscription that renews automatically. Cancel any time in account settings; credits stay until the billing period ends.", us: US.model },
      { label: "Free plan", them: "Permanent. \"Up to 40 credits per month.\"", us: US.sample },
      { label: "Credit cost", them: "A verified email reveal costs 1 credit. A phone number reveal costs 5 credits.", us: "No credits." },
      { label: "Rollover", them: "Monthly plans: unused credits roll over up to twice the plan limit. Annual plans: credits are issued up front and reset at the end of the year.", us: "Nothing resets. You own the file." },
      { label: "Prices", them: "Not stated on the page we read.", us: "No price shown on this page." },
      { label: "Teams", them: "Teams of more than 5 users are asked to contact sales.", us: "No seats." },
    ],
    chooseThem: ["You look up individual contacts as you go.", "You want phone numbers revealed on demand."],
    chooseUs: ["You want a whole list for a campaign instead of one contact at a time.", "You do not want a renewing plan."],
    verdict: "Lusha is built for looking up people as you work, and credits are the unit. BeigeLeads sells a whole list at once. Pick by how you work: lookups on demand or a list for a campaign.",
    sources: [{ label: "Lusha pricing", url: "https://www.lusha.com/pricing/" }],
    faqs: common(),
  },
  {
    slug: "seamless-ai",
    name: "Seamless.AI",
    tagline: "A prospecting tool with a free plan and sales-led pricing.",
    about: "Seamless.AI names a Free plan and a Pro plan and mentions more advanced tiers. Its own article says it is free to use with 50 credits and no credit card.",
    rows: [
      { label: "How you buy", them: "Free plan, then paid plans handled through a sales team.", us: US.model },
      { label: "Free plan", them: "\"50 credits to generate leads to build a contact list.\" No credit card needed.", us: US.sample },
      { label: "Published prices", them: "Their article says \"there's no fixed pricing rate\" and pricing is tailored to each company.", us: "No price shown on this page." },
      { label: "Contract terms", them: "Not stated on the page we read.", us: "One purchase per list. Nothing renews." },
      { label: "Seats", them: "Not stated how licenses affect price.", us: "No seats." },
    ],
    chooseThem: ["You want to try prospecting inside a tool for free first.", "You are happy to get a quote from a sales team."],
    chooseUs: ["You want the list and the policy in front of you before any sales conversation.", "You want to pay once."],
    verdict: "Seamless.AI starts free and moves to quoted pricing. BeigeLeads has no sales call, but it covers far less today. Choose by whether you need a tool or a US file.",
    sources: [{ label: "Seamless.AI pricing article", url: "https://seamless.ai/customers/blog/products/how-much-does-seamless-ai-cost" }],
    faqs: common(),
  },
  {
    slug: "rocketreach",
    name: "RocketReach",
    tagline: "Contact search with a free plan and paid monthly tiers.",
    about: "RocketReach offers a free plan \"that lets you test data quality before upgrading,\" and team plans through a demo.",
    rows: [
      { label: "How you buy", them: "Subscription plans, plus team plans on request.", us: US.model },
      { label: "Prices", them: "Their pages show \"starting at $29/month\" in one place and \"$33 per month\" in another.", us: "No price shown on this page." },
      { label: "Free plan", them: "Yes, to test data quality.", us: US.sample },
      { label: "Credits and rollover", them: "Per-plan lookups and rollover: not stated on the page we read.", us: "No credits." },
      { label: "Contract terms", them: "Not stated on the page we read.", us: "One purchase per list. Nothing renews." },
    ],
    chooseThem: ["You want to search for specific people and test the data on a free plan.", "You need a team plan with a demo."],
    chooseUs: ["You want a ready-made US list instead of searching one contact at a time.", "You want to see a masked sample first."],
    verdict: "RocketReach is search-first. BeigeLeads is list-first. We could not confirm its plan details from the pages we read, so we leave prices and credits out.",
    sources: [{ label: "RocketReach price comparison page", url: "https://rocketreach.co/resources/contact-search-price-comparison-choosing-the-right-plan/" }],
    faqs: common(),
  },
  {
    slug: "uplead",
    name: "UpLead",
    tagline: "Credit plans with published prices and a short free trial.",
    about: "UpLead publishes Essentials and Plus prices and a custom Professional plan. Its page says \"We verify email addresses with a data accuracy rate of 95%.\"",
    rows: [
      { label: "How you buy", them: "Subscription. Monthly plans have \"no contract or long-term commitment.\" Professional is annual only.", us: US.model },
      { label: "Free trial", them: "7 days, 5 credits.", us: US.sample },
      { label: "Essentials", them: "$99 a month for 170 credits, or $74 a month billed annually for 2,040 credits.", us: "No credits." },
      { label: "Plus", them: "$199 a month for 400 credits, or $149 a month billed annually for 4,800 credits.", us: "No credits." },
      { label: "Extra credits", them: "$0.60 per credit on Essentials, $0.50 on Plus.", us: "Not applicable." },
      { label: "Accuracy statement", them: "\"We verify email addresses with a data accuracy rate of 95%.\"", us: US.guarantee },
      { label: "Payment", them: "Not stated on the page we read.", us: US.payment },
    ],
    chooseThem: ["You want published monthly prices and a free trial.", "You will pull a few hundred contacts a month."],
    chooseUs: ["You want a full list for one push without monthly credits.", "You want to pay in crypto."],
    verdict: "UpLead's published prices make it easy to estimate a monthly cost. BeigeLeads has no monthly cost, but you buy a fixed list in one go. Which is cheaper depends on how many contacts you need and how often.",
    sources: [{ label: "UpLead pricing", url: "https://uplead.com/pricing/" }],
    faqs: common(),
  },
  {
    slug: "hunter",
    name: "Hunter",
    tagline: "Email finder and verifier sold as monthly credits.",
    about: "Hunter finds and verifies email addresses. Its pricing page defines \"1 credit = 1 email found via Domain Search, Email Finder, or Bulk Email Finder.\"",
    rows: [
      { label: "How you buy", them: "Monthly or yearly plans. Cancel any time; access runs to the end of the cycle.", us: US.model },
      { label: "Free plan", them: "$0 with 50 credits a month.", us: US.sample },
      { label: "Starter", them: "$49 a month for 2,000 credits a month (24,000 a year on yearly billing).", us: "No credits." },
      { label: "Growth", them: "$149 a month for 10,000 credits a month (120,000 a year on yearly billing).", us: "No credits." },
      { label: "Scale", them: "$299 a month for 25,000 credits a month (300,000 a year on yearly billing).", us: "No credits." },
      { label: "Credits reset", them: "\"Credits reset monthly and don't roll over\" on monthly billing. Yearly plans give all credits upfront.", us: "Nothing resets." },
      { label: "Verification", them: "Verifying an email costs 0.5 credit.", us: US.freshness },
    ],
    chooseThem: ["You need to find or verify emails for companies you already picked.", "You want a cheap monthly plan with a free tier."],
    chooseUs: ["You need to find the businesses first, not only their emails.", "You want one finished list."],
    verdict: "Hunter is a tool for finding emails at companies you already know. BeigeLeads sells lists of businesses by category and place. They work well together: build the list, then use a finder for gaps.",
    sources: [{ label: "Hunter pricing", url: "https://hunter.io/pricing" }],
    faqs: common(),
  },
  {
    slug: "subscription-tools",
    name: "subscription tools",
    tagline: "Plans that renew and credits that reset, versus a list you buy once.",
    about: "Most of the prospecting tools we checked (Apollo, Hunter, Lusha, UpLead, Cognism, ZoomInfo, Seamless.AI, RocketReach) sell access through plans, seats or credits. Their pages describe monthly or annual billing, credits or usage allowances, or custom quotes.",
    rows: [
      { label: "What you pay for", them: "Ongoing access: a plan, seats, credits or usage.", us: US.model },
      { label: "What happens when credits run out", them: "Apollo, Hunter and Lusha pages say credits reset or accumulate by billing cycle; Hunter and Apollo credits do not roll over, Lusha monthly credits roll over up to twice the limit.", us: "Nothing to run out. The file is yours." },
      { label: "Cancelling", them: "Apollo, Lusha and Hunter allow cancelling, effective at the end of the billing period. Annual plans can lock you in for the year (Apollo).", us: "Nothing to cancel after you buy." },
      { label: "Best at", them: "Looking up new people any day, enrichment, sequences, CRM sync.", us: "One fixed list for a campaign." },
      { label: "Weak at", them: "Predicting cost if you only need one list.", us: US.coverage },
    ],
    chooseThem: ["You prospect every week and need new contacts on demand.", "You want enrichment and sending in one tool."],
    chooseUs: ["You need a list once or a few times a year.", "You want to know the full cost before you start."],
    verdict: "Subscriptions fit teams that prospect all the time. A one-time list fits a single push. If you are not sure, take the free masked sample first and see whether a fixed file covers what you need.",
    sources: [
      { label: "Apollo pricing", url: "https://www.apollo.io/pricing?solution=outbound" },
      { label: "Hunter pricing", url: "https://hunter.io/pricing" },
      { label: "Lusha pricing", url: "https://www.lusha.com/pricing/" },
      { label: "UpLead pricing", url: "https://uplead.com/pricing/" },
      { label: "Cognism pricing", url: "https://cognism.com/pricing" },
      { label: "ZoomInfo AI information page", url: "https://www.zoominfo.com/ai-information" },
    ],
    faqs: common(),
  },
];

export const comparisonBySlug = Object.fromEntries(comparisons.map((c) => [c.slug, c]));
