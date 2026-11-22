// Published benchmark reports (section 138). Every figure below was read on the source's own page on 22 Nov 2026 and is stated the way the source states it.
// These are THIRD-PARTY findings from vendors' own platform data: BeigeLeads did not run them. Add a report only with a source URL, period, population and limits.
export type Report = {
  seoTitle: string; seoDesc: string; summary: string;
  stats: { label: string; value: string; note?: string }[];
  table: { caption: string; head: string[]; rows: string[][]; bar?: { col: number } };
  meaning: string[];
  source: { name: string; title: string; url: string; published: string; period: string; population: string; definition: string };
  limits: string[]; reviewed: string; related: string[];
  cta: { text: string; href: string; label: string };
};
const INSTANTLY = { name: "Instantly", title: "Cold Email Benchmark Report: Reply Rates, Deliverability and Trends", url: "https://instantly.ai/cold-email-benchmark-report-2026", published: "Updated 12 January 2026", period: "1 January to 18 December 2025", population: "Aggregated, anonymised activity across thousands of active Instantly workspaces. The page gives no exact send count." };
const VALIDITY = { name: "Validity", title: "2026 Email Deliverability Benchmark Report", url: "https://www.validity.com/wp-content/uploads/2026/03/2026-Benchmark-Report.pdf", published: "March 2026", period: "Calendar year 2025", population: "Seed-test data from Validity customers who approved aggregation. The report gives no seed count." };
const ZB = { name: "ZeroBounce", title: "Email List Decay Report", url: "https://www.zerobounce.net/email-list-decay", published: "2026 edition", period: "January to December 2025", population: "More than 11 billion email addresses verified by ZeroBounce customers, from solo owners to large enterprises." };
const OPTIFAI = { name: "Optifai", title: "Sales Cycle Length Benchmark (Optifai Pipeline Study, 2026)", url: "https://optif.ai/learn/questions/sales-cycle-length-benchmark/", published: "Page last updated 20 April 2026", period: "Q2 2025 to Q1 2026", population: "939 B2B SaaS companies with stage-level CRM data." };
const VLIM = ["Seed testing measures placement for test sends. It is not the result of any one company's real campaigns.", "Figures cover email in general, not only B2B or cold outreach.", "Validity calls its data a snapshot in time; its own users may see different numbers.", "Only senders who approved aggregation are included."];
const ILIM = ["The data comes from Instantly's own platform and the page does not describe independent checking.", "The page does not say how a reply is defined (for example whether auto-replies are excluded).", "Instantly customers are cold-email senders using one platform, so the result may not describe other senders.", "Other vendors publish different averages; definitions and populations differ, so compare only like with like."];
const ZLIM = ["ZeroBounce customers choose to verify their lists, so the set is not a random sample of all email.", "The page gives no split between B2B and other lists.", "The page describes the 23% figure as 'invalid and risky' in one place and as 'invalid' in another.", "These are email-list figures, not a measure of any other data field."];

