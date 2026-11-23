import type { Long } from "./types";

// Source: ZeroBounce, "Email List Decay Report" (2026 edition, 2025 data), re-read on 22 Nov 2026.
export const decay: Record<string, Long> = {
  "b2b-data-decay": {
    sections: [
      { id: "def", heading: "What list decay means and how ZeroBounce measures it", body: `ZeroBounce, an email verification vendor, publishes a yearly list decay report. Its definitions are short:

- **Email decay:** "the degradation of email data in email lists."
- **List decay:** "the percentage of email addresses in an email list that become invalid or dormant over time."
- **Headline figure:** "On average, at least 23% of an email list decays within just one year."

The 2025 edition covers January to December 2025. ZeroBounce says it looked at "all the email data we verified" in that period and that it processed more than 11 billion email addresses, in bulk and in real time. It describes its customers as ranging "from solo business owners to behemoths like Amazon, Disney and Netflix". It also compares against earlier years.

### A measure from verification results

This is worth understanding. ZeroBounce does not follow the same list over twelve months and count what disappeared. It counts how many of the addresses its customers submitted for checking turned out to be invalid. The page says "out of the data we analyzed, 23% were invalid emails." That is a snapshot of verification outcomes in a year, which the vendor uses as a proxy for how much of a list decays.

That proxy has consequences. Customers who submit a list for verification often do so because the list is old or has performed badly. The set is therefore not a random sample of all email lists, and the page does not claim it is.

### The wording is not perfectly consistent

In one place the report says "at least 23% of all emails it checked were invalid and risky", while elsewhere it says "invalid". It does not define "risky". We keep the figure as 23% and flag the wording difference instead of resolving it. The page also uses "at least" without explaining the basis for the lower bound.` },
      { id: "years", heading: "Five years of annual decay", body: `The report gives yearly figures for the past five years:

| Year | Reported decay |
|---|---|
| 2021 | 23% |
| 2022 | 22% |
| 2023 | 25% |
| 2024 | 28% |
| 2025 | 23% |

The report states that decay "has ranged from 22% to 28% over the past five years". The 2025 figure fell five points from 2024, the highest year. But the whole series moves within a six-point band.

### What the series shows and does not show

It shows that roughly a fifth to more than a quarter of the addresses checked were invalid in each of five consecutive years. It does not show a clear trend. Up in 2023 and 2024, then down in 2025, the numbers could reflect a change in how customers use verification, a change in the mix of lists submitted, or real change in how fast addresses stop working. The report does not say which.

One year's swing is not a trend. A single drop to 23% is not proof that lists now decay more slowly. The more cautious reading is that, in this vendor's data, about a quarter of addresses checked were invalid in a typical recent year.

### A caution about the chart labels

The report has chart captions that refer to 2024 while the data labels say January to December 2025. This looks like an editing inconsistency. We use the figures in the text and the five-year table above and note the inconsistency here for transparency.` },
      { id: "freq", heading: "How often does ZeroBounce suggest cleaning a list?", body: `The report gives its own recommendations on frequency:

- "Clean your email list at least once a quarter."
- "If your database grows quickly, run it through our email verifier every month."
- Remove subscribers who have not clicked in the past three months.

These are recommendations from a company that sells verification, and the report does not provide a method for them. Still, they are consistent with the measured decay. If about a quarter of addresses become invalid in a year, a check every three months catches a share of that before it causes bounces. A check once a year leaves a longer period in which dead addresses sit in the list.

### What decay means for your sending

An invalid address bounces. The Validity deliverability report, a separate source, puts the average unknown-user (invalid address) rate at 1.46% in 2025 seed tests, and Instantly's cold email report advises keeping bounce rates below 2%. A list that has decayed by 23% since it was collected is much worse than either figure. Even half of that, in a campaign, would quickly exceed a 2% bounce ceiling. These figures come from three different sources with different definitions, so use them only as context. See [email deliverability by provider](/benchmarks/b2b-email-deliverability) and [cold email reply rates](/benchmarks/cold-email-response-rate).

### The BeigeLeads view

BeigeLeads refreshes its databases every 90 days. That is our own stated cycle, not a measurement from this report. Our [verification page](/verification) explains how we check addresses, and the [replacement policy](/legal/refund-replacement) covers bounces on delivered lists. You can see a [free masked sample](/sample) of any list before you buy.` },
      { id: "scope", heading: "What this benchmark does not measure", body: `The report is about email addresses. It does not measure the decay of phone numbers, job titles, company names or addresses. It gives no breakdown by:

- industry,
- country,
- company size,
- free versus business email,
- role-based accounts,
- or any monthly decay rate.

The page says only that the findings "reflect statistics across various business sizes and industries". It also does not give a B2B-only figure. Business addresses can behave differently from consumer addresses. For example, people change jobs and company domains change, which can invalidate a business address even when the person is still reachable elsewhere. But the report does not measure that, so we cannot cite a number.

The 62% validity figure that appears elsewhere in the report is the share of emails submitted to ZeroBounce in 2025 that were valid. That is not the share of any specific list. For the full outcome split, see the [email verification benchmark](/benchmarks/email-verification).

### How to use the 23% figure

Use it as a reminder, not a forecast for your list. Your decay depends on how and when your list was built, how old it is, and who is on it. A list built last month will not have decayed by a quarter. A list built three years ago may have decayed more. The responsible approach is to check your own list, since a verification run gives you your real invalid share instead of a vendor average.

If you are planning a long outreach sequence, which the [follow-up benchmarks](/benchmarks/cold-email-follow-ups) and the [sales cycle benchmarks](/benchmarks/b2b-sales-cycle) suggest can take weeks, check the list close to the send date, not when it was bought.` },
    ],
    faq: [
      { q: "How fast do email lists decay?", a: "ZeroBounce reports that at least 23% of an email list decays within one year, based on its 2025 verification data. Its five-year range is 22% to 28%." },
      { q: "Is the 23% figure the same for B2B lists?", a: "The report gives no B2B-only figure and no breakdown by industry, country or company size." },
      { q: "Does the figure track the same list over a year?", a: "No. It reflects how many addresses submitted for verification were invalid, which the vendor uses as a measure of decay." },
      { q: "How often should I clean my list?", a: "ZeroBounce recommends at least once a quarter, and monthly if the database grows quickly. That is the vendor's guidance." },
      { q: "Does decay include phone numbers or job titles?", a: "No. The report measures email addresses only." },
      { q: "How often does BeigeLeads refresh its databases?", a: "Every 90 days. See the verification page for how we check addresses." },
    ],
  },
  "email-verification": {
    sections: [
      { id: "outcomes", heading: "What the verification outcomes mean", body: `In its 2025 data, ZeroBounce reports that "only 62% of all emails submitted to ZeroBounce in 2025 were valid". It also reports more than 2.6 billion invalid emails and that more than 9% of the emails it checked were catch-all, over 1 billion addresses. The data covers January to December 2025 and more than 11 billion addresses.

This article explains what each outcome means and what a sender can do about it. BeigeLeads did not run these checks. The figures are ZeroBounce's, from addresses its customers chose to submit.

### Valid

A valid address is one the verifier judged able to receive mail. It is not a guarantee that the person will read it or reply. At 62%, valid addresses are the majority of those submitted but far from all.

### Invalid

Invalid addresses are those the verifier judged unable to receive mail, such as a mailbox that does not exist or a domain that no longer works. The report counts 23%. Sending to them produces hard bounces, which hurt sender reputation. The report's invalid share is also the figure used in its decay analysis; see the [list decay benchmark](/benchmarks/b2b-data-decay).

### Catch-all

A catch-all domain is configured to accept mail for any address. A verifier that asks the server whether an address exists gets "yes" for every address, even invented ones, so it cannot confirm an individual mailbox. That is why catch-all addresses form their own group. They are neither confirmed valid nor confirmed invalid. In the 2025 data they were more than 9% of what ZeroBounce checked.

### Other categories in the report

- **Spam traps:** the report says it "spotted only 0.01% spam traps" and more than 1 million overall. It gives no denominator for these figures.
- **Disposable addresses:** more than 5 million identified, with another 5 million or more bounces prevented by detecting them.
- **Typos:** more than 10 million bounces prevented through typo detection.
- **Known complainers:** more than 155 million addresses flagged as having a history of complaints, across bulk and real-time services.
- **Do-not-mail:** a grouping of role-based, disposable and spam or bot-created addresses, with no count given.

The report does not define "risky" and does not give a percentage for most of these groups, so we reproduce only what it states.` },
      { id: "why-share", heading: "Why the shares are not a verdict on all lists", body: `The 62% valid figure is the share of emails submitted to ZeroBounce in 2025, not the share of any specific list and not the share of all email addresses in the world. ZeroBounce customers choose to verify. Some submit lists that are already clean, which would push the valid share up. Others submit old, scraped or purchased lists they distrust, which would push it down. The report does not describe the mix.

That means the split cannot tell you whether your list is better or worse than average. It tells you that, in a large vendor dataset, a meaningful share of submitted addresses were not safe to send to.

### Two ways the figures can be misread

1. **Treating 23% invalid as a bounce rate.** The invalid share counts addresses the verifier rejected. A bounce rate counts what happens when you send. If you remove invalid addresses first, you do not experience those bounces.
2. **Treating catch-all as bad.** Catch-all addresses are not necessarily invalid. Many companies use catch-all configurations. They are uncertain, and the right handling depends on your risk tolerance, because sending to them can result in bounces after acceptance.

### A note on benchmarks for complaints and opens

The report states that "the accepted benchmark is 0.1%, which is one complaint for every 1,000 emails" for spam complaints, and that the benchmark for email open rates across all industries is between 21% and 22%. The first matches the guidance in Validity's deliverability report, which says under 0.1% is now the expectation. The open-rate figure should be handled with care, since Validity notes that opens are unreliable because of Apple Mail Privacy Protection and bot clicks. See [email deliverability by provider](/benchmarks/b2b-email-deliverability).` },
      { id: "how", heading: "How email verification works in general", body: `The report says verification services run "several checks" to decide whether an address is valid, but does not name them. The following is a general description of how verification is commonly done, not a description of ZeroBounce's or anyone's specific method.

1. **Syntax check.** Does the address follow the rules for an email address?
2. **Domain check.** Does the domain exist and have mail servers?
3. **Mailbox check.** Does the mail server accept mail for this mailbox? This is where catch-all domains limit what can be confirmed.
4. **Risk checks.** Is the address disposable, role-based or associated with known problems?

Each stage removes a class of problems. None can guarantee that a person will receive and read a message. Verification reduces avoidable bounces; it does not predict replies.

### How often to verify

ZeroBounce recommends cleaning at least once a quarter, monthly for fast-growing databases. The reason is decay: about a quarter of addresses can stop working in a year. Verifying close to the time you send gives the most accurate result.

### What BeigeLeads does

BeigeLeads checks the emails in its databases and refreshes them every 90 days. Our [verification page](/verification) describes the process, and our [replacement policy](/legal/refund-replacement) says what happens if bounces exceed the stated threshold on a delivered list. If you have your own list, our team can [verify it by hand](/email-list-verification). To see how a list looks before buying, [request a free sample](/sample).` },
      { id: "decide", heading: "Deciding what to do with each group", body: `This is general guidance for handling verification results. It is not from the source report.

- **Valid:** safe to send, within normal sending limits and with the usual opt-out handling.
- **Invalid:** remove. Do not retry.
- **Catch-all:** decide by risk. A common cautious approach is to send these in a small, separate batch and watch the bounce rate before sending more.
- **Disposable, spam-trap and known-complainer addresses:** remove. They carry more reputational risk than potential reward.
- **Role-based (info@, sales@):** these may be valid, but they are shared mailboxes. Whether to include them depends on your goal and on local rules.

### Keep the results with the list

Record the date of verification next to each list. Verification is a snapshot. A list verified six months ago has had time to decay, as the [decay benchmark](/benchmarks/b2b-data-decay) shows.

### Combine verification with good sending practice

A verified list does not protect a poor sending setup. Authentication, volume and content still matter, as the [deliverability benchmark](/benchmarks/b2b-email-deliverability) shows. And verified addresses still require a lawful basis and a working opt-out. See our [lawful use policy](/legal/lawful-use).

### What the report does not tell you

It does not split outcomes by industry, country or business versus personal email, and it gives no bulk versus real-time comparison in its text. It does not say how many of the invalid addresses were typos or domain failures. It also does not report accuracy of its own checks, such as false positives. So treat the numbers as outcome categories, not as a measure of how reliable the checking is.` },
    ],
    faq: [
      { q: "What share of emails were valid in 2025?", a: "ZeroBounce reports that 62% of the emails submitted to it in 2025 were valid, 23% invalid and more than 9% catch-all." },
      { q: "What is a catch-all address?", a: "An address at a domain that accepts mail for any mailbox name, so a verifier cannot confirm that the specific mailbox exists." },
      { q: "Does 'valid' mean the person will read my email?", a: "No. It means the address was judged able to receive mail." },
      { q: "Is 62% valid typical for every list?", a: "No. It reflects lists customers chose to submit for verification. A list already cleaned would show a different split." },
      { q: "How often should I verify a list?", a: "ZeroBounce recommends at least once a quarter. That is the vendor's guidance." },
      { q: "Can BeigeLeads verify a list I already own?", a: "Yes. Our team checks lists by hand. See the email list verification page." },
    ],
  },
};
