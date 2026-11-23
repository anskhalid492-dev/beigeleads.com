import type { Section } from "./types";

// Additional sections per benchmark: glossary, worked arithmetic (clearly labelled as illustration), checklists and review questions.
// No new source figures are introduced here; every number is one already stated by the source, or simple arithmetic on those numbers.
export const extra: Record<string, Section[]> = {
  "cold-email-response-rate": [
    { id: "worked", heading: "A worked example (illustration only)", body: `Numbers are easier to judge with a concrete case. The arithmetic below is an illustration built on the report's tiers. It is not a prediction and not a measured result.

Imagine you send 10,000 emails in total across a sequence, counting every follow-up. Using the report's overall reply-rate definition (all replies divided by all emails sent):

| Tier | Reply rate | Replies from 10,000 emails |
|---|---|---|
| Average | 3.43% | 343 |
| Top 25% | 5.5% | 550 |
| Top 10% | 10.7% | 1,070 |

The jump from the average to the elite tier is about 727 more replies from the same volume. That is the practical meaning of "2-4x".

### Now remove the bounces

Suppose 2% of those emails bounce, the ceiling the report gives. Then 200 of the 10,000 never reach anyone. If you compute your reply rate on all 10,000 sent, the bounces count against you, because the definition divides by emails sent. A cleaner list raises the reply rate without changing a word of copy. If 8% bounced instead, 800 emails would be wasted, and the same number of replies would produce a lower rate. This is arithmetic on a definition, not a claim about how much any list improves results.

### Replies versus conversations

Of 343 replies, some will be negative, some automatic and some neutral. The report does not give the split. If you want to know how many of your replies lead to a call, count them directly. A reply rate of 3.43% with many positive replies can be worth more than 5.5% made mostly of "unsubscribe me".` },
    { id: "glossary", heading: "Terms used in this report", body: `Some vocabulary makes the report easier to read.

- **Reply rate:** replies divided by emails sent (overall) or leads who replied divided by leads who got the first email (first-touch).
- **Sequence:** a planned series of emails sent to the same lead over time.
- **Touchpoint:** one message in a sequence.
- **Workspace:** an account on the platform. The report's population is workspaces.
- **Elite or top tier:** senders in the top 10% by reply rate.
- **Inbox placement:** whether a message lands in the inbox, as opposed to spam. The report discusses it but gives no percentages.
- **Warm-up:** gradually raising daily sends on a new inbox so providers see steady behavior.
- **SPF, DKIM and DMARC:** the authentication standards the report recommends.
- **Bounce:** a message that could not be delivered, often because the address is invalid.

More detail on related terms is in the [glossary](/glossary).

### Questions to ask before you compare yourself with a benchmark

1. Does my tool define a reply the same way?
2. Does my denominator include follow-ups?
3. Am I comparing cold email with warm email?
4. Is my sample large enough that one campaign is not noise?
5. Have I looked at bounces first?

If any answer is no, fix the comparison before you draw a conclusion.` },
  ],
  "cold-email-follow-ups": [
    { id: "worked", heading: "A worked example (illustration only)", body: `This example applies the 58/42 split to a hypothetical campaign. The numbers are invented for the illustration, except the split, which is the report's.

Suppose a campaign produces 100 replies in total.

| Source | Share | Replies |
|---|---|---|
| Step one | 58% | 58 |
| Follow-ups | 42% | 42 |

If the sender had stopped after step one, those 42 replies would not exist. Put differently, adding follow-ups raised the total from 58 to 100, a gain of about 72% over the single-email result. That is simple arithmetic: 42 divided by 58. It assumes the same leads and the same behavior, which will never hold exactly.

### What changes if bounces are high

Now suppose 10 of every 100 addresses are invalid. Those leads never see step one and never see a follow-up. A longer sequence cannot rescue them. Every follow-up to an invalid address is one more bounce. A cleaner list means follow-ups reach the people they were meant for. This is the main reason to verify before you start a multi-step sequence.

### How many messages does a lead actually receive?

A lead who replies at step two does not receive step three. A lead who unsubscribes at step four does not receive step five. So the total emails sent is lower than leads times steps. The report's overall reply rate divides by emails actually sent, which is why it is not the same as the per-lead measure.` },
    { id: "checklist", heading: "A checklist for building a sequence", body: `This checklist is general guidance informed by the report's recommendations. It is not an official standard.

1. **Clean the list first.** Remove invalid addresses and duplicates.
2. **Decide the number of steps.** Start inside the 4 to 7 range.
3. **Space the messages.** Three to four days is the report's suggestion.
4. **Keep the first email short.** Under 80 words is the report's best-performing length.
5. **Make the ask small.** One question or one simple request.
6. **Write step two like a human reply.** The report says this outperforms formal wording by about 30%.
7. **Give each step a reason to exist.** A new angle, a short example or a clearer question.
8. **Honor opt-outs everywhere.** One request stops all later steps.
9. **Watch bounces and complaints.** Pause if either rises.
10. **Review by step.** Record how many replies each step produced and compare with 58/42.

### Common mistakes

- **Sending the same message again.** A resend with no new information gives a reader no reason to reply.
- **Stopping at step one.** The data suggests a large share of replies is left behind.
- **Ignoring time zones and weekends.** The report gives no time-of-day data, but a message that arrives at an odd hour can be buried.
- **Counting only positive replies as success.** Negative replies still show people read the message, and they are the ones to suppress quickly.
- **Using one long sequence for every lead.** Different segments may deserve different lengths.

### Reading the 30% claim carefully

The "about 30%" advantage for reply-style follow-ups is the report's own claim, with no sample size or method given. It is a reason to test conversational wording, not a guarantee of a 30% gain.` },
  ],
  "b2b-email-deliverability": [
    { id: "glossary", heading: "Terms used in the Validity report", body: `Deliverability has its own vocabulary, and several terms are easy to confuse.

- **MBP (mailbox provider):** the service that hosts the recipient's mailbox, such as Gmail or Microsoft.
- **MAGY:** shorthand for Microsoft, Apple, Gmail and Yahoo.
- **Seed list:** test addresses created at providers so a sender can see where a test message lands.
- **Inbox placement rate:** share of test messages that reached the inbox.
- **Spam placement rate:** share that reached the spam folder.
- **Missing rate:** share deferred or blocked, reaching neither.
- **Delivered rate:** sent minus bounced, as an email service provider reports it. It does not show where mail landed.
- **Unknown user:** an invalid address, equivalent to a hard bounce.
- **Rejected:** mail a provider deliberately blocks.
- **Spam complaint:** a recipient marking a message as spam or junk. It differs from an unsubscribe.
- **Sender Score:** a reputation score. The report gives two thresholds and we show both.
- **ARC:** a standard (RFC 8617) that helps preserve authentication results when mail is forwarded.

### A worked example (illustration only)

Imagine you send 10,000 test-equivalent messages with Validity's average results: 87.2% inbox, 6.6% spam, 6.1% missing. About 8,720 reach the inbox, 660 go to spam and 610 go missing. Delivered rate, as an email service provider reports it, could look far higher than 87.2%, because spam-folder messages count as delivered. That is why the report urges tracking placement and not only delivered rate.

Now compare a list that is entirely Microsoft-hosted: 77.4% inbox would mean about 7,740 in the inbox and 1,510 in spam out of 10,000. A list that is entirely Gmail at 89.8% would mean 8,980 in the inbox. The gap is 1,240 messages out of 10,000. These are averages from seed testing applied as arithmetic, not a forecast of any real campaign.

### Questions to ask your own data

1. What share of my list sits behind each provider?
2. What are my bounce and complaint rates?
3. Is my authentication passing?
4. Do I measure placement, or only delivered rate?

If you do not know the answers, start there before changing copy.` },
    { id: "misreads", heading: "Common ways this benchmark is misread", body: `Benchmarks are quoted without their definitions all the time. Watch for these.

- **"87.2% deliverability."** The figure is inbox placement in seed tests, not delivered rate.
- **"Microsoft is blocking us."** Microsoft placed 77.4% in the inbox and 15.1% in spam in this data. That is a pattern across senders, not proof about your own mail.
- **"B2B email lands in the inbox 83% of the time."** The 83.0% is for hosting platforms in seed tests. Filtering companies were at 79.0%.
- **"A 0.06% complaint rate is fine, so I can send more."** The report says under 0.1% is the expectation. It is an average, and large providers look at a sender's own rate.
- **"Opens prove delivery."** The report calls opens unreliable because of Apple Mail Privacy Protection and bot clicks.
- **"Warm-up solves it."** The report does not test warm-up.

### What the 2026 forecasts are

The report says Yahoo is expected to dip in the short term after absorbing AT&T and Comcast subscribers and then recover, and that Microsoft and Apple are expected to trend upward. These are forecasts. They are not measured results, and we do not use them as figures.

### How this fits the sending decision

Placement is shaped by reputation, authentication, content and list quality. You can influence all four. The list is the one you can check before sending. See [email list verification](/email-list-verification) for a way to check an existing list, and the [replacement policy](/legal/refund-replacement) for what BeigeLeads does if a delivered list bounces above its threshold.` },
  ],
  "b2b-email-by-country": [
    { id: "glossary", heading: "Terms and how to read the tables", body: `A few terms help with the regional tables.

- **Inbox:** share of test messages in the recipient's inbox.
- **Spam:** share in the spam folder.
- **Missing:** share deferred or blocked, found in neither.
- **MAGY:** Microsoft, Apple, Gmail and Yahoo, the providers the report treats as the global majors.
- **Regional provider:** a mailbox provider that is large in one region but not globally, such as BigPond in Australia or Tencent/QQ and Netease in China.
- **Year-over-year change:** change versus the prior Validity report. The report gives it in percent.

Each row adds to roughly 100%: inbox plus spam plus missing. Europe's 91.1%, 3.7% and 5.1% sum to 99.9%, the difference being rounding.

### A worked comparison (illustration only)

If you sent 10,000 messages to seed-like mailboxes in each region, the 2025 averages would give about:

| Region | In inbox | In spam | Missing |
|---|---|---|---|
| Europe | 9,110 | 370 | 510 |
| North America | 8,670 | 680 | 650 |
| Asia | 8,640 | 240 | 1,120 |

This is arithmetic on the report's percentages, and it shows something the percentages hide. North America and Asia have almost the same inbox count, but they fail differently: North America loses messages to the spam folder, while Asia loses them to deferral or blocking. The fix for each is different. For a spam-folder problem you look at content, reputation and complaints. For a missing problem you look at whether messages are being deferred or rejected by the receiving server.

### Country versus region

The more precise the geography, the less reliable the number. Region figures average many countries, and the report gives few country figures. Use region figures to get a sense of range and country figures only where the report states them.` },
    { id: "checklist", heading: "A checklist before a multi-country campaign", body: `This is general guidance, not a finding.

1. **List the countries and the providers within each.** Know whether recipients are on Gmail, Microsoft, a local provider or a corporate gateway.
2. **Check the local rules.** Whether you can email a person depends on the law where they are. See our [lawful use policy](/legal/lawful-use).
3. **Verify addresses.** Invalid addresses are a failure unrelated to region.
4. **Start small in each country.** Send a limited batch, check bounce, spam complaints and replies, then scale.
5. **Compare across countries only with the same offer and copy.** Otherwise differences in the message will look like differences in the country.
6. **Keep records.** Log placement and replies by country so you build your own benchmark.

### Why we do not rank countries

The report does not give enough per-country detail to rank them fairly, and the figures for the United States and Canada, as well as several other countries, cannot be read cleanly from its layout. A ranking would imply a precision that the data does not have. We show the regions the report states and the countries it names.

### Finding contacts by country

BeigeLeads lists are organized by country and industry; see [browse lists](/lists). Our [data sources](/data-sources) page explains where the data comes from. For deliverability by provider across all regions, see [email deliverability by provider](/benchmarks/b2b-email-deliverability).

### Where this benchmark helps most

It helps most as a sanity check. If you are planning a campaign to Asia and a campaign to Europe, the table reminds you that missing mail is a bigger risk in one and spam filtering a bigger risk in the other. It helps least as a promise of results.` },
  ],
  "b2b-outreach-by-industry": [
    { id: "glossary", heading: "Terms and how to read the sector table", body: `The sector table uses the same three measures as the rest of the Validity report, so the terms carry over.

- **Inbox:** share of test messages that reached the inbox.
- **Spam:** share that reached the spam folder.
- **Missing:** share deferred or blocked, found in neither.
- **Sector:** the sender's industry as Validity classifies it.
- **Seed test:** a test send to addresses Validity controls at mailbox providers.

Each row's three numbers sum to about 100%. Transportation, for example, is 97.2%, 1.1% and 1.8%, which sums to 100.1% because of rounding.

### A worked comparison (illustration only)

If 10,000 test messages were sent by senders in each of three sectors, the 2025 averages would give about:

| Sector | In inbox | In spam | Missing |
|---|---|---|---|
| Transportation | 9,720 | 110 | 180 |
| Finance | 8,880 | 650 | 460 |
| Real Estate | 8,010 | 1,590 | 410 |

Real Estate would lose nearly 2,000 of 10,000 messages from the inbox, and about 1,590 of those to spam. Transportation would lose 290. These are arithmetic on the report's averages, not forecasts.

### Reading three shapes

- **A mostly spam problem (Real Estate, Construction):** high spam, modest missing. Filters judged the content or sender poor.
- **A mostly missing problem (Law Firms & Legal Services, Healthcare Services):** high missing. Messages were deferred or blocked, which can point to corporate filtering or reputation issues.
- **A low-loss profile (Transportation, Energy, Utilities & Waste):** both low.

Which shape you are closest to determines where to look first.` },
    { id: "checklist", heading: "Questions to ask before you use sector data", body: `Industry tables invite quick conclusions. Slow down with these questions.

1. **Whose sector is it?** The sender's, not the recipient's.
2. **Is this outreach?** No. It is email in general.
3. **Is my sector even in the table?** The sector list is Validity's classification, and your business may not map cleanly.
4. **How big was the sample?** The report does not say.
5. **Is the difference large enough to matter?** Within a few points, it likely does not. Across 17 points, it does.

### A checklist for sectors at the low end

This is general guidance, not a finding. If you send into or from a sector with a lower inbox rate, extra care tends to pay off.

1. Verify the list and remove role accounts you do not need.
2. Keep volume steady and ramp up slowly.
3. Confirm SPF, DKIM and DMARC pass.
4. Watch complaint rate and keep it well below 0.1%, the report's expectation.
5. Avoid heavy images and link-heavy templates in the first sends.
6. Monitor placement, not only delivered rate.

### What not to conclude

Do not conclude that a sector is "bad to email" because its inbox rate is lower. The table is about senders in that sector. Do not conclude that you will match your sector's number. And do not conclude that any single change will move you into a higher row.

### Related reading

For provider differences, see [email deliverability by provider](/benchmarks/b2b-email-deliverability). For regional differences, see [placement by region](/benchmarks/b2b-email-by-country). To check addresses before you send, see [email list verification](/email-list-verification), or [browse lists by industry](/lists).` },
  ],
  "b2b-data-decay": [
    { id: "worked", heading: "A worked example (illustration only)", body: `Here is what a 23% annual decay would mean for a list, using simple arithmetic. It is an illustration and not a forecast for any specific list.

Suppose you hold 10,000 verified addresses today.

| Point in time | Addresses still valid at 23% a year |
|---|---|
| Today | 10,000 |
| After one year | 7,700 |

That is 2,300 addresses that would no longer work after twelve months. At the report's high of 28%, you would lose 2,800 and keep 7,200. At its low of 22%, you would lose 2,200 and keep 7,800. The five-year range therefore moves the loss by 600 addresses on a list of 10,000.

### What it does to a campaign

If you sent to all 10,000 after a year with no re-check, about 2,300 would bounce under these assumptions. That is a 23% bounce rate, more than eleven times the 2% ceiling in the Instantly report. Real lists do not decay evenly, and the figure above is a vendor average that includes lists customers distrusted. But the example shows why a one-year-old list should be checked before use.

### How the 90-day cycle relates

If decay were spread evenly across the year, a quarter of the annual figure would be about 5.75%. That is a simplification, because decay is not uniform, and the report gives no monthly rate. We offer it only to show why quarterly checks are common advice. BeigeLeads refreshes its databases every 90 days, which is our own stated cycle.` },
    { id: "glossary", heading: "Terms and review questions", body: `Terms in the report:

- **Decay:** the share of addresses in a list that become invalid or dormant over time.
- **Invalid:** an address the verifier judged unable to receive mail.
- **Risky:** a term the report uses without defining.
- **Catch-all:** a domain that accepts mail for any address, so individual mailboxes cannot be confirmed.
- **Do-not-mail:** the report's grouping of role-based, disposable and spam or bot-created addresses.
- **Bulk and real-time verification:** checking a whole file at once versus checking an address when it is entered.

### Questions to ask about your own list

1. When was it collected, and when was it last verified?
2. How many addresses bounced in the last send?
3. Do I add new contacts continuously, and are they checked at entry?
4. Which segments are oldest?
5. What would a bounce rate of 2% cost me in reputation?

### What drives decay in practice

The report does not break down causes. General reasoning suggests several: people change jobs, companies change domains or shut down, mailboxes are closed, and addresses are mistyped at entry. We list these as plausible, not as findings, because the report does not measure them.

### Keeping a list fresh

- Verify close to the send date.
- Check new contacts at sign-up or import.
- Remove addresses that bounce.
- Re-check older segments first.
- Keep the verification date with each record.

For the outcome split of verification, see the [email verification benchmark](/benchmarks/email-verification). To see how BeigeLeads handles this, read the [verification page](/verification) or [request a free sample](/sample).` },
  ],
  "email-verification": [
    { id: "worked", heading: "A worked example (illustration only)", body: `This example applies ZeroBounce's 2025 shares to a hypothetical list of 10,000 addresses. The shares come from lists customers submitted for verification, so a real list could differ a lot. Treat it as arithmetic.

| Outcome | Share | Addresses |
|---|---|---|
| Valid | 62% | 6,200 |
| Invalid | 23% | 2,300 |
| Catch-all | about 9% | about 900 |

The remainder, about 600 addresses or 6%, falls into other categories the report does not total in its text, such as unknown, disposable, spam-trap and abuse addresses. We do not assign it because the report does not give a full split.

### What you would do with it

You would send to the 6,200 valid addresses, remove the 2,300 invalid ones and decide about the 900 catch-all addresses. Sending to the whole list without checking would put about a quarter of the sends on invalid addresses, far above the 2% bounce ceiling that Instantly's report recommends. That is a big difference in sender reputation risk.

### Cost of not checking

A hard bounce is a signal to providers that the sender does not know its recipients. Validity's report puts the average invalid-address rate in seed tests at 1.46%, and it recommends verifying contacts regularly and removing stale addresses. The ZeroBounce shares are several times larger because they describe lists submitted for checking and not typical active sends. The two figures measure different things and should not be netted against each other.` },
    { id: "checklist", heading: "Glossary and a verification checklist", body: `Terms in the report:

- **Valid:** the verifier judged the address able to receive mail.
- **Invalid:** judged unable to receive mail.
- **Catch-all:** accepts any address at the domain.
- **Disposable:** a temporary address, designed to be thrown away.
- **Spam trap:** an address used to catch senders with poor list practices.
- **Known complainer:** an address with a history of spam complaints.
- **Role-based:** a shared address such as info@ or sales@.
- **Typo detection:** catching a misspelled domain at entry, for example in a sign-up form.

### A checklist for using verification results

This is general guidance, not from the report.

1. Verify as close as possible to the send date.
2. Remove invalid, disposable, spam-trap and complainer addresses.
3. Treat catch-all addresses as a separate batch.
4. Decide what to do with role-based addresses based on your goal and local rules.
5. Store the verification date.
6. Re-verify on a schedule. ZeroBounce suggests at least quarterly.
7. Keep verification at entry for new contacts, using typo and disposable detection.
8. Monitor bounce rate after you send. It tells you how current the result still is.

### How verification differs from list building

Verification checks addresses you already have. It does not find new ones and it does not tell you whether the person is the right contact. A verified address of the wrong person is still the wrong person. BeigeLeads lists are built and checked as a database; if you already own contacts, our team can [verify your list by hand](/email-list-verification). To see our data format, [request a free sample](/sample), and to see how a list is refreshed, read the [verification page](/verification).

### Related reading

See [email list decay](/benchmarks/b2b-data-decay) for how fast addresses go bad, and [email deliverability by provider](/benchmarks/b2b-email-deliverability) for what happens when you send.` },
  ],
  "b2b-sales-cycle": [
    { id: "worked", heading: "A worked example (illustration only)", body: `This example shows how the stage table might look for one deal size. The numbers are the study's ranges. Adding them is a simplification, because each is a percentile range for its own stage.

For an enterprise deal (over $100K), the stage ranges are 10 to 20, 15 to 30, 20 to 40 and 30 to 60 days. Adding the lower ends gives 75 days and adding the upper ends gives 150 days. The study's overall range for enterprise is 90 to 180 days or more, so the sum of stages is not the same as the whole-cycle range. That is expected, since ranges do not add exactly and the page does not explain how the whole-cycle figure was derived.

For an SMB deal (under $15K), the stage ranges are 3 to 5, 1 to 3, 3 to 7 and 2 to 5 days. The lower ends add to 9 and the upper ends to 20. The whole-cycle range is 14 to 30 days. Again the figures are close in spirit but not identical.

### What to take from it

Two things. First, the same pipeline can run in two weeks or in half a year depending on deal size. Second, the negotiation to close stage is where large deals spend the most time, which is outside the reach of any contact list.

### A planning example for outreach cadence

If you sell an SMB product with a 14 to 30 day cycle, a follow-up sequence of 4 to 7 touches spaced three to four days apart (the Instantly guidance) takes roughly 9 to 24 days to send. The sequence and the cycle overlap. For an enterprise product with a 90 to 180 day cycle, the sequence is a small part of the whole and the work continues long after. This is arithmetic on two sources with different definitions, so use it only as a planning sketch.` },
    { id: "glossary", heading: "Terms and review questions", body: `Terms in the study:

- **Sales cycle:** the time a deal takes. The page does not define the start and end.
- **ACV (annual contract value):** the yearly value of a contract, used here to size deals.
- **Percentile (25th to 75th):** the range containing the middle half of deals.
- **Median:** the middle value. Half of deals are faster, half slower.
- **Stakeholder:** a person involved in the buying decision.
- **Multi-threading:** engaging several contacts at one account.
- **Mutual action plan:** a shared plan of steps and dates between buyer and seller.
- **Won deals:** deals that closed with a sale. The stage data uses only these.

### Questions to ask about your own pipeline

1. How do I define the start and end of my cycle?
2. Do I measure won deals only, or all deals?
3. Which band matches my contract value?
4. Where do my deals wait longest?
5. How many contacts per account do I engage?
6. How old is my contact data by the time a deal reaches negotiation?

### A note on the outside figures

The page cites Gartner, Forrester and Vanta for several numbers. We did not check those original sources, so we repeat the claims only as the page presents them. If you plan to rely on a figure such as 6.8 stakeholders, read the original.

### Next steps

Pick the band that matches your deals, compare your own stage durations, and look for the stage where you wait longest. For outreach at the top of the funnel, see [cold email reply rates](/benchmarks/cold-email-response-rate) and [follow-up benchmarks](/benchmarks/cold-email-follow-ups). For fresh contact data, see how we [verify our lists](/verification) or [request a free sample](/sample).` },
  ],
};
