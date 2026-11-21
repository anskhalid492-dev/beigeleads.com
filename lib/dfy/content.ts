// Copy for /dfy-outbound (section 123). Package numbers are NOT here: they come from the admin settings (`loadDfySettings`).
// No testimonials, no guaranteed outcomes, no invented numbers. Everything operational is done by the BeigeLeads team by hand.
export const DFY_TITLE = "Done-for-You Cold Email Outbound Service, One-Time Packages | BeigeLeads";
export const DFY_DESC = "Done-for-you cold email outbound: BeigeLeads buys your secondary domains, sets up and warms inboxes, verifies prospects, writes your copy and manages sending. One-time packages, no subscription.";

export const DFY_SERVICES = [
  { id: "domains", title: "Secondary Domains Bought & Configured", label: "Domains", text: "We choose and buy secondary sending domains that protect your main brand domain, then configure the DNS records email needs (SPF, DKIM and DMARC)." },
  { id: "inboxes", title: "Set Up, Warmed & Kept Healthy", label: "Inboxes", text: "We create the sending inboxes, warm them up gradually and watch their health, so your volume is added step by step instead of all at once." },
  { id: "leads", title: "Verified Prospects That Fit Your ICP", label: "Lead Lists", text: "We source prospects against your ideal customer profile, verify the email addresses and remove duplicates and suppressed contacts before anything is sent." },
  { id: "copy", title: "Sequences Written for Replies, Not Opens", label: "Copywriting", text: "We write your first message and follow-ups. You review and approve every message before it can be sent." },
  { id: "sending", title: "Managed End to End", label: "Sending", text: "Our team runs the sending on your approved plan and stops a contact when they reply, unsubscribe, bounce or become ineligible." },
  { id: "testing", title: "Continuously Improve Campaign Performance", label: "Test & Optimize", text: "We test message variants and adjust targeting and copy based on the results we see, and report what we changed." },
] as const;

export const DFY_WHO = [
  { title: "Founders and small teams", text: "You know your market but have no time to run domains, inboxes and sequences.", href: "/solutions/b2b-lead-generation", link: "B2B lead generation" },
  { title: "B2B agencies", text: "Outbound for your own agency or your clients, without building the technical side.", href: "/solutions/marketing-agencies", link: "Marketing agencies" },
  { title: "Sales teams without an SDR", text: "Prospecting handled by our team while your closers handle the replies.", href: "/solutions/sales-prospecting", link: "Sales prospecting" },
  { title: "Businesses that bought a database", text: "Turn a list into a managed campaign. Purchased contacts are used only if you ask and they pass our compliance checks.", href: "/solutions/cold-email-marketing", link: "Cold email marketing" },
  { title: "Recruitment and staffing firms", text: "Reach hiring companies in your niche while your recruiters stay on calls.", href: "/solutions/recruitment-staffing", link: "Recruitment and staffing" },
  { title: "Companies entering new markets", text: "Open a new country or region with outreach that is planned, approved by you and managed for you.", href: "/solutions/business-expansion", link: "Business expansion" },
] as const;

export const DFY_STEPS = [
  ["Choose a package and pay", "Pick Starter, Growth or Scale. Pay once in crypto. There is no subscription. Optionally add infrastructure ownership."],
  ["Tell us about your business", "A private onboarding form collects your offer, ideal customer, countries, exclusions and compliance details. Never send passwords."],
  ["We plan and confirm capacity", "We plan domains and inboxes and confirm what we can really set up for your order. Nothing is launched before that plan is approved."],
  ["We build and verify", "Domains and inboxes are set up and checked, warm-up runs, and your prospect list is sourced and verified."],
  ["You approve the copy", "We write your sequence. You approve it or ask for changes. Nothing is sent without your approval."],
  ["We launch, test and report", "We run the campaign, test variants and send reports: weekly on Growth and Scale, monthly on Starter."],
] as const;

export const DFY_OWNERSHIP_POINTS = [
  "Without ownership, the sending domains and inboxes stay under BeigeLeads management for as long as the service runs.",
  "With ownership, the agreed domains, inboxes and associated infrastructure accounts are transferred to, or registered under, your ownership.",
  "Transfers follow each provider's rules. Some items may not be transferable, and we tell you which in writing before you rely on it.",
  "The fee is charged once, together with your package.",
  "We never send infrastructure passwords by email.",
] as const;

