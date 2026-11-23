// Audience-specific copy for each solution: one named reader, their real pain points, and a
// specific closing line. Only claims what exists today: the lists on the lists page,
// seven fields, masked samples, 90-day re-verification, one-time payment.
// No statistics, no promised results. Needs lawyer review for compliance wording.

export type Pain = { pain: string; fix: string };
export type SolutionCopy = {
  seoTitle: string;
  seoDescription: string;
  h1: string;
  lede: string;
  challenge: { heading: string; paragraphs: readonly string[] };
  pains: readonly Pain[];
  applications: readonly { t: string; d: string }[];
  finalHeading: string;
  finalText: string;
};

export const solutionCopy: Record<string, SolutionCopy> = {
  "b2b-lead-generation": {
    seoTitle: "B2B Lead Generation for Small Sales Teams",
    seoDescription:
      "A B2B lead generation list for founders and small sales teams who sell to local businesses. Check a masked sample, pay once, keep the file.",
    h1: "B2B lead generation for small teams that sell to local businesses",
    lede:
      "You do not need a platform with fifty filters. You need one clear list of the businesses you sell to, with a phone number, an email and a website for each. Pick the industry, check the sample, and download a file you keep.",
    challenge: {
      heading: "Your pipeline is empty because the list never got built",
      paragraphs: [
        "A founder or a two-person sales team usually knows who the ideal customer is: one industry in one country. What is missing is the list. Copying names from maps and directories takes days, and half of it is out of date before the first email goes out.",
        "Lead platforms fix the speed but charge every month, even in the weeks you do no outreach. When you stop paying, the list stops being yours.",
      ],
    },
    pains: [
      { pain: "Building the list by hand eats the weeks you meant to spend selling.", fix: "Each database arrives as one finished file, already collected, cleaned and tagged by industry and city." },
      { pain: "A monthly lead-platform fee for data you use in bursts.", fix: "You pay once and keep the file. There is no account to cancel and nothing to renew." },
      { pain: "You cannot tell if a list is any good until you have paid for it.", fix: "Every list page shows a masked sample, and you can request a free sample by email first." },
      { pain: "Old data sends messages to nobody and hurts your sending reputation.", fix: "BeigeLeads refreshes its databases every 90 days. The last-verified date is on each list page." },
      { pain: "New contacts clash with accounts already in your CRM.", fix: "Business name, city and website are separate columns, so matching against existing accounts is a one-step spreadsheet job." },
    ],
    applications: [
      { t: "Fill a first-quarter pipeline", d: "Load one industry and one city into your CRM and work it account by account." },
      { t: "Test a new niche cheaply", d: "Buy the smallest package for an unfamiliar industry and see whether the first fifty conversations go anywhere before buying more." },
      { t: "Run email and calls from one file", d: "Every row carries both email and phone, so one purchase feeds two channels." },
      { t: "Find the accounts your CRM is missing", d: "Compare the file against your current accounts and keep only the businesses you have never contacted." },
      { t: "Stop sending one national blast", d: "Split by the city column and write a message that fits each place." },
    ],
    finalHeading: "Turn a niche into a pipeline",
    finalText: "Pick the industry you sell to, inspect the masked sample, and start with a list that is yours to keep.",
  },

  "cold-email-marketing": {
    seoTitle: "Verified Email Lists for Cold Email",
    seoDescription:
      "Business email lists for cold outreach to local businesses. refreshed every 90 days, with a masked sample first.",
    h1: "Cold email to business owners without burning your domain",
    lede:
      "A cold campaign lives or dies on bounces. These business email lists are refreshed every 90 days, so your first send starts from addresses that were accepted by their mail servers recently.",
    challenge: {
      heading: "One bad batch can sour your sending domain for months",
      paragraphs: [
        "Mail providers watch bounce rates. A list full of dead addresses tells them you are careless, and your good emails start landing in spam too. Cleaning a list yourself means buying a verifier on top of the list.",
        "Then there is the question of who you may email at all. Rules differ by country and some require consent first. A list is a starting point, never a permission slip.",
      ],
    },
    pains: [
      { pain: "High bounce rates damage your domain reputation.", fix: "BeigeLeads refreshes its databases every 90 days. Some bounces remain possible, and the page says so plainly." },
      { pain: "You pay for a list and then pay again for a verifier.", fix: "Verification is already part of how the list is made. The last-verified date is shown on the list page." },
      { pain: "One giant campaign gets generic copy and weak replies.", fix: "The city column lets you split the file into small campaigns and write one specific message per place." },
      { pain: "Unclear rules about who you may email.", fix: "Our CAN-SPAM, CASL and GDPR pages explain how we operate. They are not legal advice, so check the rules where you and your recipients are." },
      { pain: "People who asked not to be emailed keep getting mail.", fix: "Opt-outs on our site are stored as hashed records and applied to every file we generate afterwards. You must also keep your own suppression list." },
    ],
    applications: [
      { t: "Warm up with a small first batch", d: "Send to a few dozen addresses first and watch bounces before scaling the campaign." },
      { t: "One city, one message", d: "Write a short email that names the city and something true about that business type, and send it to that city only." },
      { t: "Email first, call second", d: "Use the phone column to follow up on the businesses that opened your email but did not reply." },
      { t: "Check the website before you write", d: "The website column gives you one minute of research so the opening line is not generic." },
      { t: "Keep a clean suppression list", d: "Log every unsubscribe and bounce in your own sheet and apply it before the next send." },
    ],
    finalHeading: "Turn a clean list into a first email worth opening",
    finalText: "Request a free sample, check the emails and fields yourself, and send your first small batch with confidence.",
  },

  "sales-prospecting": {
    seoTitle: "Sales Prospecting Lists for SDRs and Field Reps",
    seoDescription:
      "Territory-ready prospect lists with phone, email and website for each business. Built for SDRs and field sales reps. Pay once, check a sample first.",
    h1: "Prospecting lists for reps who need a full day of calls, not a search box",
    lede:
      "An SDR or field rep needs a territory worked in order: the next business, its phone, its website, its address. These lists give you every row in one file, ready to sort by city and start dialling.",
    challenge: {
      heading: "Reps lose mornings to research that a list should have done",
      paragraphs: [
        "A rep with forty calls to make does not want to open forty tabs first. Each lookup for a phone number or a website costs minutes, and the day ends with a handful of conversations.",
        "Territories get messy too. Two reps call the same business, a closed shop wastes a call, and nobody knows which accounts have been touched.",
      ],
    },
    pains: [
      { pain: "Time lost looking up phone numbers and websites one by one.", fix: "Phone, email and website sit on the same row as the business name and address." },
      { pain: "Two reps call the same business.", fix: "Split the file by city or address range and give each rep a territory that does not overlap." },
      { pain: "Calls to businesses that have closed or moved.", fix: "All data is re-verified every 90 days, and the list page shows the last-verified date." },
      { pain: "No idea which accounts were already worked.", fix: "Add a status and last-contact column to the file and your CRM keeps the history." },
      { pain: "Named decision makers are missing.", fix: "The seven fields do not include job titles. Use the website or a first call to the front desk to find the buyer." },
    ],
    applications: [
      { t: "Build a calling order by city", d: "Sort by city, then by address, and work one area at a time." },
      { t: "Split a territory fairly", d: "Divide the rows between reps so each gets a similar number of accounts." },
      { t: "Call, then email", d: "Open with the phone number and send a short follow-up email to the same business." },
      { t: "Plan a field-visit route", d: "Paste addresses into a free mapping tool and group the nearest businesses into one day." },
      { t: "Hand a new rep a ready list", d: "A new hire starts on day one with a territory file instead of a week of research." },
    ],
    finalHeading: "Turn a territory into a call plan",
    finalText: "Get a free sample, sort it by city, and see how a territory looks before you buy the full list.",
  },

  "marketing-agencies": {
    seoTitle: "Prospect Lists for Marketing Agencies",
    seoDescription:
      "Business lists for marketing agencies that pitch local clients. Find local businesses by city, with a masked sample before you pay.",
    h1: "Prospect lists for agencies that win clients from local businesses",
    lede:
      "Agencies grow by pitching businesses that need more customers. Pick the niche you serve, filter by city, and get a file with phone, email and website so you can spend the week on proposals, not on finding who to send them to.",
    challenge: {
      heading: "Agency growth stalls when finding prospects is nobody's job",
      paragraphs: [
        "New-business outreach is the first thing to slip when client work is busy. When it restarts, someone has to rebuild a prospect list from scratch, and the pipeline goes quiet again.",
        "Generic national lists do not help much either. A pitch to a business in Denver needs to mention Denver, and that means a list you can filter by place.",
      ],
    },
    pains: [
      { pain: "New-business outreach stops whenever client work gets busy.", fix: "Buy a list once and work it in short sessions. It does not expire and there is no seat fee." },
      { pain: "Prospect lists that cannot be filtered by city.", fix: "Every row has city and country fields, so each pitch can name the place." },
      { pain: "You cannot tell which prospects lack a website or a good one.", fix: "The website column shows who has a site at all, which is a natural opening for web and local-SEO services." },
      { pain: "Unclear what you may do with a bought list for clients.", fix: "The licence note in the delivery email and our terms page set the rules. Running campaigns for clients is normal use, and reselling the raw file is not." },
      { pain: "Only a few niches are available.", fix: "Browse the lists page for what is available now. Request a category and we will say honestly whether we can build it." },
    ],
    applications: [
      { t: "Pitch a niche you already serve", d: "If you already serve one industry, take that industry's list and pitch the businesses in a city you can reference." },
      { t: "Open with a missing website", d: "Filter for rows with no website and lead with what you would build for them." },
      { t: "Keep client data apart", d: "Use the same list for several client campaigns by filtering by city, and keep each client's reporting separate." },
      { t: "Run a monthly outreach sprint", d: "Pick fifty businesses, write fifty short messages, log replies, repeat." },
      { t: "Size a new vertical before hiring", d: "Count businesses in a city to see if a new niche is worth building a service for." },
    ],
    finalHeading: "Turn a city into a prospect list for your pitch",
    finalText: "Choose a niche you serve, check the masked sample, and start next week's outreach with a file in hand.",
  },

  "market-research": {
    seoTitle: "Business Data for Market Research",
    seoDescription:
      "Count and compare local businesses by city for market sizing. Industry databases with city, website and contact fields.",
    h1: "Business data for analysts who have to put a number on a market",
    lede:
      "Before a plan or a pitch, someone has to say how many businesses are out there and where. These databases let you count by city, compare places, and see how many have a website, a phone and an email, without a long research project.",
    challenge: {
      heading: "A market size without a source is just an opinion",
      paragraphs: [
        "Analysts often start from a top-down figure that nobody can trace. A bottom-up count of real businesses by city is far easier to defend, but collecting it by hand is slow and hard to repeat.",
        "The count also has to be honest. No list is a complete census, so the useful skill is stating what the count covers and when it was made.",
      ],
    },
    pains: [
      { pain: "Top-down market figures that nobody can trace to a source.", fix: "Count real businesses per city from a dated list. The product page shows the record count and last-verified date." },
      { pain: "Hand-collected counts that cannot be repeated.", fix: "Buy the same list again later and compare the two files to see what changed." },
      { pain: "No way to compare one city with another.", fix: "All lists share the same seven fields, so city-by-city counts line up." },
      { pain: "Unsure how to describe the limits of the data.", fix: "The data-sources page explains how records are collected, and your write-up can say the count covers publicly listed businesses at a stated date." },
      { pain: "Revenue and headcount are missing.", fix: "These are not in the data. Add them from another source and keep ours for counts, location and contactability." },
    ],
    applications: [
      { t: "Count businesses per city", d: "Group the city column and chart the totals to see where a market is dense or thin." },
      { t: "Measure website coverage", d: "Count how many rows have a website to see how digital a niche already is." },
      { t: "Compare two cities side by side", d: "Use two lists or two filters and set the counts next to each other with their verification dates." },
      { t: "Check how reachable a market is", d: "Count rows with both phone and email to estimate how contactable a segment is." },
      { t: "Track change over time", d: "Keep each purchase and compare later versions to see openings and closings in a city." },
    ],
    finalHeading: "Turn a city into a number you can defend",
    finalText: "Take a free sample, check how the fields count up, and size your market from a source you can cite.",
  },

  "local-business-marketing": {
    seoTitle: "Local Business Lists for Local Marketing",
    seoDescription:
      "City-level business lists with address, phone, email and website. For local service firms, suppliers and shops that sell to businesses nearby.",
    h1: "A local business list for firms that sell to the neighbours",
    lede:
      "If your customers are other businesses within a short drive, you need names, addresses and phone numbers by area. Filter the list by city, work it street by street, and keep the whole file for the next campaign.",
    challenge: {
      heading: "Local selling still needs a list, and street-level data is hard to find",
      paragraphs: [
        "A local supplier, installer or service company knows its patch but not every business in it. Walking or driving around to collect names is slow, and online directories mix in businesses far outside your area.",
        "The result is outreach that reaches the same ten familiar names and misses the rest of the district.",
      ],
    },
    pains: [
      { pain: "You only know the businesses you have already met.", fix: "A city list shows every listed business in the area, each with an address, phone and website." },
      { pain: "Directories mix in places outside your delivery area.", fix: "Filter by city, then by street or address text, to keep only the neighbourhood you can actually serve." },
      { pain: "No easy way to plan visits.", fix: "Paste addresses into a free mapping tool and group nearby businesses into one route." },
      { pain: "Printed mailers go to wrong or missing addresses.", fix: "The address field makes a small test mailing possible. Check postal marketing rules and licence terms first." },
      { pain: "Your city is not covered yet.", fix: "City pages exist for some US cities today. Use the custom list page for another place and we will say whether we can build it." },
    ],
    applications: [
      { t: "Work one street at a time", d: "Sort by address and call or visit businesses in order." },
      { t: "Send a supplier offer to nearby shops", d: "Write a short offer and send it to the businesses in your delivery area only." },
      { t: "Plan a visit day", d: "Group addresses on a map and book appointments by phone beforehand." },
      { t: "Invite neighbours to an event", d: "Email local businesses about an open day, a trade evening or a partnership." },
      { t: "Test a small print run", d: "Mail one neighbourhood first and measure replies before printing more." },
    ],
    finalHeading: "Turn a district into a call sheet",
    finalText: "Pick your city, check the masked sample, and start with the businesses closest to you.",
  },

  "healthcare-marketing": {
    seoTitle: "Dentist Email List for Healthcare Marketing",
    seoDescription:
      "Contact details for US dental practices: email, phone, website and address. For dental suppliers, software vendors and agencies. No patient data.",
    h1: "Reach dental practices with suppliers, software and services",
    lede:
      "Dental practices buy equipment, supplies, software and marketing all year. The dentist database gives you the practice name, address, phone, email and website, so you can talk to the people who run the business. There is no patient data of any kind.",
    challenge: {
      heading: "Practices are easy to name and hard to reach in bulk",
      paragraphs: [
        "A supplier or software vendor can name a hundred dental practices, but reaching thousands with a phone number and an email is another job. Practice owners are busy and front desks screen calls.",
        "Healthcare marketing also draws extra rules. You are contacting businesses, not patients, but your own message must still follow the laws that apply to you.",
      ],
    },
    pains: [
      { pain: "Practices are spread across many cities and are slow to map by hand.", fix: "The US dentist list is sorted by city and carries address, phone, email and website for each practice." },
      { pain: "Worry about touching patient information.", fix: "The list contains business contact details only. There is no patient data of any kind." },
      { pain: "Front desks block cold calls.", fix: "Use the email column for a short written first contact and the phone for follow-up at a quieter time." },
      { pain: "No named buyer for each practice.", fix: "The seven fields do not include job titles. Use the practice website or a first call to find who handles purchasing." },
      { pain: "Practices open, merge and close.", fix: "All data is re-verified every 90 days and the product page shows when it was last verified." },
    ],
    applications: [
      { t: "Introduce equipment to nearby practices", d: "Start with one city, send a short email, then follow up by phone." },
      { t: "Pitch practice software", d: "Reach practices that may be choosing scheduling, imaging or billing tools." },
      { t: "Sell dental marketing services", d: "Lead with a missing or dated website, visible in the website column." },
      { t: "Supply consumables", d: "Offer supplies to practices in a delivery area and track orders by city." },
      { t: "Recruit for practices", d: "Staffing firms can contact practices that may need hygienists or assistants." },
    ],
    finalHeading: "Turn a practice list into a supplier's territory",
    finalText: "Request a free sample of the dentist list and see the fields before you decide.",
  },

  "real-estate-prospecting": {
    seoTitle: "Lists for Commercial Real Estate Prospecting",
    seoDescription:
      "Find businesses by city and address for commercial brokers and property services. Industry databases by city. No property or owner data.",
    h1: "Commercial real estate prospecting starts with the tenants already on the street",
    lede:
      "Commercial brokers and property services can use business lists to see who occupies a district and how to reach them. We list businesses, not property records, and there is no real estate agent database yet. That is said plainly so you know exactly what you are buying.",
    challenge: {
      heading: "Every street of shops is a pipeline, but only if you know who is in it",
      paragraphs: [
        "A broker or fit-out firm learns about a space moving only when someone tells them. A list of the businesses in a district, with phone and email, lets you start conversations before a space is advertised.",
        "It has limits. The data does not show ownership, leases or rent, so it opens the conversation and does not replace property research.",
      ],
    },
    pains: [
      { pain: "You hear about a business moving only when it is already advertised.", fix: "Call or email businesses in a district early and ask about their plans for the space." },
      { pain: "Hard to see who occupies a given area.", fix: "Filter the list by city and address text to see the businesses around a location." },
      { pain: "Cold outreach to tenants with no contact details.", fix: "Each row carries phone, email and website where available." },
      { pain: "Expecting ownership or lease data.", fix: "We do not provide it. Use public land registries once a conversation is under way." },
      { pain: "No real estate agent list.", fix: "That category does not exist yet. Request it and we will say whether we can build it." },
    ],
    applications: [
      { t: "Map the tenants in a target district", d: "Filter by address text and build a list of every listed business on a few streets." },
      { t: "Find occupiers for an available unit", d: "Contact restaurants or practices that could fit a space you are marketing." },
      { t: "Offer fit-out or signage services", d: "Property-service firms can introduce themselves to nearby businesses." },
      { t: "Ask about expansion", d: "Write one short question to each business about plans to move or grow." },
      { t: "Watch a district over time", d: "Compare two purchases to see openings and closings on the same streets." },
    ],
    finalHeading: "Turn a street of businesses into a tenant list",
    finalText: "Look at a masked sample for the city you cover and see how much of a district it maps.",
  },

  "recruitment-staffing": {
    seoTitle: "Employer Lists for Staffing Agencies",
    seoDescription:
      "Find local employers to win as staffing clients. Industry contact lists with phone, email and website. Business data only.",
    h1: "Win staffing clients by reaching local employers first",
    lede:
      "Staffing and recruitment firms grow on employer relationships. These lists give you the businesses in an industry and city, with phone and email, so you can offer to fill their roles. They contain businesses only. There are no candidate lists.",
    challenge: {
      heading: "Recruiters know candidates well and employers poorly",
      paragraphs: [
        "A recruiter often has a strong candidate pool and no steady stream of employers. Finding every business in a city that might need staff is repetitive work that gets skipped.",
        "The lists do not show who is hiring. They show who exists and how to reach them, which is the start of a conversation about hiring needs.",
      ],
    },
    pains: [
      { pain: "Too few employer relationships.", fix: "Pick one industry and one city and work the full list of employers one by one." },
      { pain: "No way to know who might hire.", fix: "The data does not show vacancies. A short call asking whether they need help is the quickest way to find out." },
      { pain: "Seasonal industries are hard to time.", fix: "Seasonal businesses hire before busy periods. Contact them just ahead of the rush." },
      { pain: "Hiring contact names are missing.", fix: "The seven fields do not include job titles. Ask the front desk who hires." },
      { pain: "Confusion about candidate data.", fix: "We sell no candidate or job seeker data. Candidate sourcing needs its own tools and consent rules." },
    ],
    applications: [
      { t: "Open a niche staffing line", d: "Contact businesses in one sector and city and offer to find the staff they need." },
      { t: "Build a seasonal employer pipeline", d: "Reach seasonal employers before peak months with a short offer." },
      { t: "Reactivate lapsed clients", d: "Match the list against your CRM to find employers you stopped calling." },
      { t: "Specialise in one city", d: "Become the known agency for one industry in one place by contacting every business there." },
      { t: "Log every contact", d: "Add status and last-contact columns so a team never double-calls an employer." },
    ],
    finalHeading: "Turn local employers into client conversations",
    finalText: "Get a free sample for the industry you staff and see which employers you could contact this week.",
  },

  "ecommerce-market-research": {
    seoTitle: "Retailer Lists for E-commerce Research",
    seoDescription:
      "Research a retail niche and reach shops directly. Industry lists with website, email and phone. No sales or traffic data.",
    h1: "Research a retail niche and reach its shops without guessing",
    lede:
      "Brands, wholesalers and e-commerce researchers can use a retail niche list to see how many shops exist, which have websites, and how to contact them. It shows who is out there. It does not show traffic, revenue or prices.",
    challenge: {
      heading: "You cannot sell to a niche you have not counted",
      paragraphs: [
        "Before approaching retailers, a supplier wants to know how many shops there are and how many sell online. Checking each website by hand does not scale.",
        "The data has clear limits. It lists businesses and their contact details, not their sales, so it supports sizing and outreach, not performance analysis.",
      ],
    },
    pains: [
      { pain: "You do not know how many shops are in a niche.", fix: "Count rows per city in a niche list and compare places." },
      { pain: "You cannot tell which shops are online.", fix: "The website column shows which shops have a site at all." },
      { pain: "Supplier outreach has no direct contacts.", fix: "Phone, email and website are on every row for a direct trade approach." },
      { pain: "Expecting revenue, traffic or product data.", fix: "That is not in the data. Use other tools for performance figures." },
      { pain: "Your niche is not listed.", fix: "Check the lists page for what is available now. Request a category and we will say whether it can be built." },
    ],
    applications: [
      { t: "Size a retail niche by city", d: "Count shops per city and see where the niche is dense." },
      { t: "Approach shops with a trade offer", d: "Email shops directly with a wholesale or distribution proposal." },
      { t: "Compare online and offline presence", d: "Count rows with and without a website to see how digital the niche is." },
      { t: "Map competitors in a region", d: "List who exists in a city before choosing where to sell." },
      { t: "Prioritise outreach", d: "Contact shops that have both email and website first." },
    ],
    finalHeading: "Turn a niche into a trade-outreach list",
    finalText: "Check a sample and see how many businesses you could reach in the city you care about.",
  },

  "influencer-marketing": {
    seoTitle: "Local Business Contacts for Creators",
    seoDescription:
      "Find local businesses to pitch for sponsorships. Local business contacts with email, phone and website. No influencer or social handle data.",
    h1: "Local business contacts for creators who want sponsors close to home",
    lede:
      "Creators and influencer agencies often pitch national brands and ignore the local businesses that would pay for a nearby audience. These lists give you local businesses to approach, with email, phone and website. Influencer lists are available on request.",
    challenge: {
      heading: "Local sponsors exist, but you have to find them first",
      paragraphs: [
        "A creator with a city audience is worth more to a nearby business than to a distant brand. The hard part is finding contact details for those businesses at scale.",
        "To be clear, this is a list of businesses. It does not include creators, follower counts or social handles.",
      ],
    },
    pains: [
      { pain: "No contact details for local sponsors.", fix: "Every row carries email, phone and website for the business." },
      { pain: "Pitching national brands with no reply.", fix: "A local business can say yes in one email, and your audience is already near them." },
      { pain: "Unsure which businesses suit your content.", fix: "Businesses with a visual product or a place people visit suit creator content." },
      { pain: "Social handle data is missing.", fix: "Not part of the data today. Use the website to find the business's profiles." },
      { pain: "You need an influencer database.", fix: "We do not have one. Request it, and we will say honestly whether we can source it." },
    ],
    applications: [
      { t: "Pitch a local business in your city", d: "Offer a visit, a post and a story in exchange for a meal or a fee." },
      { t: "Approach seasonal businesses before their peak", d: "Propose a gear review or a launch post ahead of winter." },
      { t: "Package a local bundle for an agency", d: "An agency can pitch several nearby businesses with one audience report." },
      { t: "Send a short rate card", d: "Share your audience location, one example and a price in under a hundred words." },
      { t: "Track replies by city", d: "Log pitches and responses so you learn which local businesses say yes." },
    ],
    finalHeading: "Turn a local business list into sponsor pitches",
    finalText: "Request a sample of a list and pick the first ten businesses to pitch.",
  },

  "business-expansion": {
    seoTitle: "Market Entry Data: Business Lists by US City",
    seoDescription:
      "Scout a new US city before you open: count local businesses, find partners and test demand. Industry lists by city.",
    h1: "Scout a new US city before you commit to it",
    lede:
      "Entering a new market means knowing who is already there. City-level business lists let you count the businesses, find possible partners and call a few to test your offer before you sign a lease or hire a team.",
    challenge: {
      heading: "Expansion plans fail on assumptions nobody checked",
      paragraphs: [
        "A company picks a city because it looks right on a map, then discovers the local market is thin or crowded. A real count of businesses, plus a few conversations, is cheaper than finding out after opening.",
        "Yes, we sell lists for many countries. Tell us the country you are expanding into and we will build the list.",
      ],
    },
    pains: [
      { pain: "Choosing a city on instinct.", fix: "Count the businesses in each candidate city from the same dated list and compare." },
      { pain: "No local partners or distributors.", fix: "Filter to businesses that already serve your target customer and write to them with a clear offer." },
      { pain: "Unsure whether your offer lands.", fix: "Call a small sample from the list and ask about their needs before committing." },
      { pain: "Rules for contacting businesses abroad.", fix: "They differ by country. Read our legal pages and check the rules where you plan to enter." },
      { pain: "Your target country is not available.", fix: "Only the US is live. Request a country or niche and we will say whether we can serve it." },
    ],
    applications: [
      { t: "Rank candidate cities by business count", d: "Use the same list for each city and compare the totals." },
      { t: "Shortlist local partners", d: "Pick businesses that already serve your customers and approach them first." },
      { t: "Run ten test calls", d: "Call a handful of businesses and note what they say about your offer." },
      { t: "Plan a first-year sales territory", d: "Turn the list into a territory plan before you hire anyone." },
      { t: "Confirm before you spend", d: "Treat the file as a map and check a few rows by phone or website first." },
    ],
    finalHeading: "Turn a new city into a short list of partners",
    finalText: "Take a free sample for the city you are considering and see who is already there.",
  },
};
