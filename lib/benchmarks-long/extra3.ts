import type { Section } from "./types";

export const extra3: Record<string, Section[]> = {
  "email-verification": [
    { id: "workflow", heading: "Where verification fits in a sending workflow", body: `Verification is one step in a longer chain. Placing it correctly makes the numbers above useful.

1. **Collect or buy the list.** Note the source and the date.
2. **Verify.** Split the results into valid, invalid, catch-all and other groups.
3. **Suppress.** Remove invalid and risky addresses, and anyone who has opted out. A suppression list should apply to every file you send from.
4. **Send a small batch.** Watch bounces and complaints.
5. **Scale up.** Release the remainder in stages.
6. **Re-verify.** Repeat on a schedule that matches how fast your list changes.

### Real-time versus bulk

The report mentions both bulk verification of a file and real-time verification at the point of entry. Bulk checks fix a list you already hold. Real-time checks prevent typos and disposable addresses from entering a list in the first place, which the report credits with preventing more than 10 million bounces through typo detection and more than 5 million through disposable detection. If you collect addresses through forms, entry-time checks are usually cheaper than cleaning later.

### Opt-outs are separate

Verification says whether a mailbox exists. It does not say whether the person agreed to hear from you or has asked you to stop. Opt-out handling is a separate duty. In the United States, the FTC's CAN-SPAM guidance, which covers business email as well, requires honoring opt-out requests within 10 business days; we checked this on 18 November 2026, and rules in other countries differ. BeigeLeads provides an [opt-out page](/opt-out) that adds addresses to its suppression list.` },
  ],
  "b2b-data-decay": [
    { id: "schedule", heading: "Choosing a re-check schedule", body: `How often to re-check depends on how fast your list changes and how costly a bounce is for you. ZeroBounce's own advice is quarterly at minimum and monthly for fast-growing databases. That advice comes from a verification vendor, so weigh it accordingly, but the arithmetic behind it is straightforward.

### Factors that argue for checking more often

- You add many new contacts each month.
- Your list includes older segments that have not been mailed recently.
- You send large volumes, so a spike in bounces affects your reputation quickly.
- Your sending domain is new or has a modest reputation.

### Factors that allow a longer gap

- The list is small and mailed often, so bounces show up quickly.
- Contacts engage regularly, which means addresses are in use.
- You verify at entry and again before each large send.

### A simple rule of thumb

Verify before every large send, and at least on the vendor's quarterly schedule. If a check on a sample shows more than a few percent invalid, check the whole list. These are general practices rather than findings from the report.

### What to record

Keep three fields next to each list: the source, the date it was collected and the date it was last verified. When you pick a list for a campaign, sort by last verified. The dates turn decay from an abstract percentage into a working rule: lists past a certain age get checked first.` },
  ],
  "b2b-email-by-country": [
    { id: "providers", heading: "Why the provider mix explains much of the regional picture", body: `The report points to provider mix repeatedly. Looking at the numbers it gives, a pattern emerges that is worth spelling out.

- Gmail placed 89.8% of test messages in the inbox globally, Microsoft 77.4%. A region with more Gmail will tend to score higher, and one with more Microsoft will tend to score lower. The report notes that Brazil has Gmail at 59.7% share and Microsoft at 21.7%, while the UK's Microsoft share is double the global average.
- In China, major providers show over 90% coverage, while China-specific providers average 57.9%. The regional average therefore depends on how mail is split between the two.
- In India, Gmail covers 89.7%, but the country averages 71.0%, which suggests other providers pull it down.

### What this means for buyers of lists

When you evaluate a list for a country, the domain mix is a useful property to ask about. A list of company addresses in Germany sits on business hosting platforms and corporate filters, which can behave differently from consumer mailboxes. We do not have a published number for that, and the report does not give one. What the report does show is that provider mix is a plausible driver of regional differences, which is a reason to look at it before you set expectations.

### How to find your own mix

Count the domains in a list. A short script or a spreadsheet pivot on the part of each address after the @ sign gives you the share at each domain. Group the largest into hosting platforms or providers, and note how many sit at unknown or custom domains. That gives you an exposure profile for the list, which is more useful than a regional average.` },
  ],
  "b2b-outreach-by-industry": [
    { id: "segment", heading: "Building your own sector benchmark", body: `If you send to several industries, you can build a benchmark of your own that is more relevant than any published table. This is general guidance.

1. **Tag every list by industry.** Use a consistent label.
2. **Send comparable campaigns.** Keep the offer, the copy and the sending setup as similar as possible across sectors.
3. **Track the same measures for each.** Bounce rate, reply rate, unsubscribe rate and, if you can see it, spam placement.
4. **Wait for enough volume.** A few hundred emails per sector will swing a lot. Several thousand is steadier.
5. **Compare after several sends.** One campaign tells you little.
6. **Record the date.** Sector behavior can move; the Validity data shows swings of several points in a year.

### Why this beats a published average

Published tables describe senders in aggregate. Your own results reflect your sender reputation, your content and your lists. If real estate contacts bounce at 4% and transport contacts at 1% on your lists, that is directly actionable, regardless of what any table says.

### Using BeigeLeads data for a sector test

If you want contacts for a sector test, you can browse [lists by industry](/lists) and request a free masked sample of the one you want. Every list page shows which fields are included and when the data was last updated, and BeigeLeads refreshes its databases every 90 days. That lets you compare sectors using data of similar freshness, which removes one source of noise from your test.` },
  ],
};
