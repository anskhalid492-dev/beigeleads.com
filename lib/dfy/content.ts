// Copy for /dfy-outbound (section 123). Package numbers are NOT here: they come from the admin settings (`loadDfySettings`).
// No testimonials, no guaranteed outcomes, no invented numbers. Everything operational is done by the BeigeLeads team by hand.
export const DFY_TITLE = "DFY Outbound: Done-for-You Cold Email Outbound Service | BeigeLeads";
export const DFY_DESC = "BeigeLeads sets up and manages your outbound: secondary domains, inboxes and warm-up, verified prospects, copy and managed sending. Monthly packages from $299.";

export const DFY_SERVICES = [
  { id: "domains", title: "Secondary Domains Bought & Configured", label: "Domains", text: "We choose and buy secondary sending domains that protect your main brand domain, then configure the DNS records email needs (SPF, DKIM and DMARC)." },
  { id: "inboxes", title: "Set Up, Warmed & Kept Healthy", label: "Inboxes", text: "We create the sending inboxes, warm them up gradually and watch their health, so your volume is added step by step instead of all at once." },
  { id: "leads", title: "Verified Prospects That Fit Your ICP", label: "Lead Lists", text: "We source prospects against your ideal customer profile, verify the email addresses and remove duplicates and suppressed contacts before anything is sent." },
  { id: "copy", title: "Sequences Written for Replies, Not Opens", label: "Copywriting", text: "We write your first message and follow-ups. You review and approve every message before it can be sent." },
  { id: "sending", title: "Managed End to End", label: "Sending", text: "Our team runs the sending on your approved plan and stops a contact when they reply, unsubscribe, bounce or become ineligible." },
  { id: "testing", title: "Continuously Improve Campaign Performance", label: "Test & Optimize", text: "We test message variants and adjust targeting and copy based on the results we see, and report what we changed." },
] as const;

export const DFY_WHO = [
  ["Founders and small teams", "You know your market but have no time to run domains, inboxes and sequences."],
  ["B2B agencies", "You want outbound for yourself or your clients without building the technical side."],
  ["Sales teams without an SDR", "You want prospecting handled while your closers handle the replies."],
  ["Businesses that bought a database", "You hold lists and need a team to turn them into a managed campaign (purchased contacts are never used unless you ask and they pass the compliance checks)."],
] as const;

export const DFY_STEPS = [
  ["Choose a package and pay", "Pick Starter, Growth or Scale. Each month is paid in advance in crypto. Optionally add infrastructure ownership."],
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
  "The fee is charged once. It is never part of a monthly renewal.",
  "We never send infrastructure passwords by email.",
] as const;

export const DFY_SECTIONS = {
  infra: { title: "Domains and inboxes, set up the careful way", points: ["Secondary domains keep your main domain out of the line of fire.", "Records are configured and checked before an inbox is used.", "Inboxes ramp up gradually. This takes time and is not instant.", "Each domain and inbox is tracked and marked ready only after we verify it.", "The numbers on the package cards are estimates. Your confirmed allocation is agreed after onboarding."] },
  sourcing: { title: "Verified prospect sourcing", points: ["Sourced, verified, approved and contacted are counted separately in your reports.", "We use your ideal customer profile and exclusions to choose who to target.", "Addresses are checked and de-duplicated before sending, and suppressed contacts are removed.", "Databases you bought from BeigeLeads are never used automatically. You decide, and compliance checks still apply.", "We do not label a prospect “high intent” unless there is a clear, stated reason."] },
  copy: { title: "Copywriting and follow-ups", points: ["One initial message plus the number of follow-ups in your package.", "Follow-ups are counted separately from initial sends.", "A/B variants can be written and tested.", "Every version is kept, so you can see what changed.", "Nothing is sent until you approve the copy."] },
  sending: { title: "Managed sending", points: ["The BeigeLeads team runs the sending by hand on your approved plan.", "Sending stops for a contact who replies, unsubscribes, bounces or becomes ineligible.", "Volume follows your confirmed inbox capacity. A package's theoretical ceiling is a maximum, not a promise.", "We do not promise inbox placement, replies, meetings or revenue."] },
  testing: { title: "Testing and optimization", points: ["We test subject lines, openings and offers one change at a time where volume allows.", "We tell you what we tested and what we changed.", "Small campaigns may not produce clear results, and we say so when that is the case."] },
  reporting: { title: "Reporting you can read", points: ["Starter: monthly reports. Growth and Scale: weekly reports.", "Real counts: prospects sourced, verified and contacted; initial and follow-up sends; failures; replies; interested replies; opt-outs; meetings.", "Reports are published to your private order page. We do not show numbers we did not measure."] },
  approval: { title: "You stay in control", points: ["Your private order page shows progress, infrastructure status and copy waiting for review.", "You approve or request changes on every message.", "You can ask to pause or cancel from the page. Cancellation stops future renewals.", "Access is by a private link we email you. There is no account to create."] },
} as const;

export const DFY_COMPARE = [
  ["Verified leads per month", "leads"], ["Initial sends", "initialSends"], ["Follow-ups", "followups"], ["Estimated domains", "domains"], ["Estimated inboxes", "inboxes"], ["Reporting", "reporting"], ["Support", "support"],
] as const;

export const DFY_FAQS: readonly (readonly [string, string])[] = [
  ["What exactly do I get?", "A team that buys and configures your sending domains, sets up and warms inboxes, sources and verifies prospects, writes your sequence for your approval, runs the sending and reports back. It is a managed service, not software."],
  ["Are the lead, send, domain and inbox numbers guaranteed?", "Lead and send numbers are your monthly allocation. Domain and inbox numbers are estimated ranges. After onboarding we confirm what we can really set up for your order and agree any difference with you. We do not reduce an allocation silently."],
  ["What is the difference between leads, initial sends and follow-ups?", "Leads are prospects. An initial send is the first message to a lead. A follow-up is a later message in the sequence. Together they can add up to a theoretical maximum of messages, but that maximum is a ceiling, not something we promise to send in a month."],
  ["How does billing work?", "Each month is paid in advance in crypto, like the rest of BeigeLeads. We invoice each renewal about a week before it is due. If a renewal is not paid, the service pauses."],
  ["What does the ownership option do?", "For a one-time $100 you can have the agreed sending domains, inboxes and associated infrastructure accounts transferred to, or registered under, your ownership, subject to provider transfer rules. It is optional and never recurring."],
  ["Will you use the databases I bought from BeigeLeads?", "Not automatically. Only if you ask us to and the contacts pass the same compliance checks as any other prospect."],
  ["Can you guarantee replies or meetings?", "No. Results depend on your offer, market and timing. We report real numbers and keep improving, but we do not promise outcomes."],
  ["Is cold email legal?", "Rules differ by country. You confirm during onboarding that you are authorised to use the business and that outreach will follow anti-spam laws, including an opt-out in every message and honest sender details. We stop contacts who opt out."],
  ["Can I cancel?", "Yes. Cancel from your order page or by contacting support. Cancellation stops future renewals. Months already paid are not refunded unless our refund policy says so."],
  ["How long until the campaign starts?", "Setup includes domain configuration and inbox warm-up, which cannot be rushed. We do not promise a launch date up front. Your order page shows each stage."],
];