export const DFY_BEHIND = [
  { id: "infra", title: "Domains and inboxes", lead: "Set up the careful way, never all at once.", points: ["Secondary domains keep your main domain out of the line of fire.", "DNS records are configured and checked before an inbox is used.", "Inboxes warm up gradually, which takes time.", "Package numbers are estimates until we confirm your allocation after onboarding."] },
  { id: "sourcing", title: "Verified prospects", lead: "Sourced against your ideal customer profile.", points: ["Sourced, verified, approved and contacted are counted separately.", "Addresses are checked and de-duplicated, and suppressed contacts are removed.", "Databases you bought from BeigeLeads are used only if you ask."] },
  { id: "copy", title: "Copy and follow-ups", lead: "You read every message before it can go out.", points: ["One initial message plus the follow-ups in your package.", "A/B variants can be written and tested.", "Every version is kept, so you can see what changed."] },
  { id: "sending", title: "Managed sending", lead: "Run by our team on your approved plan.", points: ["Sending stops for a contact who replies, unsubscribes, bounces or becomes ineligible.", "Volume follows your confirmed inbox capacity. The package ceiling is a maximum, not a promise.", "We do not promise inbox placement, replies, meetings or revenue."] },
  { id: "testing", title: "Testing and reporting", lead: "Real counts, plain language.", points: ["We test one change at a time where volume allows and tell you what we changed.", "Reports show prospects sourced, verified and contacted, sends, failures, replies, opt-outs and meetings.", "Starter gets monthly reports, Growth and Scale weekly ones."] },
  { id: "control", title: "You stay in control", lead: "A private page instead of an account.", points: ["Your order page shows progress, infrastructure status and copy waiting for review.", "You approve or request changes on every message.", "You can ask to pause or cancel from the page."] },
] as const;

export const DFY_COMPARE = [
  ["Verified leads", "leads"], ["Initial sends", "initialSends"], ["Follow-ups", "followups"], ["Estimated domains", "domains"], ["Estimated inboxes", "inboxes"], ["Reporting", "reporting"], ["Support", "support"],
] as const;

export const DFY_FAQS: readonly (readonly [string, string])[] = [
  ["What exactly do I get?", "A team that buys and configures your sending domains, sets up and warms inboxes, sources and verifies prospects, writes your sequence for your approval, runs the sending and reports back. It is a managed service, not software."],
  ["Are the lead, send, domain and inbox numbers guaranteed?", "Lead and send numbers are your package allocation. Domain and inbox numbers are estimated ranges. After onboarding we confirm what we can really set up for your order and agree any difference with you. We do not reduce an allocation silently."],
  ["What is the difference between leads, initial sends and follow-ups?", "Leads are prospects. An initial send is the first message to a lead. A follow-up is a later message in the sequence. Together they can add up to a theoretical maximum of messages, but that maximum is a ceiling, not something we promise to send."],
  ["How does billing work?", "Every DFY Outbound package is a one-time purchase paid in crypto, like the rest of BeigeLeads. There is no subscription, no monthly charge and nothing renews."],
  ["What does the ownership option do?", "For a one-time $100 you can have the agreed sending domains, inboxes and associated infrastructure accounts transferred to, or registered under, your ownership, subject to provider transfer rules. It is optional and never recurring."],
  ["Will you use the databases I bought from BeigeLeads?", "Not automatically. Only if you ask us to and the contacts pass the same compliance checks as any other prospect."],
  ["Can you guarantee replies or meetings?", "No. Results depend on your offer, market and timing. We report real numbers and keep improving, but we do not promise outcomes."],
  ["Is cold email legal?", "Rules differ by country. You confirm during onboarding that you are authorised to use the business and that outreach will follow anti-spam laws, including an opt-out in every message and honest sender details. We stop contacts who opt out."],
  ["Can I cancel?", "Yes. Cancel from your order page or by contacting support.  Months already paid are not refunded unless our refund policy says so."],
  ["How long until the campaign starts?", "Setup includes domain configuration and inbox warm-up, which cannot be rushed. We do not promise a launch date up front. Your order page shows each stage."],
];
