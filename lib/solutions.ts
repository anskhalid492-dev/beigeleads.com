// Solutions content. Written to be honest: no statistics, no guaranteed results, and only the
// fields that exist in the catalog (FIELDS). Products are real catalog slugs. NEEDS LEGAL REVIEW
// for the compliance wording (see TODO-BEFORE-LAUNCH.md).
import { solutionFaqs } from "./solution-faqs";
import { solutionCopy, type Pain } from "./solution-copy";
import { FIELDS } from "./catalog";

export type Field = (typeof FIELDS)[number];

export type Solution = {
  slug: string;
  name: string;
  /** shown in the footer and on cards */
  navName: string;
  icon: "Target" | "MailPlus" | "Crosshair" | "Presentation" | "ChartColumn" | "Store" | "HeartPulse" | "House" | "UsersRound" | "ShoppingCart" | "Sparkles" | "Compass";
  tagline: string;
  seoTitle: string;
  seoDescription: string;
  h1: string;
  lede: string;
  ctaLabel: string;
  /** four labels drawn as the hero's "from list to result" strip */
  flow: readonly [string, string, string, string];
  challenge: { heading: string; paragraphs: readonly string[] };
  helps: readonly { t: string; d: string }[];
  productSlugs: readonly string[];
  productNote: string;
  applications: readonly { t: string; d: string }[];
  beneficiaries: readonly string[];
  fieldUse: Partial<Record<Field, string>>;
  steps: readonly { t: string; d: string }[];
  related: readonly string[];
  pains: readonly Pain[];
  faqs: readonly (readonly [string, string])[];
  finalHeading: string;
  finalText: string;
};