export const REPORTS: Record<string, Report> = {
  "cold-email-response-rate": {
    seoTitle: "Cold Email Reply Rate Benchmarks (2025 Data)", seoDesc: "Average and top-tier cold email reply rates from Instantly's 2026 report, with the source, period and limits stated.",
    summary: "Instantly reports an average cold email reply rate of 3.43% for 2025. Its top quartile starts at 5.5% and its top tier at about 10%.",
    stats: [{ label: "Average reply rate", value: "3.43%" }, { label: "Top quartile", value: "5.5%+" }, { label: "Top tier", value: "10.7%+", note: "The report's table says 10.7%+; its text says 'exceed 10%'." }],
    table: { caption: "Reply-rate tiers, Instantly, 2025 data", head: ["Tier", "Reply rate"], rows: [["Average", "3.43%"], ["Top 25%", "5.5%+"], ["Top 10% (elite)", "10.7%+"]], bar: { col: 1 } },
    meaning: ["The spread matters more than the average: the report says elite senders reach two to four times the average reply rate.", "The report links top results to message personalization, micro-segmentation, short first emails (under 80 words) and steady domain health. It does not measure how much each factor contributes, so these are associations, not proven causes.", "Your own result depends on your list, offer and definition of a reply. Use the tiers as a range to place yourself in, not a target to copy."],
    source: { ...INSTANTLY, definition: "Reply rate as reported by Instantly. The page does not define it further." }, limits: ILIM, reviewed: "2026-11-22",
    related: ["cold-email-follow-ups", "b2b-email-deliverability", "cold-email-bounce-rate"],
    cta: { text: "Reply rates start with a list that reaches real inboxes. See a free masked sample before you buy.", href: "/sample", label: "Request a free sample" },
  },
  "cold-email-follow-ups": {
    seoTitle: "Cold Email Follow-Up Benchmarks (2025 Data)", seoDesc: "How much of cold email replies come from follow-ups, per Instantly's 2026 report. Source, period and limits included.",
    summary: "In Instantly's 2025 data, 58% of replies came from the first email and 42% from the follow-ups that came after it.",
    stats: [{ label: "Replies from step one", value: "58%" }, { label: "Replies from follow-ups", value: "42%", note: "The FAQ names steps 2 to 4." }],
    table: { caption: "Share of replies by sequence step, Instantly, 2025 data", head: ["Sequence part", "Share of replies"], rows: [["Step one", "58%"], ["Follow-ups", "42%"]], bar: { col: 1 } },
    meaning: ["Nearly half of replies arrive after the first message, so a single email leaves a large share of possible replies uncollected.", "Instantly's guidance (not a measured result) is a sequence of 4 to 7 touchpoints about 3 to 4 days apart, and it reports that conversational step-two wording outperforms formal wording by about 30%.", "More follow-ups do not automatically mean more replies for every list. The report does not show how replies fall per step beyond this split."],
    source: { ...INSTANTLY, definition: "Share of replies by the step that received them, as reported by Instantly." }, limits: ILIM, reviewed: "2026-11-22",
    related: ["cold-email-response-rate", "b2b-email-deliverability", "email-verification"],
    cta: { text: "More touches only help if every address works. Browse ready-made lists with a masked sample on every page.", href: "/lists", label: "Browse lists" },
  },
  "b2b-email-deliverability": {
    seoTitle: "Email Deliverability Benchmarks by Provider (2025)", seoDesc: "Global inbox placement was 87.2% in 2025, with Gmail, Microsoft, Yahoo and Apple compared, per Validity's 2026 report.",
    summary: "Validity measured 87.2% global inbox placement in 2025, with 6.6% reaching spam and 6.1% going missing. Microsoft was the hardest major provider.",
    stats: [{ label: "Global inbox placement", value: "87.2%", note: "A 3.7 percent uplift year over year, per the report." }, { label: "Spam placement", value: "6.6%" }, { label: "Missing", value: "6.1%" }],
    table: { caption: "Inbox, spam and missing rates by mailbox provider, 2025", head: ["Provider", "Inbox", "Spam", "Missing"], rows: [["Gmail", "89.8%", "6.4%", "3.8%"], ["Yahoo", "87.3%", "6.4%", "6.3%"], ["Apple", "82.0%", "10.8%", "7.2%"], ["Microsoft (Outlook, Hotmail)", "77.4%", "15.1%", "7.5%"]], bar: { col: 1 } },
    meaning: ["The same message can land very differently by provider: Gmail placed 89.8% in the inbox, Microsoft 77.4%. A list with many Microsoft-hosted addresses faces a different environment than one that is mostly Gmail.", "For B2B senders the report gives two groups: hosting platforms at 83.0% inbox and filtering companies at 79.0%.", "Placement is affected by sender reputation, authentication and content as well as list quality. The report does not isolate list quality."],
    source: { ...VALIDITY, definition: "Inbox, spam and missing share of seed-test messages. 'Missing' means the message was found in neither inbox nor spam." }, limits: VLIM, reviewed: "2026-11-22",
    related: ["b2b-email-by-country", "cold-email-response-rate", "b2b-outreach-by-industry"],
    cta: { text: "Bounces and spam complaints start with bad addresses. Verify a list you already own before you send.", href: "/email-list-verification", label: "Email list verification" },
  },
  "b2b-email-by-country": {
    seoTitle: "Email Inbox Placement by Region and Country (2025)", seoDesc: "Inbox placement by region from Validity's 2026 report: Europe 91.1%, North America 86.7%, Asia 86.4%. Source and limits stated.",
    summary: "Validity's 2025 data shows inbox placement of 91.1% in Europe, 86.7% in North America and 86.4% in Asia. This is email in general, not B2B outreach only.",
    stats: [{ label: "Europe", value: "91.1%" }, { label: "North America", value: "86.7%" }, { label: "Asia", value: "86.4%", note: "China 88.9% and India 71.0% sit behind this figure." }],
    table: { caption: "Inbox, spam and missing rates by region, 2025", head: ["Region", "Inbox", "Spam", "Missing"], rows: [["Europe", "91.1%", "3.7%", "5.1%"], ["South America", "88.0%", "4.1%", "7.8%"], ["Oceania", "87.9%", "3.8%", "8.3%"], ["North America", "86.7%", "6.8%", "6.5%"], ["Asia", "86.4%", "2.4%", "11.2%"]], bar: { col: 1 } },
    meaning: ["Regions differ by several points. The report also states that Germany, France and the United Kingdom each exceed 90% inbox placement.", "Asia's single figure hides a wide gap: China 88.9% against India 71.0%. Regional averages can mislead for a specific country.", "The data does not tell you how B2B campaigns perform in each country, and it does not show per-country sample sizes."],
    source: { ...VALIDITY, definition: "Inbox, spam and missing share of seed-test messages, grouped by the recipient's region." }, limits: VLIM, reviewed: "2026-11-22",
    related: ["b2b-email-deliverability", "b2b-outreach-by-industry", "cold-email-response-rate"],
    cta: { text: "Need contacts in a specific country? Browse lists by country, each with a masked sample.", href: "/lists", label: "Browse lists" },
  },
  "b2b-outreach-by-industry": {
    seoTitle: "Email Inbox Placement by Industry (2025 Data)", seoDesc: "Inbox placement by industry from Validity's 2026 report: Transportation 97.2% to Real Estate 80.1%. Source and limits stated.",
    summary: "Validity's 2025 data ranges from 97.2% inbox placement for Transportation to 80.1% for Real Estate. Five of the report's 23 sectors are shown here.",
    stats: [{ label: "Highest shown", value: "97.2%", note: "Transportation" }, { label: "Healthcare Services", value: "80.3%" }, { label: "Lowest shown", value: "80.1%", note: "Real Estate" }],
    table: { caption: "Inbox, spam and missing rates for selected sectors, 2025", head: ["Sector", "Inbox", "Spam", "Missing"], rows: [["Transportation", "97.2%", "1.1%", "1.8%"], ["Energy, Utilities & Waste", "95.0%", "1.8%", "3.1%"], ["Finance", "88.8%", "6.5%", "4.6%"], ["Healthcare Services", "80.3%", "10.7%", "9.0%"], ["Real Estate", "80.1%", "15.9%", "4.1%"]], bar: { col: 1 } },
    meaning: ["Industry changes the picture sharply: Real Estate sent 15.9% of test messages to spam, Transportation 1.1%.", "Healthcare Services and Real Estate sit near the bottom of the full table, so outreach to those audiences leaves more room for care with list quality and sending practice.", "The table shows five sectors only; the full 23-sector table is on page 29 of the report. It measures email in general, not cold outreach."],
    source: { ...VALIDITY, definition: "Inbox, spam and missing share of seed-test messages, grouped by the sender's sector as Validity classifies it." }, limits: [...VLIM, "Only five of the 23 sectors are reproduced here."], reviewed: "2026-11-22",
    related: ["b2b-email-deliverability", "b2b-email-by-country", "cold-email-response-rate"],
    cta: { text: "Looking for a specific trade? Browse ready-made lists by industry.", href: "/lists", label: "Browse lists" },
  },
  "b2b-sales-cycle": {
    seoTitle: "B2B SaaS Sales Cycle Benchmarks by Deal Size (2026)", seoDesc: "Median B2B SaaS sales cycle is 84 days, from 14-30 days for SMB deals to 90-180+ for enterprise, per Optifai's 2026 study.",
    summary: "Optifai's pipeline study of 939 B2B SaaS companies puts the median sales cycle at 84 days. Small deals close in 14 to 30 days and enterprise deals take 90 to 180 days or more.",
    stats: [{ label: "Median sales cycle", value: "84 days", note: "Across all B2B SaaS in the study." }, { label: "Change since 2022", value: "22% longer" }, { label: "Buying committee", value: "6.8 people", note: "Up from 5.4, per the page." }],
    table: { caption: "Sales cycle range by annual contract value, 25th to 75th percentile", head: ["Deal size (ACV)", "Cycle length"], rows: [["SMB (under $15K)", "14-30 days"], ["Mid-market ($15K-$50K)", "30-60 days"], ["Upper mid ($50K-$100K)", "60-90 days"], ["Enterprise (over $100K)", "90-180+ days"]], bar: { col: 1 } },
    meaning: ["Deal size is the clearest driver in this data: the same company can run a two-week cycle on a small deal and a half-year cycle on a large one. Compare your cycle with the band that matches your contract value, not with the overall median.", "The page links longer cycles to bigger buying committees and more security review. That is the source's explanation, not something the data proves.", "A longer cycle means prospects need to be reached and followed up over more weeks, so contact data that stays valid matters more."],
    source: { ...OPTIFAI, definition: "Time through the pipeline stages (Discovery to Close) from CRM timestamps of won deals. The page does not state exactly where the cycle starts and ends." },
    limits: ["Only won deals are included, so deals that stalled or were lost do not shorten or lengthen the figures.", "The sample is B2B SaaS companies with stage-level CRM data, so it may not describe other industries.", "The page's text and its table use different mid-market bands ($15K-$100K at 30-90 days versus the split bands shown here).", "The 22% and buying-committee comparisons rely partly on outside sources, and the page does not explain its baseline.", "The publisher sells a sales pipeline product and the page includes product promotion."], reviewed: "2026-11-22",
    related: ["cold-email-follow-ups", "cold-email-response-rate", "b2b-data-decay"],
    cta: { text: "Long cycles need contacts that stay reachable. See how our lists are refreshed.", href: "/verification", label: "How we verify" },
  },
  "b2b-data-decay": {
    seoTitle: "Email List Decay Benchmarks (2021 to 2025)", seoDesc: "ZeroBounce reports at least 23% of an email list decayed in 2025. Five years of figures with source, period and limits.",
    summary: "ZeroBounce reports that at least 23% of email addresses decayed in 2025, down from 28% in 2024. These are email-list figures from a verification vendor, not a B2B-only measure.",
    stats: [{ label: "Annual decay, 2025", value: "23%+", note: "'At least 23%' per the report." }, { label: "Annual decay, 2024", value: "28%" }],
    table: { caption: "Reported annual email list decay by year, ZeroBounce", head: ["Year", "Decay"], rows: [["2021", "23%"], ["2022", "22%"], ["2023", "25%"], ["2024", "28%"], ["2025", "23%"]], bar: { col: 1 } },
    meaning: ["Roughly a quarter of an email list can stop working within a year, so a list that is not re-checked loses value even if it was clean when collected.", "The figure moved between 22% and 28% over five years. One year's change is not a trend on its own.", "Decay of other contact fields (phone, job title) is not measured here."],
    source: { ...ZB, definition: "Share of addresses ZeroBounce found invalid (and, in one place on the page, 'invalid and risky') among those verified." }, limits: ZLIM, reviewed: "2026-11-22",
    related: ["email-verification", "b2b-email-deliverability", "cold-email-follow-ups"],
    cta: { text: "BeigeLeads refreshes its databases every 90 days. See a masked sample of a current list.", href: "/sample", label: "Request a free sample" },
  },
  "email-verification": {
    seoTitle: "Email Verification Outcome Benchmarks (2025)", seoDesc: "Only 62% of emails ZeroBounce verified in 2025 were valid; 23% invalid and over 9% catch-all. Source and limits included.",
    summary: "Of the emails ZeroBounce verified in 2025, 62% were valid, 23% invalid and more than 9% catch-all.",
    stats: [{ label: "Valid", value: "62%" }, { label: "Invalid", value: "23%", note: "More than 2.6 billion addresses." }, { label: "Catch-all", value: "9%+", note: "More than 1 billion addresses." }],
    table: { caption: "Verification outcomes, ZeroBounce, 2025", head: ["Outcome", "Share"], rows: [["Valid", "62%"], ["Invalid", "23%"], ["Catch-all", "9%+"], ["Spam traps", "0.01% (over 1 million)"]], bar: { col: 1 } },
    meaning: ["Catch-all domains accept any address, so a verifier cannot confirm those individual mailboxes. That is why they form their own group.", "The same report counts over 155 million known complainers and over 5 million disposable addresses.", "These shares come from lists customers chose to verify. A list that was already cleaned would show a better split."],
    source: { ...ZB, definition: "Outcome category assigned by ZeroBounce's verification." }, limits: ZLIM, reviewed: "2026-11-22",
    related: ["b2b-data-decay", "b2b-email-deliverability", "cold-email-follow-ups"],
    cta: { text: "Already have a list? Our team checks it by hand.", href: "/email-list-verification", label: "Email list verification" },
  },
};
