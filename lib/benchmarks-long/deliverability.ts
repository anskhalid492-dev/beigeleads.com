import type { Long } from "./types";

// Source: Validity, "2026 Email Deliverability Benchmark Report" (March 2026, 2025 seed data), re-read on 22 Nov 2026.
export const deliverability: Record<string, Long> = {
  "b2b-email-deliverability": {
    sections: [
      { id: "how", heading: "How Validity measured inbox placement", body: `Validity's report is built on **seed data**. Validity customers send test campaigns to seed addresses at "hundreds of MBPs and spam filters around the world" (MBP means mailbox provider, such as Gmail or Microsoft). Software then records whether each test message was delivered and, if so, whether it reached the inbox or the spam folder.

The results are compiled in Validity's Mailbox Provider Community reporting suite. Senders who did not approve their data for this aggregation are excluded. The period is calendar year 2025, reported by quarter, with comparisons to the prior year's report. The report does not state a sample size.

### The four measures

The report defines the measures this way:

- **Delivered rate:** the figure an email service provider reports as sent minus bounced. The report says it does not show where mail landed.
- **Inbox placement rate (IPR):** emails that reached the inbox as a share of total emails sent.
- **Spam placement rate:** emails placed in the spam folder as a share of total sent.
- **Missing rate:** mail that the provider deferred or blocked, so it reached neither the inbox nor the spam folder.

The difference between "delivered" and "inbox" is the point of the whole report. A message can be accepted by a provider and still sit in spam. A sender who only looks at the delivered rate sees none of that.

### What seed testing can and cannot show

Seed testing measures how providers treat test sends. It is a controlled way to compare placement across providers. It is not the result of any one company's real campaigns, and it does not capture how real recipients behave, such as whether they open, delete or mark as junk. Validity itself calls the data "a snapshot in time" and notes that regular users may see different numbers in their own reporting. Some 2026 figures in the report are forecasts, not measurements.` },
      { id: "global", heading: "The global picture for 2025", body: `Validity reports these averages for 2025:

- **Inbox placement:** 87.2%, up 3.7% year over year. The report's wording is "The average global inbox placement rate for 2025 was 87.2 percent."
- **Spam placement:** 6.6%.
- **Missing:** 6.1%. The report attributes part of the inbox gain to lower missing rates.
- **Spam complaint rate:** 0.06% on average.
- **Unknown users (invalid addresses, equivalent to hard bounces):** 1.46% on average.
- **Rejected rate (mail providers deliberately block):** 3.20% on average.

Sending volume fell year over year for the first time in the report's history, though the report gives no numeric average. Quarterly inbox placement ran between roughly 86.35% and 87.62%, but the layout of the report does not clearly tie each value to a quarter, so we do not assign them.

### Reading 87.2% correctly

An 87.2% inbox rate means that, on average in these tests, about 13 in 100 test messages did not reach the inbox: 6.6% went to spam and 6.1% went missing (the rest is rounding). For a sender, that is a floor of roughly one message in eight that never gets seen.

The figure is an average across all participating senders and all providers. A sender with weak authentication, a poor reputation or old data will sit below it. A sender with a strong reputation can sit above it. The report does not isolate list quality as a cause, so you cannot conclude from it how much of the 12.8% non-inbox share is caused by the list rather than by reputation, content or authentication.

### Complaints and bounces

The report treats a spam complaint as a subscriber clicking "this is spam" or "mark as junk", and separates it from an unsubscribe, which does not harm reputation. It says that "under 0.1 percent is now the expectation" for complaint rates, compared with older guidance of below 0.2 to 0.3 percent. The average complaint rate in the data is 0.06%. Unknown users, meaning invalid addresses, averaged 1.46%. Bad addresses are the part of this picture that a list owner controls most directly.` },
      { id: "providers", heading: "Provider by provider", body: `Validity breaks 2025 results down by the four largest providers, often grouped as MAGY (Microsoft, Apple, Gmail, Yahoo):

| Provider | Inbox | Spam | Missing |
|---|---|---|---|
| Gmail | 89.8% | 6.4% | 3.8% |
| Yahoo | 87.3% | 6.4% | 6.3% |
| Apple | 82.0% | 10.8% | 7.2% |
| Microsoft | 77.4% | 15.1% | 7.5% |

The report notes year-over-year improvements: Gmail up 2.6%, Microsoft up 1.8%, Apple up 5.7%, and Yahoo 1.3% above the prior report.

Microsoft is the hardest of the four in this data: only 77.4% reached the inbox, and 15.1% went to spam. Gmail is the easiest at 89.8%. That 12.4 percentage point gap between them is larger than the gap between the global average and the best provider.

### Market share changes the weighting

The report gives global mailbox shares: Gmail 42.9% (down from 47.8%), Yahoo 15.7%, Microsoft 14.4%, Apple 3.6%, other providers 23.4%. It says the MAGY providers "represent over three-quarters of global mailbox users". The share of other providers is a reminder that regional and corporate mailboxes also matter. Average inbox placement at regional providers trails MAGY by roughly 10 to 25 percentage points, according to the report.

The report also looks ahead. It expects Yahoo to dip in the short term after absorbing AT&T and Comcast subscribers, whose own placement figures were 80.3% and 76.8%, and then recover, and it expects Microsoft and Apple to trend upward. Those are forecasts, not measurements.

### What this means for a list

Your list's mix of providers affects your expected inbox rate before you write a word. A list heavy in Microsoft-hosted addresses faces the 77.4% environment. One that is mostly Gmail faces 89.8%. This is why a single "deliverability" number from a tool can mislead: it depends on who is on the list. You can ask a list seller for the domain mix, or work it out yourself from a sample.` },
      { id: "b2b", heading: "The B2B-specific findings", body: `Validity includes a short B2B view that splits business mailboxes into two groups, and it is the part of the report most relevant to outbound sales.

- **Hosting platforms** (where company mailboxes live): inbox 83.0%, spam 9.6%, missing 7.4%. Down 1.3% year over year.
- **Filtering companies** (security gateways that sit in front of the mailbox): inbox 79.0%, spam 12.6%, missing 8.5%. Down 5.8% year over year.

Both groups sit below the 87.2% global average, and both declined. The report describes a "double whammy": a business email must pass the hosting platform and then the corporate filter.

Hosting market share in the data is Office 365 at 60.3%, Google Apps at 35.9% and Rackspace at 0.9%. Filtering share is Proofpoint at 50.5%, Mimecast at 20.7% and Cisco at 11.8%.

### What the B2B figures do not say

They describe test placement for business mailboxes in general. They are not a measure of cold outreach and do not show how personalization, volume or domain age change placement. The report does not publish a B2B reply rate, a bounce rate for business lists, or an inbox rate for a particular job title.

The decline in the filtering group (down 5.8%) is notable, but the report does not explain it, so we do not offer a cause either.

### Authentication

On authentication, the report recommends SPF and DKIM records that pass validation and a DMARC policy of at least quarantine, ideally reject. It notes that forwarding can break authentication when the forwarding IP differs from the original sending IP, and recommends ARC (RFC 8617) to preserve results. It also says the bulk sender requirements introduced by large providers include DMARC authentication, one-click unsubscribe and low complaint rates. We checked Google's sender guidelines on 18 November 2026: they apply to senders of 5,000 or more messages a day and set a spam rate target below 0.10%, with 0.30% as a ceiling.` },
      { id: "actions", heading: "Turning the findings into actions", body: `The report ends with thirteen recommendations. The ones that bear on lists and sending are:

1. Track inbox placement, not just delivered rate.
2. Monitor Sender Score and act when it drops.
3. Verify contacts at sign-up and regularly, and remove stale addresses.
4. Aim for complaint rates below 0.1%.
5. Use reply-enabled addresses instead of no-reply.
6. Enforce SPF, DKIM and DMARC.
7. Reduce reliance on opens and clicks, which the report calls unreliable because of Apple Mail Privacy Protection and bot clicks.

Note that Sender Score thresholds are given two ways in the report: "consistently above 90" in one place, and above 85 as strong with below 80 indicating issues in another. We report both rather than pick one.

### What a list owner controls

Among these factors, the list is the one you can change before sending. The report's own unknown-user average of 1.46% is the share of test sends that hit invalid addresses. Verifying addresses removes that share. It cannot fix a poor reputation or weak authentication, and it cannot change how Microsoft or a corporate filter treats your content.

If you already hold a list, [email list verification](/email-list-verification) checks it by hand before you send. If you are buying one, you can [request a free masked sample](/sample) first. BeigeLeads refreshes its databases every 90 days; see how that works on the [verification page](/verification).

### Related benchmarks

See [placement by region and country](/benchmarks/b2b-email-by-country), [placement by industry](/benchmarks/b2b-outreach-by-industry), and [cold email reply rates](/benchmarks/cold-email-response-rate) for what happens after a message reaches the inbox.` },
    ],
    faq: [
      { q: "What was the global inbox placement rate in 2025?", a: "Validity reports 87.2%, with 6.6% reaching spam and 6.1% missing, based on seed-test data." },
      { q: "What does 'missing' mean?", a: "Mail that the provider deferred or blocked, so it reached neither the inbox nor the spam folder." },
      { q: "Which provider placed the lowest share in the inbox?", a: "Microsoft, at 77.4% inbox and 15.1% spam. Gmail was highest of the four at 89.8%." },
      { q: "Is this data about B2B cold email?", a: "No. It covers email in general from Validity customers who approved aggregation. The B2B figures describe placement at business mailboxes, not cold outreach performance." },
      { q: "What complaint rate should I aim for?", a: "Validity says under 0.1 percent is now the expectation. The average complaint rate in its data was 0.06%." },
      { q: "Does list quality change inbox placement?", a: "It is one factor among reputation, authentication and content. The report does not isolate it, so it cannot say how much." },
    ],
  },
  "b2b-email-by-country": {
    sections: [
      { id: "region-method", heading: "What the regional data is and is not", body: `The regional figures come from the same Validity seed-test dataset as the provider results: test messages sent to seed addresses at mailbox providers around the world, with the software recording inbox, spam or missing for each. The period is calendar year 2025. Senders who did not approve aggregation are excluded, and the report gives no sample size or per-country counts.

Two limits shape everything below. First, the data describes **email in general**, not B2B cold outreach. Second, results are grouped by where the recipient's mailbox provider sits. A message from a sender in one country to a recipient in another is counted by the recipient's region.

BeigeLeads did not run these tests. We reproduce Validity's figures as stated.

### Regional results

| Region | Inbox | Spam | Missing | Change vs. prior year |
|---|---|---|---|---|
| Europe | 91.1% | 3.7% | 5.1% | +2% |
| South America | 88.0% | 4.1% | 7.8% | +10.6% |
| Oceania | 87.9% | 3.8% | 8.3% | +3% |
| North America | 86.7% | 6.8% | 6.5% | +1.7% |
| Asia | 86.4% | 2.4% | 11.2% | +8.3% |

Europe has the highest inbox rate. North America has the highest spam rate, at 6.8%. Asia has the lowest spam rate (2.4%) but also the highest missing rate (11.2%), which means a larger share of mail there is deferred or blocked instead of filtered to spam. South America shows the largest improvement year over year (+10.6%), followed by Asia (+8.3%).

The five regions span only 4.7 percentage points of inbox placement, from 86.4% to 91.1%. The differences are real but moderate. The country-level and provider-level differences inside a region are often larger.` },
      { id: "country", heading: "Country detail inside each region", body: `The report names a few countries with figures. Some country-level numbers are not cleanly separable in the report's layout, so where we say "about", we mean read from a chart rather than stated in text.

### Europe

France, Germany and the United Kingdom each exceed 90% inbox placement, and Germany is described as having the highest inbox placement of the countries monitored. The report notes that the UK's Microsoft share is "double the global average". Because Microsoft is the hardest of the major providers (77.4% inbox globally), a high Microsoft share is a reason to check placement for the UK specifically.

### North America

The report describes a "three percent gap" between the two countries. Read from the layout, the United States is about 86.8% and Canada about 89.4%. These are approximate.

### Asia

Asia is where a regional average hides the most. China shows 88.9% inbox, with major providers at over 90% coverage. China-specific providers (Tencent/QQ and Netease) average 57.9%. India averages 71.0%, with Gmail at 89.7% coverage. So the region's 86.4% combines a high-performing country, a mixed one and a lower one.

### Oceania and South America

Australia is about 87.8%. Microsoft covers 28.7% of the region, and the regional provider BigPond holds 5.8%. In South America, Brazil is about 89.0%, with Gmail at 59.7% share and Microsoft at 21.7%.

### Regional providers trail the big four

The report says average inbox placement at regional providers trails the MAGY providers by roughly 10 to 25 percentage points. By region the gap is: Asia –10.8%, Europe –11.4%, North America –9.3%, Oceania –19.4%, South America –25.3%. Regional provider inbox averages are listed as Asia 75.6%, Europe 79.7%, North America 77.4%, Oceania 68.5% and South America 62.7%.

If your list is heavy in local providers, the regional average may not describe you.` },
      { id: "reading", heading: "How to use country data when you buy or build a list", body: `The regional table answers one narrow question: how did test messages sent to seed addresses in each region fare in 2025? It does not tell you how a B2B campaign will perform in a given country. The report publishes no B2B reply rate, bounce rate or complaint rate by country.

Here is a sensible way to use it, as general guidance.

1. **Start from the provider mix, not the country name.** Within a country, the share of Gmail, Microsoft, local providers and corporate gateways drives placement. The same country can look very different for consumer mailboxes and business mailboxes.
2. **Treat a regional average with caution for a single country.** The China and India figures show how far apart two countries in the same region can be.
3. **Check the legal rules for the country.** Placement is a technical measure. Whether you may email someone is a legal question that differs by country. Our [lawful use policy](/legal/lawful-use) and [data sources page](/data-sources) explain how we approach it. The [legal pages](/legal/privacy) describe where we operate.
4. **Verify the list for the country you target.** Invalid addresses are a separate cause of failure from regional filtering. The report's unknown-user rate (invalid addresses) averages 1.46% globally.

### What differences across regions are not

Do not read the table as a ranking of how good mailbox providers are, or as proof that senders in one region follow better practices. The report measures test placement by recipient location. It does not say why Europe sits higher or North America sits lower. Possible reasons, such as provider mix, filtering rules and sender behavior, are not tested.

### Finding lists by country

If you need contacts in a specific country, you can [browse BeigeLeads lists](/lists) by country. Every list page includes a masked sample. To see what a country's data looks like before buying, [request a free sample](/sample).

For the global picture and provider detail, see [email deliverability by provider](/benchmarks/b2b-email-deliverability). For industry differences, see [placement by industry](/benchmarks/b2b-outreach-by-industry).` },
      { id: "caution", heading: "Cautions about regional numbers", body: `Regional benchmarks are tempting because they look precise. Four cautions apply.

- **No per-country sample sizes.** A country figure may rest on far fewer seed addresses than a region figure. The report does not say.
- **Year-over-year jumps can reflect measurement changes.** South America's +10.6% and Asia's +8.3% are large. The report does not explain what drove them, so avoid building a strategy on one year's jump.
- **Seed addresses are not your recipients.** Test addresses are set up by the vendor at each provider. Real recipients have histories, engagement and filters that seeds do not.
- **Spam and missing are different failures.** Asia's low spam rate (2.4%) does not mean mail arrives. Its missing rate is 11.2%, the highest of the five regions, and missing mail is not visible in the spam folder.

### Why "inbox" is not the same as "response"

Even a message in the inbox of a Gmail user in Germany still needs to be read and judged relevant. The report's recommendations point away from opens and clicks as measures, because of Apple Mail Privacy Protection and bot clicks, and toward replies and conversions. For reply benchmarks from a different source, see [cold email reply rates](/benchmarks/cold-email-response-rate).` },
    ],
    faq: [
      { q: "Which region has the highest inbox placement?", a: "Europe, at 91.1% in Validity's 2025 data. France, Germany and the United Kingdom each exceed 90%." },
      { q: "Which region has the highest spam rate?", a: "North America, at 6.8%. Asia has the lowest spam rate (2.4%) but the highest missing rate (11.2%)." },
      { q: "Why is India so much lower than China?", a: "The report gives India 71.0% and China 88.9% but does not explain the gap. It notes China-specific providers average 57.9%." },
      { q: "Does this show how B2B campaigns perform by country?", a: "No. It measures test-message placement for email in general, grouped by the recipient's region." },
      { q: "Are the United States and Canada figures exact?", a: "No. The report's layout does not separate them cleanly. Read from the chart, the US is about 86.8% and Canada about 89.4%." },
      { q: "Can I sell or email to any country?", a: "Placement is technical. Whether you may email someone depends on the laws that apply. See our lawful use policy and data sources page." },
    ],
  },
  "b2b-outreach-by-industry": {
    sections: [
      { id: "ind-method", heading: "What the industry table measures", body: `Validity's 2026 report includes a table of 2025 inbox, spam and missing rates by sector. Our summary at the top shows five. Below we list every sector row we could read in the report, 21 in all, so you can see the whole range.

The table is built from the same seed-test dataset as the other Validity benchmarks: test messages sent to seed addresses at mailbox providers, grouped by the **sender's sector** as Validity classifies it. The period is calendar year 2025. The report gives no sample size per sector.

It measures email in general, not B2B outreach. A retailer's promotional email and a software firm's product notice are in the data alongside business-to-business messages. So a sector's number reflects how that sector's senders, content and audiences fare, not how cold outreach to that sector would fare.

BeigeLeads did not run these tests. We list Validity's numbers as stated.

### The full sector table

| Sector | Inbox | Spam | Missing |
|---|---|---|---|
| Transportation | 97.2% | 1.1% | 1.8% |
| Energy, Utilities & Waste | 95.0% | 1.8% | 3.1% |
| Telecommunications | 92.6% | 4.7% | 2.7% |
| Government | 91.4% | 5.4% | 3.2% |
| Travel & Hospitality | 90.8% | 4.1% | 5.1% |
| Insurance | 90.4% | 3.6% | 6.1% |
| Retail | 90.4% | 2.7% | 6.9% |
| Holding Companies & Conglomerates | 90.2% | 3.3% | 6.6% |
| Manufacturing | 89.9% | 5.7% | 4.4% |
| Finance | 88.8% | 6.5% | 4.6% |
| Hospitals & Physicians Clinics | 88.4% | 8.2% | 3.4% |
| Media & Internet | 88.1% | 4.3% | 7.7% |
| Organizations | 87.7% | 4.5% | 7.8% |
| Education | 87.6% | 7.9% | 4.5% |
| Construction | 86.5% | 10.6% | 2.9% |
| Software | 85.7% | 7.7% | 6.6% |
| Business Services | 85.1% | 7.7% | 7.2% |
| Law Firms & Legal Services | 82.1% | 8.0% | 9.9% |
| Consumer Services | 81.2% | 10.9% | 7.9% |
| Healthcare Services | 80.3% | 10.7% | 9.0% |
| Real Estate | 80.1% | 15.9% | 4.1% |` },
      { id: "spread", heading: "The spread across sectors", body: `Among the rows we could read, the distance from the best sector to the worst is 17.1 percentage points of inbox placement: Transportation at 97.2% and Real Estate at 80.1%. The global average in the same report is 87.2%, so the top sectors sit about 10 points above it and the bottom sectors about 7 points below.

Look at the spam column for the pattern behind the inbox figures:

- **Lowest spam rates:** Transportation (1.1%), Energy, Utilities & Waste (1.8%), Retail (2.7%).
- **Highest spam rates:** Real Estate (15.9%), Consumer Services (10.9%), Healthcare Services (10.7%), Construction (10.6%).

Real Estate sends nearly 16 of every 100 test messages to spam, more than fourteen times the rate of Transportation. Its missing rate (4.1%) is modest, so its problem is mainly spam filtering. Law Firms & Legal Services shows the opposite shape: a lower spam rate (8.0%) but the highest missing rate (9.9%).

### Movement in the year

The report lists the biggest gains as Transportation and Business Services (+8.4% each) and Energy, Utilities & Waste (+8.2%), and the biggest declines as Construction (–6.9%), Law Firms & Legal Services (–5.2%) and Government (–4.9%). It also gives two provider-level details for Real Estate: a Gmail spam rate of 20.7% and a Microsoft missing rate of 22.4%.

Those year-over-year moves are sizable, but one year does not establish a trend. The report does not explain them, and neither do we.

### What a sector number does and does not mean

A low inbox rate in a sector can come from the content that sector tends to send, how its audiences react, the providers its recipients use, or the sending practices of the senders in the dataset. The report does not separate these. It would be wrong to conclude that sending to real estate agents is inherently worse than sending to transport firms. The data is about senders in each sector.` },
      { id: "outreach", heading: "Using sector data in B2B outreach planning", body: `Sector data is useful as a prompt for care, not as a forecast. The following is general guidance, not a finding from the report.

1. **Expect more filtering pressure in sectors with high spam rates.** If you sell to or write about topics in the bottom of the table, be extra careful with list hygiene, volume ramp-up and authentication.
2. **Check the audience's provider mix.** Business recipients in different sectors sit behind different hosting platforms and filters. The report's B2B findings show 83.0% inbox for hosting platforms and 79.0% for filtering companies, both below the global average. See [email deliverability by provider](/benchmarks/b2b-email-deliverability).
3. **Do not assume your own result will match.** The sector figure describes senders in that sector. Your reputation, authentication and content decide your outcome.
4. **Use sector as a segment, not a guess.** Run a small test to a sector, measure bounce and reply, then scale.

### The sender versus the recipient

The data groups by the sender's sector, not the recipient's. If you are a software company emailing hospitals, the relevant row for your sending environment is closer to Software (85.7% inbox) than to Hospitals & Physicians Clinics (88.4%). The recipient's mailbox provider and security stack matter too, but they are measured in other parts of the report. This is a common point of confusion with industry tables, and the report's wording is about senders.

### Where list quality fits

The invalid-address share (unknown users) averages 1.46% across the dataset. That figure is not given by sector. So we cannot say that real estate lists bounce more than transport lists. What we can say is that any sector benefits from sending only to verified addresses, and that the sectors at the bottom of the table have the least margin for avoidable problems.

For a trade-specific list, [browse lists by industry](/lists). For a list you already have, [email list verification](/email-list-verification) checks addresses before you send. See also [placement by region](/benchmarks/b2b-email-by-country) and [cold email reply rates](/benchmarks/cold-email-response-rate).` },
      { id: "ind-cautions", heading: "Cautions", body: `Sector labels are Validity's classification. Businesses do not always map neatly to one sector, and the report does not describe how edge cases were assigned. "Organizations" and "Holding Companies & Conglomerates" are broad groups whose content varies widely.

The report also does not provide sector-level sample sizes, so a sector with few senders may show larger swings. And because senders approved aggregation voluntarily, the dataset leans toward companies that already use a deliverability monitoring tool. Those senders tend to pay attention to deliverability, which may make the averages look better than for the average business.

Finally, the sector data cannot say how email performs for outreach to a specific job title or company size. If you need that, the only reliable path is measuring your own campaigns by segment.` },
    ],
    faq: [
      { q: "Which industry has the highest inbox placement?", a: "Transportation, at 97.2% in Validity's 2025 data, followed by Energy, Utilities & Waste at 95.0%." },
      { q: "Which industry has the lowest?", a: "Real Estate, at 80.1% inbox and a 15.9% spam rate, just below Healthcare Services at 80.3%." },
      { q: "Is the sector the sender's or the recipient's?", a: "The sender's, as Validity classifies it." },
      { q: "Does this tell me how cold outreach to a sector will perform?", a: "No. It measures email in general from senders in each sector, not cold outreach or reply results." },
      { q: "Why does the article list more sectors than the summary?", a: "The summary shows five sectors for a quick comparison. The article lists every sector row we could read in the report, 21 in all." },
      { q: "Can verifying my list move me up this table?", a: "Verification removes invalid addresses, which helps one source of problems. Placement also depends on reputation, authentication and content, so it cannot guarantee a sector-level result." },
    ],
  },
};