const base: readonly Omit<Solution, "faqs" | "pains">[] = [
  {
    slug: "b2b-lead-generation",
    name: "B2B Lead Generation",
    navName: "B2B Lead Generation",
    icon: "Target",
    tagline: "Fill your pipeline with businesses that match who you sell to.",
    seoTitle: "B2B Lead Generation Databases",
    seoDescription:
      "Build a B2B prospect list from verified business contact databases. Pay once, check a masked sample first, and download a file you own.",
    h1: "B2B lead generation that starts with a list you can inspect",
    lede:
      "Good lead generation begins with knowing which businesses to talk to. BeigeLeads gives you ready-made business contact databases, sorted by industry and place, that you can sample before you pay and keep after you do.",
    ctaLabel: "Get a free sample",
    flow: ["Pick an industry", "Check the sample", "Download the file", "Start outreach"],
    challenge: {
      heading: "Most lead generation stalls before the first message",
      paragraphs: [
        "Teams that sell to other businesses rarely lack ideas for what to say. They lack a clean, current list of who to say it to. Building one by hand means hours of copying names from maps, websites and directories, and the result is already ageing by the time it is finished.",
        "Subscription lead platforms solve the speed problem but add a new one: you rent access, and when the plan ends the list goes with it. For a small team with a clear target market, a monthly fee for data you use in bursts is hard to justify.",
        "The other quiet cost is quality. A list with outdated emails sends your messages to nobody and, over time, teaches mail providers to distrust your domain.",
      ],
    },
    helps: [
      { t: "Lists ready to download", d: "Each database is already collected, cleaned and tagged by industry and place, so you skip the research stage." },
      { t: "Checked before you buy", d: "BeigeLeads refreshes its databases every 90 days. The list page shows when it was last done." },
      { t: "See it first", d: "Every list shows a masked sample, and you can request a free sample by email before spending anything." },
      { t: "Pay once, keep the file", d: "No subscription and no account. The file is yours to use under the lawful use policy." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "These lists are available to explore now. If your target market is not here yet, tell us and we will say whether it is on the way.",
    applications: [
      { t: "Build a first target list", d: "Pick one industry and one country and load the file into your CRM as a ready pipeline of accounts." },
      { t: "Test a market before committing", d: "Buy the smallest package for a new industry and learn whether the segment responds before you invest more." },
      { t: "Feed several channels from one file", d: "The same list can support email, phone calls and account research, because it carries email, phone and website." },
      { t: "Refresh a stale CRM", d: "Compare a new list against your existing accounts to find businesses you are missing and contacts that have changed." },
      { t: "Segment by place", d: "Use the city and country fields to run local or regional campaigns instead of one national blast." },
    ],
    beneficiaries: ["Small B2B sales teams", "Founders doing their own outreach", "Software vendors", "Equipment and supply sellers", "Consultants and freelancers", "Franchise and distribution teams"],
    fieldUse: {
      "Business name": "Match records to accounts already in your CRM and avoid duplicates.",
      Email: "The main outreach channel for most B2B campaigns.",
      Phone: "A second channel for follow-up calls.",
      Website: "Quick research on what a business does before you write to it.",
      City: "Segment campaigns by place.",
      Country: "Keep campaigns inside the regions you may lawfully contact.",
    },
    steps: [
      { t: "Choose a list", d: "Browse by industry and country, or request one we do not have yet." },
      { t: "Inspect a sample", d: "Look at the masked rows or ask for a free sample by email." },
      { t: "Pay once in crypto", d: "No account and no subscription." },
      { t: "Download and use", d: "A download link arrives by email. Load the file into your tools." },
    ],
    related: ["cold-email-marketing", "sales-prospecting", "business-expansion"],
    finalHeading: "Start with a list you can see before you pay",
    finalText: "Pick an industry, inspect the masked sample and download a list built for B2B outreach.",
  },
  {
    slug: "cold-email-marketing",
    name: "Cold Email Marketing",
    navName: "Cold Email Marketing",
    icon: "MailPlus",
    tagline: "Reach the right inboxes with a list that bounces less.",
    seoTitle: "Verified Email Lists for Cold Email Campaigns",
    seoDescription:
      "Business email lists checked by our team and re-verified every 90 days, so cold email campaigns start with fewer bounces. Sample first, pay once.",
    h1: "Cold email lists built to protect your sender reputation",
    lede:
      "A cold email campaign is only as good as its list. BeigeLeads databases carry business emails that our own team checked, so your first send goes to real mailboxes instead of a pile of bounces.",
    ctaLabel: "Request a free sample",
    flow: ["Verified list", "Warm up domain", "Send in small batches", "Remove bounces and opt-outs"],
    challenge: {
      heading: "Bounces quietly wreck cold email",
      paragraphs: [
        "Mail providers watch how often your messages bounce. A list full of dead addresses tells them you do not know your recipients, and they respond by sending more of your mail to spam, including messages to good contacts.",
        "That damage is slow and hard to see. Reply rates dip, then dip again, and by the time the cause is obvious the sending domain has a poor record that takes weeks to repair.",
        "Teams also run into the legal side. Rules differ from country to country, and a sender is responsible for honouring opt-outs and for who they choose to contact.",
      ],
    },
    helps: [
      { t: "Refreshed every 90 days", d: "BeigeLeads refreshes its databases every 90 days, so you start from current data." },
      { t: "Re-checked every 90 days", d: "Addresses go stale as people move on, so all data is re-verified every 90 days." },
      { t: "Opt-outs applied first", d: "People who asked to be removed are taken out before your file is created, and you keep your own suppression list too." },
      { t: "Be realistic about limits", d: "No check is perfect. Some servers accept every address, so a small share can still bounce. Above a 5% bounce rate, our Refund & Returns policy replaces the bounced emails." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "Each list shows its last-verified date so you can judge how fresh it is before you send.",
    applications: [
      { t: "Send in small batches", d: "Start with a few hundred contacts, watch bounces and replies, then scale. A large list lets you test several messages on separate slices." },
      { t: "Personalise with the website", d: "The website field lets you write one specific line about what each business does instead of a generic opener." },
      { t: "Split by place", d: "Use city and country to send at sensible local times and to keep to regions you may lawfully email." },
      { t: "Clean your existing list", d: "Check a new list against your old one to drop duplicates and find businesses you have never contacted." },
      { t: "Keep opt-outs clean", d: "Add every unsubscribe and bounce to your own do-not-contact list so nobody is emailed twice." },
    ],
    beneficiaries: ["Outbound sales teams", "Agencies running outreach for clients", "Software start-ups", "Freelancers and consultants", "Recruiters", "Partnership managers"],
    fieldUse: {
      Email: "The address you send to. It must pass our SMTP check to stay on a list.",
      "Business name": "Use it in the greeting or subject line of a message about the business.",
      Website: "Research the business so each message is relevant.",
      City: "Time your sends and tailor local references.",
      Country: "Decide which messages and legal rules apply.",
    },
    steps: [
      { t: "Pick a list and read the sample", d: "Check that the fields and places match the campaign." },
      { t: "Download after payment", d: "Pay once in crypto and get a secure link by email." },
      { t: "Prepare your sending", d: "Authenticate your domain and start with low volumes." },
      { t: "Send, then clean", d: "Remove bounces and opt-outs from your own list after every send." },
    ],
    related: ["b2b-lead-generation", "marketing-agencies", "sales-prospecting"],
    finalHeading: "Send your next campaign to a list you trust",
    finalText: "Request a free masked sample and see exactly what a BeigeLeads email list looks like before you send a single message.",
  },
  {
    slug: "sales-prospecting",
    name: "Sales Prospecting",
    navName: "Sales Prospecting",
    icon: "Crosshair",
    tagline: "Give reps accounts to call instead of lists to build.",
    seoTitle: "Sales Prospecting Lists for SDRs and Reps",
    seoDescription:
      "Hand sales reps ready-made business lists with phone, email and website so they spend time selling, not searching. One-time purchase, sample first.",
    h1: "Sales prospecting without the Monday-morning list hunt",
    lede:
      "Reps earn their pay in conversations, not in spreadsheets. BeigeLeads lists put phone, email and website for each business in one file, so prospecting starts the moment the file opens.",
    ctaLabel: "See a sample list",
    flow: ["Territory chosen", "Accounts loaded", "Calls and emails", "Notes in CRM"],
    challenge: {
      heading: "Reps spend too much time looking for who to call",
      paragraphs: [
        "In many sales teams, a large part of the week goes on finding prospects: searching maps, opening websites, hunting for a phone number. Each lookup is small, but together they push selling to the edges of the day.",
        "Managers feel it as uneven territories. One rep has a full list, another is still building one, and nobody is sure which accounts have already been worked.",
        "A shared, consistent list fixes the starting point. Everyone begins from the same fields and the same coverage.",
      ],
    },
    helps: [
      { t: "Phone, email and website together", d: "Reps can call first, email after, and read the website between the two, all from one row." },
      { t: "Territories by place", d: "City and country fields let you divide a list into clean territories." },
      { t: "Consistent data", d: "Every record uses the same fields, so imports into a CRM stay tidy." },
      { t: "Sample before you commit", d: "Reps can look at a masked sample and tell you whether the accounts look right." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "Choose the vertical your team sells into. If it is missing, request a category and tell us your territory.",
    applications: [
      { t: "Split a list into territories", d: "Sort by city, give each rep a slice, and avoid two reps calling the same business." },
      { t: "Build a call block", d: "Pull a hundred accounts with phone numbers for a focused afternoon of calling." },
      { t: "Pair calls with email", d: "Call, then send a short follow-up to the email in the same row." },
      { t: "Enrich an account plan", d: "Use the website field to research each account before a first meeting." },
      { t: "Re-engage dormant territory", d: "Compare a fresh list with your CRM to find new businesses in a territory you stopped working." },
    ],
    beneficiaries: ["SDR and BDR teams", "Field sales reps", "Sales managers", "Account executives", "Independent sales agents", "Channel and distribution managers"],
    fieldUse: {
      Phone: "The core field for call-led prospecting.",
      Email: "Follow-up after a call, or the first touch.",
      Website: "Pre-call research.",
      "Business name": "Deduplicate against CRM accounts.",
      Address: "Plan field visits and routes.",
      City: "Divide territories.",
    },
    steps: [
      { t: "Define a territory", d: "Pick the industry, country and cities your team covers." },
      { t: "Review a sample", d: "Check the columns your reps will work with." },
      { t: "Buy and import", d: "Pay once, download the file, import into your CRM." },
      { t: "Work and track", d: "Log calls and outcomes against each account." },
    ],
    related: ["b2b-lead-generation", "cold-email-marketing", "local-business-marketing"],
    finalHeading: "Give your reps something to dial today",
    finalText: "Request a free sample and let your team judge the accounts before you buy.",
  },
  {
    slug: "marketing-agencies",
    name: "Marketing Agencies",
    navName: "Marketing Agencies",
    icon: "Presentation",
    tagline: "Find new clients without renting a data platform.",
    seoTitle: "Business Lists for Marketing Agencies",
    seoDescription:
      "Marketing agencies can find local businesses that need help with a one-time purchase business list: name, phone, email and website. See a sample first.",
    h1: "Prospect lists for marketing agencies that want new clients",
    lede:
      "Agencies are great at getting other businesses seen and often too busy to find their own next client. A BeigeLeads list gives you a stack of local businesses to pitch, with the contact details already attached.",
    ctaLabel: "Get a free sample",
    flow: ["Pick a niche", "Review websites", "Pitch with a specific idea", "Track replies"],
    challenge: {
      heading: "The agency that never markets itself",
      paragraphs: [
        "Client work comes first, so agency prospecting happens in gaps. It starts, stops, and restarts, and the pipeline swings between feast and famine as projects end.",
        "Retainer-based data tools add another monthly cost to a business whose revenue already moves around. An agency may need a list intensely for a month and not at all the next.",
        "The agencies that win outbound tend to pitch something specific to a niche. That needs a list of that niche, not a generic business directory.",
      ],
    },
    helps: [
      { t: "Niche lists by industry and city", d: "Choose the vertical you already serve well and the cities you can support." },
      { t: "Websites included", d: "Review each business's site first, then pitch a concrete improvement instead of a generic offer." },
      { t: "No retainer", d: "Buy a list when you are ready to prospect. No subscription to cancel." },
      { t: "White-label friendly", d: "If you prospect on behalf of clients, check the licence terms and our lawful use policy first." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "Agencies often start with one local-service niche, such as dental practices or restaurants, and build a case study there.",
    applications: [
      { t: "Audit-led outreach", d: "Open a business's website, spot one fixable issue, and open your email with it." },
      { t: "Niche positioning", d: "Become the agency for dental practices or restaurants in a region and write messages that speak to that niche." },
      { t: "Seasonal campaigns", d: "Reach ski shops before the season, or restaurants before the holiday rush, using a list sized to the campaign." },
      { t: "Lead lists for clients", d: "Where the licence allows, support a client's own outreach with a list tailored to their market." },
      { t: "Keep a standing pipeline", d: "Send a few messages a day from one list over several weeks rather than one burst." },
    ],
    beneficiaries: ["SEO and local SEO agencies", "Social media agencies", "Web design studios", "Paid ads specialists", "Branding studios", "Freelance marketers"],
    fieldUse: {
      Website: "Spot what to improve and personalise the pitch.",
      Email: "Deliver the pitch.",
      Phone: "Follow up personally with promising prospects.",
      "Business name": "Name the business in your outreach and in your CRM.",
      City: "Pitch local proof and local competitors.",
    },
    steps: [
      { t: "Choose a niche", d: "Pick the industry you want to be known for." },
      { t: "Inspect the sample", d: "Check the columns you will use for your audit-led pitch." },
      { t: "Buy once", d: "Pay in crypto and download the file." },
      { t: "Pitch and record", d: "Track replies and learn which messages land." },
    ],
    related: ["cold-email-marketing", "local-business-marketing", "healthcare-marketing"],
    finalHeading: "Find your agency's next ten clients",
    finalText: "Request a sample list for your niche and look at the businesses before you buy.",
  },
  {
    slug: "market-research",
    name: "Market Research",
    navName: "Market Research",
    icon: "ChartColumn",
    tagline: "Map who is in a market before you decide how to enter it.",
    seoTitle: "Business Databases for Market Research",
    seoDescription:
      "Use structured business lists to map competitors, suppliers and customers by place and industry. Download a file once and analyse it your own way.",
    h1: "Market research from a structured list of real businesses",
    lede:
      "Before you size a market, you need to see it. A BeigeLeads list is a structured snapshot of businesses in an industry and place that you can sort, count and map in the tools you already use.",
    ctaLabel: "See a sample",
    flow: ["Choose a market", "Load the file", "Count and map", "Decide"],
    challenge: {
      heading: "Market size guesses are only as good as the list behind them",
      paragraphs: [
        "Research reports tell you how big a market is in general terms. They rarely tell you who exactly is in it, where they are, and how crowded each city looks.",
        "Analysts often build this view by hand, one directory at a time, and the process is hard to repeat. A year later nobody remembers which sources were used.",
        "A clean, consistent list gives you a repeatable starting point and a record of what was in the market on a given date.",
      ],
    },
    helps: [
      { t: "A consistent table to analyse", d: "Every record uses the same fields, so you can count and group without cleaning first." },
      { t: "Place built in", d: "City and country fields let you see where businesses cluster and where gaps are." },
      { t: "Dated snapshot", d: "Each list shows its last-verified date, so your analysis can say when the data was taken." },
      { t: "Your tools, your method", d: "The file (CSV, Excel or TXT) opens in Excel, Sheets, BI tools and scripts. We do not lock you into a dashboard." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "More industries and countries are added list by list.",
    applications: [
      { t: "Count businesses per city", d: "Group rows by city to see where an industry is dense and where it is thin." },
      { t: "Compare two industries", d: "Load two lists side by side to compare coverage across the same cities." },
      { t: "Find white space", d: "Look for cities with few businesses relative to demand you already know about." },
      { t: "Build a competitor shortlist", d: "Use the website field to review who competes in a place and how they present themselves." },
      { t: "Validate a decision", d: "Check a hunch about a market against an actual list before you commit budget." },
    ],
    beneficiaries: ["Market analysts", "Strategy teams", "Investors and advisers", "Founders validating an idea", "Consultants", "Students and researchers"],
    fieldUse: {
      City: "Cluster analysis and territory maps.",
      Country: "Compare markets across borders.",
      "Business name": "Deduplicate and track individual businesses.",
      Website: "Qualitative review of how competitors present themselves.",
      Address: "Geocode businesses and map them.",
    },
    steps: [
      { t: "Define the question", d: "For example: how many dental practices are in each of these cities?" },
      { t: "Choose the matching list", d: "Look at the fields and coverage on the product page." },
      { t: "Download and load", d: "Open the file in your analysis tool." },
      { t: "Record the snapshot date", d: "Note the last-verified date next to your findings." },
    ],
    related: ["business-expansion", "ecommerce-market-research", "b2b-lead-generation"],
    finalHeading: "See the market before you size it",
    finalText: "Request a sample and check whether the coverage matches your research question.",
  },
  {
    slug: "local-business-marketing",
    name: "Local Business Marketing",
    navName: "Local Business Marketing",
    icon: "Store",
    tagline: "Reach businesses in your own city, street by street.",
    seoTitle: "Local Business Lists for Local Marketing",
    seoDescription:
      "Find businesses by city with address, phone, email and website. A one-time purchase list for local marketing, partnerships and neighbourhood outreach.",
    h1: "Local marketing starts with knowing who is down the road",
    lede:
      "Some of the best prospects are a short drive away. BeigeLeads lists include address, city, phone, email and website, so you can plan local outreach that feels local.",
    ctaLabel: "Request a free sample",
    flow: ["Pick your city", "Sort by area", "Visit or call", "Follow up by email"],
    challenge: {
      heading: "Local outreach is hard to scale and easy to get wrong",
      paragraphs: [
        "A local business owner can tell in one second whether a message was written for them or sent to everyone. Generic outreach gets ignored, and local reputation is hard to rebuild.",
        "Finding every relevant business in a neighbourhood takes time, and the list is old as soon as someone opens or closes.",
        "Local marketers also work in more than one way: a visit, a call, a flyer, an email. They need the address as much as the inbox.",
      ],
    },
    helps: [
      { t: "Address and city included", d: "Plan visits, mailers and neighbourhood campaigns from the same file." },
      { t: "Several ways to reach out", d: "Phone, email and website sit in one row, so you can pick the right channel for each business." },
      { t: "Small packages", d: "A starter-size list is often enough for one city or one campaign." },
      { t: "Checked regularly", d: "All data is re-verified every 90 days, with the date shown on each list." },
    ],
    productSlugs: ["restaurants-us", "dentists-us", "ski-shops-us"],
    productNote: "Local-service businesses such as restaurants, dental practices and shops are good places to start.",
    applications: [
      { t: "Neighbourhood route planning", d: "Sort by address and plan a day of visits to introduce a product or service." },
      { t: "Local partnership offers", d: "Find complementary businesses nearby for cross-promotions." },
      { t: "Event invitations", d: "Invite local businesses to a launch, trade day or workshop by email and phone." },
      { t: "Directory and listing outreach", d: "Offer a local guide, newsletter or directory listing to businesses in your area." },
      { t: "Supplier introductions", d: "Introduce a local delivery, cleaning or maintenance service to nearby businesses." },
    ],
    beneficiaries: ["Local service providers", "Chambers of commerce and business groups", "Local newsletters and guides", "Franchise owners", "Delivery and maintenance services", "Community organisers"],
    fieldUse: {
      Address: "Plan routes and visits.",
      City: "Keep a campaign to one place.",
      Phone: "Call to arrange a visit.",
      Email: "Send details after a visit or call.",
      Website: "Learn what a business does before you walk in.",
      "Business name": "Address the right person's business correctly.",
    },
    steps: [
      { t: "Choose a city and industry", d: "Start small and local." },
      { t: "Check the sample", d: "See the address and contact columns." },
      { t: "Buy and sort", d: "Pay once and sort the file by area." },
      { t: "Reach out in person and online", d: "Mix visits, calls and email." },
    ],
    related: ["sales-prospecting", "marketing-agencies", "business-expansion"],
    finalHeading: "Start with the businesses in your own city",
    finalText: "Request a sample and see who is nearby before you buy.",
  },
  {
    slug: "healthcare-marketing",
    name: "Healthcare Marketing",
    navName: "Healthcare Marketing",
    icon: "HeartPulse",
    tagline: "Reach dental and clinic businesses with supplies, software and services.",
    seoTitle: "Healthcare Business Lists for Marketers and Suppliers",
    seoDescription:
      "Reach dental practices and other healthcare businesses with a one-time purchase contact list. Business details only, never patient data. Free sample first.",
    h1: "Healthcare marketing that reaches the practice, not the patient",
    lede:
      "Suppliers, software companies and service providers sell to healthcare businesses every day. BeigeLeads gives you business contact details for practices such as dental clinics, so you can reach the people who run them.",
    ctaLabel: "Get the dentist list sample",
    flow: ["Choose a practice type", "Review the sample", "Reach the practice", "Respect opt-outs"],
    challenge: {
      heading: "Healthcare is a crowded, careful market to approach",
      paragraphs: [
        "Practice owners are busy and sceptical of cold approaches, partly because healthcare suppliers contact them constantly. A message has to be relevant to land.",
        "Sellers also work under extra care. Healthcare contact data should describe businesses, not patients, and anything that touches personal health information is a different legal matter altogether.",
        "Finding the right practices in the right places, with working contact details, is the first step toward a relevant message.",
      ],
    },
    helps: [
      { t: "Business details only", d: "Our lists describe businesses, such as a dental practice, with name, address, phone, email and website. They do not contain patient information." },
      { t: "Practice types you can target", d: "Start with dental practices and clinics, with other healthcare categories added list by list." },
      { t: "Checked by our team", d: "BeigeLeads refreshes its databases every 90 days." },
      { t: "Sample first", d: "See the masked rows or request a free sample before you buy." },
    ],
    productSlugs: ["dentists-us"],
    productNote: "Dental practices are available now. Other healthcare categories, such as clinics and physicians, can be requested.",
    applications: [
      { t: "Introduce equipment and supplies", d: "Reach practices that buy chairs, scanners, instruments and consumables." },
      { t: "Offer practice software", d: "Approach owners who choose scheduling, imaging and billing tools." },
      { t: "Promote marketing services", d: "Pitch patient-acquisition services to practices that want a steadier flow of new patients." },
      { t: "Recruit for clinics", d: "Contact practices that may be hiring hygienists, assistants or clinicians." },
      { t: "Invite to events and webinars", d: "Reach practices in one city for a local training day or supplier event." },
    ],
    beneficiaries: ["Dental equipment suppliers", "Practice management software vendors", "Healthcare marketing agencies", "Healthcare recruiters", "Medical product manufacturers", "Training and continuing-education providers"],
    fieldUse: {
      "Business name": "Name the practice in your outreach.",
      Email: "The first point of contact for most approaches.",
      Phone: "Follow up with a practice manager.",
      Website: "Learn which services a practice offers before you write.",
      City: "Run local events and regional campaigns.",
      Address: "Plan supplier visits.",
    },
    steps: [
      { t: "Pick the practice type", d: "Start with the dentist list or request another category." },
      { t: "Read the sample", d: "Check that the fields suit your outreach." },
      { t: "Pay once", d: "Download a file after your payment is confirmed." },
      { t: "Reach out responsibly", d: "Follow the lawful use policy and honour opt-outs." },
    ],
    related: ["b2b-lead-generation", "recruitment-staffing", "marketing-agencies"],
    finalHeading: "Reach the practices you serve",
    finalText: "Request the dentist list sample and see the business details before you buy.",
  },
  {
    slug: "real-estate-prospecting",
    name: "Real Estate Prospecting",
    navName: "Real Estate Prospecting",
    icon: "House",
    tagline: "Find businesses that need space, and the neighbours around them.",
    seoTitle: "Business Lists for Commercial Real Estate Prospecting",
    seoDescription:
      "Commercial agents and property services can find local businesses by city with address, phone and email. Sample first, one-time purchase.",
    h1: "Real estate prospecting that begins with the businesses on the street",
    lede:
      "Commercial space is leased and sold to businesses. BeigeLeads lists show you the businesses in a city, with address and contact details, so you can approach tenants, owners and neighbours with a reason to talk.",
    ctaLabel: "Request a free sample",
    flow: ["Pick a district", "List nearby businesses", "Call or visit", "Log interest"],
    challenge: {
      heading: "Property leads come from knowing who is where",
      paragraphs: [
        "Commercial agents, tenant-rep brokers and property service firms all need to know which businesses operate in a district, which are growing, and who might be looking for a different space.",
        "Public records show buildings, but not always the tenants inside them. A walk or a drive helps, and does not scale.",
        "A list of businesses with addresses turns a district into a call sheet and a route.",
      ],
    },
    helps: [
      { t: "Addresses included", d: "Every record carries a business address and city, so you can sort a list by area and plan visits." },
      { t: "Contact details for follow-up", d: "Phone and email sit alongside the address, so a visit can be followed by a call or message." },
      { t: "Industry-based lists", d: "Target the sectors that tend to lease space, such as restaurants, dental practices and retail." },
      { t: "Honest about gaps", d: "Yes, we sell lists of real estate agents and landlords. Request the one you need." },
    ],
    productSlugs: ["restaurants-us", "dentists-us", "ski-shops-us"],
    productNote: "These are lists of operating businesses, which are useful as tenant and buyer prospects. Real estate agent and landlord lists are available on request.",
    applications: [
      { t: "Tenant prospecting", d: "Contact restaurants, practices and shops in a district about available space or lease renewals." },
      { t: "Neighbour outreach for a listing", d: "Tell nearby businesses about a space coming to market before it is advertised widely." },
      { t: "Route planning", d: "Sort by address and plan a day of introductions on foot." },
      { t: "Property services", d: "Offer cleaning, maintenance, security or fit-out to businesses in a building." },
      { t: "Market snapshots", d: "Count businesses by industry in a district to support a pitch to an owner or investor." },
    ],
    beneficiaries: ["Commercial real estate agents", "Tenant-rep brokers", "Property managers", "Fit-out and maintenance firms", "Co-working and flex-space operators", "Property investors"],
    fieldUse: {
      Address: "Group by street or area and plan visits.",
      City: "Choose the district or city to cover.",
      "Business name": "Match to tenants in a building.",
      Phone: "Book a viewing or a call.",
      Email: "Send particulars after a call.",
      Website: "See the size and style of a business before you approach.",
    },
    steps: [
      { t: "Choose a city and industry", d: "Start with the sectors that fit the space you handle." },
      { t: "Review the sample", d: "Check the address and contact columns." },
      { t: "Buy and sort", d: "Download the file and sort by area." },
      { t: "Approach and record", d: "Mix visits, calls and email, and note interest." },
    ],
    related: ["local-business-marketing", "business-expansion", "sales-prospecting"],
    finalHeading: "Turn a district into a call sheet",
    finalText: "Request a sample and look at the businesses in the area you cover.",
  },
  {
    slug: "recruitment-staffing",
    name: "Recruitment & Staffing",
    navName: "Recruitment & Staffing",
    icon: "UsersRound",
    tagline: "Find employers to work with before they post the job.",
    seoTitle: "Business Lists for Recruitment and Staffing Agencies",
    seoDescription:
      "Recruiters and staffing firms can find employers by industry and city with a one-time purchase business list. Business contacts only, not candidate data.",
    h1: "Recruitment business development: find the employers first",
    lede:
      "A recruitment firm grows when it signs new employers. BeigeLeads lists give you businesses by industry and city, so you can introduce your service before a competitor is the first to call.",
    ctaLabel: "Get a free sample",
    flow: ["Choose an industry", "Find local employers", "Introduce your service", "Agree a brief"],
    challenge: {
      heading: "Recruiters spend their time on candidates and neglect client development",
      paragraphs: [
        "A desk is usually busy with live roles. New-client calls happen in the evenings or not at all, and the client base slowly narrows to a few large accounts.",
        "Employers, in turn, hear from agencies constantly. The ones that respond tend to be contacted by someone who already understands their industry and city.",
        "Staffing firms that specialise, for example in dental or hospitality staff, need lists of that specialism, not a general directory.",
      ],
    },
    helps: [
      { t: "Employers by industry", d: "Choose the sector you place in, such as dental practices or restaurants." },
      { t: "Local focus", d: "City and country fields let you cover one labour market at a time." },
      { t: "Phone and email together", d: "Call the business, then follow up by email with a short introduction." },
      { t: "Businesses, not candidates", d: "Our lists describe employers. They do not contain job seekers or candidate profiles." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "These industries hire constantly and often rely on agencies and temporary staff, especially in busy seasons.",
    applications: [
      { t: "Win a first brief", d: "Offer help with one hard-to-fill role at a business that fits your specialism." },
      { t: "Seasonal staffing", d: "Contact ski shops before winter or restaurants before the holidays to offer temporary staff." },
      { t: "Build a niche desk", d: "Become the agency for one sector in one city and write to every business in it." },
      { t: "Reactivate lapsed clients", d: "Compare a list with your CRM to find employers you stopped talking to." },
      { t: "Market-map before opening an office", d: "Count employers in a city before you decide to recruit there." },
    ],
    beneficiaries: ["Staffing agencies", "Executive search firms", "Independent recruiters", "HR consultancies", "Temporary and seasonal staffing providers", "Training providers"],
    fieldUse: {
      "Business name": "Address the employer and avoid existing clients.",
      Phone: "Introduce your service by call.",
      Email: "Follow up with a short summary.",
      Website: "Check the careers page and see which roles a business advertises.",
      City: "Cover one labour market at a time.",
    },
    steps: [
      { t: "Pick your sector", d: "Choose the industry you specialise in." },
      { t: "Read the sample", d: "Check that the fields suit business development." },
      { t: "Buy once", d: "Pay in crypto and download the file." },
      { t: "Call and follow up", d: "Introduce yourself and offer one concrete service." },
    ],
    related: ["healthcare-marketing", "sales-prospecting", "b2b-lead-generation"],
    finalHeading: "Find your next client employers",
    finalText: "Request a free sample and look at the businesses before you spend anything.",
  },
  {
    slug: "ecommerce-market-research",
    name: "E-commerce Market Research",
    navName: "E-commerce Research",
    icon: "ShoppingCart",
    tagline: "Understand the retailers, suppliers and competitors in your niche.",
    seoTitle: "Retailer and Supplier Lists for E-commerce Research",
    seoDescription:
      "E-commerce teams can map retailers, stockists and suppliers in a niche with a structured business list. Download a file once and research it your way.",
    h1: "E-commerce research starts with the businesses already selling in your niche",
    lede:
      "Before you launch a product or open wholesale, it helps to know who already sells in your niche. A BeigeLeads list of retailers gives you names, places and websites to study, and contacts to approach.",
    ctaLabel: "See a sample",
    flow: ["Choose a niche", "Map retailers", "Study their sites", "Approach stockists"],
    challenge: {
      heading: "You cannot see the whole niche from inside your own store",
      paragraphs: [
        "Online sellers often know their direct competitors but not the many smaller shops that serve the same customers, whether they are local retailers, specialists or rental businesses.",
        "Brands that want to grow through wholesale face the same blindspot. Without a list of stockists, they approach a handful of obvious names and miss the rest.",
        "Research done by hand is slow and hard to repeat, which makes it rare.",
      ],
    },
    helps: [
      { t: "Retailers in one file", d: "A list of shops in a niche, with websites, gives you a starting point for competitor and stockist research." },
      { t: "Websites to study", d: "Review each retailer's site to see how they present products and pricing." },
      { t: "Contacts for wholesale", d: "Email and phone let you approach shops about stocking your range." },
      { t: "A dated snapshot", d: "Each list shows its last-verified date, which helps you compare a niche over time." },
    ],
    productSlugs: ["ski-shops-us", "restaurants-us"],
    productNote: "Ski shops are an example of a specialist retail niche. If your niche is different, request a category.",
    applications: [
      { t: "Stockist outreach", d: "Contact specialist shops to carry your brand and offer wholesale terms." },
      { t: "Competitor mapping", d: "Review retailers by city to see how crowded a niche is in each place." },
      { t: "Supplier discovery", d: "Find businesses that rent, repair or supply goods around your product." },
      { t: "Channel testing", d: "Start with one city's retailers to test wholesale before a national push." },
      { t: "Seasonal planning", d: "For a seasonal niche, plan outreach before the busy months." },
    ],
    beneficiaries: ["Direct-to-consumer brands", "Wholesalers and distributors", "Marketplace sellers", "Product researchers", "E-commerce agencies", "Supply-chain analysts"],
    fieldUse: {
      Website: "Study product range, prices and presentation.",
      "Business name": "Build a competitor and stockist register.",
      City: "See where a niche is concentrated.",
      Email: "Approach a shop about stocking your range.",
      Phone: "Follow up on a wholesale offer.",
    },
    steps: [
      { t: "Choose the niche", d: "Pick the retail category that matches your product." },
      { t: "Review the sample", d: "Check the fields you will research." },
      { t: "Download the file", d: "Pay once in crypto and open it in your analysis tool." },
      { t: "Research, then approach", d: "Study the sites, then contact the most promising shops." },
    ],
    related: ["market-research", "business-expansion", "b2b-lead-generation"],
    finalHeading: "Map your niche before you commit to it",
    finalText: "Request a sample and see which retailers you could study and approach.",
  },
  {
    slug: "influencer-marketing",
    name: "Influencer Marketing",
    navName: "Influencer Marketing",
    icon: "Sparkles",
    tagline: "Find brands and businesses that work with creators.",
    seoTitle: "Business Contacts for Influencer and Creator Partnerships",
    seoDescription:
      "Creators, talent managers and agencies can find businesses to pitch for sponsorships and partnerships. Business contact lists, one-time purchase, sample first.",
    h1: "Influencer marketing begins with a brand that is ready to say yes",
    lede:
      "Creators and talent agencies spend as much time pitching brands as making content. BeigeLeads lists give you businesses to approach for partnerships, such as local restaurants, shops and practices that want attention in their area.",
    ctaLabel: "Request a free sample",
    flow: ["Choose a local niche", "Find the businesses", "Pitch a collaboration", "Agree a deal"],
    challenge: {
      heading: "Creators wait for brands to find them",
      paragraphs: [
        "Large brands have formal influencer programmes. Smaller businesses, which often need local visibility the most, do not know where to start and rarely approach creators.",
        "That leaves an opening for creators and agencies who pitch directly, but they need a list of businesses in a niche and city, with a way to contact them.",
        "A specific, local proposal is far easier to accept than a generic request for a free product.",
      ],
    },
    helps: [
      { t: "Local businesses to pitch", d: "Restaurants, dental practices and shops that want local attention are natural partners for local creators." },
      { t: "Contact details included", d: "Email, phone and website help you send a personal proposal." },
      { t: "City-level targeting", d: "Match a creator's audience location with businesses in the same city." },
      { t: "Creator lists are on the way", d: "Yes, we sell creator lists. Request the platform and niche you need." },
    ],
    productSlugs: ["restaurants-us", "ski-shops-us", "dentists-us"],
    productNote: "Today's lists are of businesses, which is who creators pitch. Lists of creators and influencers are available on request.",
    applications: [
      { t: "Pitch a local collaboration", d: "Offer a restaurant or shop a video series, a review or an event in exchange for a fee or product." },
      { t: "Build an agency roster of clients", d: "Talent agencies can find businesses that need creator campaigns." },
      { t: "Plan seasonal campaigns", d: "Approach ski shops before winter with creator content tied to the season." },
      { t: "Research who sponsors in a niche", d: "Check business websites to see which already work with creators." },
      { t: "Package local deals", d: "Offer a bundle across several businesses in one city." },
    ],
    beneficiaries: ["Independent creators", "Talent managers", "Influencer agencies", "Social media managers", "UGC creators", "Event hosts and community builders"],
    fieldUse: {
      "Business name": "Address the business correctly in your pitch.",
      Website: "Study the brand and its current content before pitching.",
      Email: "Send your proposal.",
      Phone: "Follow up personally.",
      City: "Match the business to your audience's location.",
    },
    steps: [
      { t: "Choose a niche and a city", d: "Match your audience." },
      { t: "Check the sample", d: "Make sure the contact columns suit a personal pitch." },
      { t: "Buy once", d: "Pay in crypto and download the file." },
      { t: "Pitch a specific idea", d: "Send a short, concrete proposal and follow up." },
    ],
    related: ["marketing-agencies", "local-business-marketing", "cold-email-marketing"],
    finalHeading: "Pitch the businesses that need your audience",
    finalText: "Request a free sample and look at the local businesses you could approach.",
  },
  {
    slug: "business-expansion",
    name: "Business Expansion & Market Entry",
    navName: "Business Expansion",
    icon: "Compass",
    tagline: "Understand a new city or country before you open there.",
    seoTitle: "Market Entry and Business Expansion Data",
    seoDescription:
      "Planning a new city or country? Map local businesses, find partners and early customers with a structured business list. One-time purchase, sample first.",
    h1: "Expanding into a new market? Start by meeting the businesses already there",
    lede:
      "Entering a new city or country is easier with a map of who operates there. BeigeLeads lists give you local businesses, their locations and contact details, so you can find partners, suppliers and first customers.",
    ctaLabel: "See a sample",
    flow: ["Pick a new market", "Map who operates there", "Find partners", "Land first customers"],
    challenge: {
      heading: "A new market looks very different from the outside",
      paragraphs: [
        "A company expanding to a new place has to learn it fast: who operates there, where they cluster, who could be a partner and who will compete.",
        "Local knowledge usually comes from a few conversations and a lot of searching, and it often reflects one person's view of the market.",
        "A structured list adds a second view that can be counted, mapped and shared across the team.",
      ],
    },
    helps: [
      { t: "A map of local businesses", d: "City and country fields let you see how an industry is spread across a place." },
      { t: "Contacts to start conversations", d: "Email and phone help you reach potential partners and early customers." },
      { t: "Place by place", d: "Lists are added by country and city, so you can start with the market you are entering." },
      { t: "Request what is missing", d: "If you need another country, tell us and we will build it." },
    ],
    productSlugs: ["dentists-us", "restaurants-us", "ski-shops-us"],
    productNote: "Lists are added country by country. Today the lists cover the United States.",
    applications: [
      { t: "Pick the first city", d: "Compare cities by how many businesses in your industry operate there." },
      { t: "Find distribution partners", d: "Contact local businesses that could resell, install or service your product." },
      { t: "Line up early customers", d: "Reach a first group of local businesses before you formally launch." },
      { t: "Check the competition", d: "Use website and name fields to study who is already serving the market." },
      { t: "Brief a local team", d: "Share a list with a new local hire so they start with real targets." },
    ],
    beneficiaries: ["Companies entering new cities", "Franchise developers", "International sales teams", "Distributors", "Consultants advising on expansion", "Start-ups testing a second market"],
    fieldUse: {
      Country: "Compare markets across borders.",
      City: "Choose and rank launch cities.",
      "Business name": "Build a register of local players.",
      Website: "Review competitors and partners.",
      Email: "Open conversations with partners and early customers.",
      Phone: "Follow up with promising prospects.",
    },
    steps: [
      { t: "Choose the market", d: "Pick the country and the industry you plan to serve." },
      { t: "Review the sample", d: "Check that coverage looks right for the cities you care about." },
      { t: "Buy and analyse", d: "Download the file and count businesses by city." },
      { t: "Start local conversations", d: "Reach partners and early customers in the best-fit city first." },
    ],
    related: ["market-research", "ecommerce-market-research", "real-estate-prospecting"],
    finalHeading: "Meet the market before you enter it",
    finalText: "Request a sample and see which local businesses you could work with.",
  },
];

export const solutions: readonly Solution[] = base.map((s) => {
  const copy = solutionCopy[s.slug];
  if (!copy) throw new Error(`Missing solution copy for ${s.slug}`);
  return { ...s, ...copy, faqs: solutionFaqs[s.slug] ?? [] };
});

export const getSolution = (slug: string) => solutions.find((s) => s.slug === slug);
