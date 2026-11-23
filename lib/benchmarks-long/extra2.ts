import type { Section } from "./types";

// Second set of additional sections: how to read the source critically, and what the source itself says it does not cover.
export const extra2: Record<string, Section[]> = {
  "cold-email-response-rate": [
    { id: "vendors", heading: "Why other reply-rate figures differ", body: `If you search for cold email reply rates you will find numbers that do not match 3.43%. That does not mean one of them is wrong. Reply-rate figures depend on who is counted, what counts as a reply, and how the rate is divided.

Common sources of difference are the population (one platform's customers versus a survey of marketers), the denominator (emails sent, emails delivered or leads contacted), the treatment of automatic replies, and the type of email (cold, warm, or a mix). The Instantly report states its denominator and its population, which makes it possible to compare like with like. Many published averages do not.

We therefore do not average this report with others. Mixing vendor figures produces a number nobody measured. If you want a second reference, find a source that states the same definition, and compare the two side by side with their limits.` },
  ],
  "cold-email-follow-ups": [
    { id: "evidence", heading: "How strong is the evidence?", body: `It helps to separate what the report measures from what it recommends. This is a useful habit with any vendor benchmark.

**Measured and stated with a figure:** the 58% and 42% split of replies by step, the 4 to 7 touchpoint recommendation as a range, the roughly 30% advantage for reply-style follow-ups, and the 3 to 4 day spacing. Even among these, the report does not give sample sizes or methods for the 30% advantage or the spacing, so they are claims, not published experiments.

**Described without figures:** subject lines, personalization, A/B test results and the long tail beyond step 10.

**Not covered at all:** the reply rate per step, complaints and unsubscribes by sequence length, and differences by industry or list type.

### What this means in practice

The split is the most solid number, because it is a count of where replies arrived on the platform. The recommendations are sensible and widely repeated, but a reader who wants to defend a choice, for example a six-step sequence, should rely on their own results. Run the sequence on part of a list, count replies by step, and compare complaint and unsubscribe rates. If a sixth step adds replies without raising complaints, keep it. If not, cut it. The report gives you a starting range, not an answer.

### A note on sequence design for different lists

A list of senior decision makers at small companies and a list of department managers at large companies may respond differently to the same sequence. The report does not break results down this way, so you cannot assume the 58/42 split applies to every segment. Measure by segment where your volume allows it.` },
  ],
  "b2b-email-deliverability": [
    { id: "evidence", heading: "How to weigh seed-test data", body: `Seed testing is a standard industry method, and it is also easy to over-read. Two points keep it in proportion.

First, a seed address is not a real recipient. It has no history of opening, replying or complaining, and providers treat real engagement as a strong signal. Seed placement can therefore differ from real-world placement for a sender with excellent or poor engagement.

Second, the dataset is voluntary. Only Validity customers who approved aggregation are included, and these tend to be senders who care enough about deliverability to monitor it. The average may therefore look better than the average across all senders, though the report does not say so.

None of this makes the data useless. It is a consistent measurement taken the same way across many senders and providers, which is what makes year-over-year and provider-to-provider comparisons meaningful. Use it for relative comparisons, such as Microsoft versus Gmail, more than for absolute promises.` },
  ],
  "email-verification": [
    { id: "evidence", heading: "What the report does not tell you", body: `Several limits are visible on the source page, and it helps to state them plainly.

- **No denominators for some figures.** The spam-trap numbers (0.01% and more than 1 million) come without a stated base.
- **Mixed wording.** The page uses "invalid" and "invalid and risky" interchangeably and does not define "risky".
- **Charts that are not in the text.** Breakdowns by bulk versus real-time verification appear in charts, so the values cannot be quoted from text.
- **No segment splits.** There is no breakdown by industry, country, company size, free versus business email or role-based accounts.
- **Self-selected customers.** The lists are those customers chose to verify, and the page does not claim they represent all email.

### Why these gaps matter

If you read "23% invalid" as a fact about all business email, you would overstate what the data shows. If you read it as a fact about lists submitted for verification in 2025 by one vendor's customers, you would be reading it correctly. The difference is small in words and large in meaning.

### How to get your own numbers

The most reliable benchmark for your list is your own verification result. Run a check, read the split between valid, invalid, catch-all and other outcomes, and compare it with the vendor's shares. A big difference tells you something about your list: either it is cleaner than the vendor's average or noticeably worse.

When you do that, record the date and the list source. Over time, you will have a benchmark that matches your data and your definition. Our team can check a list by hand if you want a second opinion; see [email list verification](/email-list-verification). If you are comparing providers of data, ask each one how and when its addresses were last verified, and ask for a masked sample. Every BeigeLeads list page has one.

### Why catch-all handling deserves a decision

More than 9% of what ZeroBounce checked was catch-all. On a list of 10,000 that is around 900 addresses you cannot confirm. Decide before you send whether to include them, test them in a small batch, or exclude them. There is no universal right answer. It depends on how much bounce risk you can accept and how valuable each contact is.` },
  ],
  "b2b-data-decay": [
    { id: "evidence", heading: "How to read a decay figure critically", body: `A statistic like "23% a year" sounds precise. Here is how to weigh it.

### What supports it

The report is based on more than 11 billion addresses verified in 2025, which is a very large volume. It gives five years of figures, and they stay within a narrow band of 22% to 28%. That stability suggests that the order of magnitude, about a quarter, is not a one-off.

### What weakens it

The report measures the invalid share among addresses submitted for verification, not the loss in one list tracked over time. Customers who submit lists for verification are not a random sample. The page uses "at least 23%" without explaining the lower bound. It mixes "invalid" with "invalid and risky". It gives no breakdown by type of list or by country, and the chart captions contain a year inconsistency.

### The sensible conclusion

Both are true. The figure is large enough to take seriously, and uncertain enough that you should not plan around the exact percentage. Better to say "a meaningful share of a list, plausibly a fifth to a quarter in a year, can stop working" than to say "your list will lose exactly 23%".

### What this implies for list buying

When you buy or build a list, ask when its addresses were last verified. A list verified last week is a different asset from one verified two years ago, even if both were clean on the day they were made. BeigeLeads refreshes its databases every 90 days, and the date appears on list pages. Our [data sources page](/data-sources) explains where the data comes from, and you can [request a free sample](/sample) to check the fields first.

### Decay is not only an email problem

The report measures email addresses only. A contact record also contains a name, a job title, a company and often a phone number. Any of these can go out of date for reasons unrelated to the mailbox. Because the report does not measure them, we do not cite figures for them. The practical point is the same: freshness is a property of a list, and the date of last verification is worth as much attention as the record count.` },
  ],
  "b2b-email-by-country": [
    { id: "evidence", heading: "What the regional figures can and cannot support", body: `Regional tables make it tempting to draw country-level conclusions. The report supports some and not others.

### Reasonable conclusions

- Europe has the highest regional inbox placement in 2025, at 91.1%, and the regional differences span a moderate 4.7 points.
- The mix of failure differs by region. North America's losses lean toward the spam folder, while Asia's lean toward missing mail.
- Within a region, countries can differ a lot. The China and India figures in Asia are the clearest example.
- Regional mailbox providers place far lower than the global majors, by roughly 10 to 25 points.

### Conclusions the data does not support

- That mailbox providers in one region are better or worse run than in another. The report does not test this.
- That a campaign to a given country will perform at that country's placement rate. Placement is one step before reading and replying.
- That year-over-year gains continue. A 10.6% rise for South America is a result for one year.
- That B2B recipients behave like the general seed population. Business mailboxes sit behind hosting platforms and filters that the regional table does not isolate; Validity's B2B group figures are global.

### Working with limited data

If you plan outreach to a particular country and the report does not give a figure for it, the honest answer is that this benchmark does not cover it. In that case, run a small pilot and measure bounce, spam placement if you can see it, and replies.

### Why we kept the language careful

Regional deliverability data is often repeated in marketing as if it said more than it does. A table of seed-test percentages is a useful reference, not a map of how B2B outreach performs by country. We have kept to what the report states, and we note where its layout made a figure approximate.` },
  ],
  "b2b-outreach-by-industry": [
    { id: "evidence", heading: "What a sector ranking can and cannot support", body: `A ranking of sectors by inbox placement looks like a ranking of which audiences are easy to reach. It is not, and the difference is worth spelling out.

### What the table supports

- Sender behavior and content vary by sector, and so do filtering outcomes. A spread of more than 17 points among the rows we could read is large.
- Some sectors lose most of their loss to spam (Real Estate, Construction, Consumer Services, Healthcare Services) and others to missing mail (Law Firms & Legal Services).
- Movement in a year can be large: gains of 8.4% and declines of 6.9% appear in the report.

### What it does not support

- It does not show that the recipients in a sector are harder to reach. The grouping is by the sender's sector.
- It does not show outreach performance. The data is for email in general.
- It does not show that a sector's position is stable. The report lists large year-over-year changes without explaining them.
- It does not show why a sector sits where it does.

### Practical consequences

If you sell into a sector with a lower inbox rate, the table does not say your emails will land worse. It suggests that you cannot assume a high placement rate and should measure it. If you are a sender inside one of those sectors, it suggests that peers in your sector have faced above-average filtering, which is a reason to review authentication, content and list quality.

### Why sector assignment matters

Validity classifies senders into sectors. A company that sells software to healthcare providers might be classed as Software or Healthcare Services, and the report does not explain how such cases are assigned. Comparing yourself with a row is therefore approximate. Treat the table as a way of seeing the range of outcomes across sectors rather than as an exact reference for your company.

### Using this alongside your own data

Check your own placement and bounce rates by recipient sector if you can. If you cannot see placement, use bounce and reply rates as proxies. Over a few campaigns, you will build a benchmark of your own, which is worth more than any published sector average. See [email list verification](/email-list-verification) for keeping bounce rates down, and [browse lists](/lists) for contacts organized by industry.` },
  ],
  "b2b-sales-cycle": [
    { id: "evidence", heading: "How to weigh a vendor pipeline study", body: `The Optifai study has a large sample and useful structure, and it comes with caveats that are visible on the page.

### Strengths

The sample, 939 B2B SaaS companies with stage-level CRM data, is substantial. The study gives percentile ranges instead of single averages, which is more honest about variation. It breaks the cycle into stages and names a bottleneck for each, which is more useful than a single number.

### Weaknesses

The page gives no sampling method or confidence intervals and does not describe how companies were chosen. It does not define where a cycle starts or ends. Its mid-market bands differ between the headline and the table. It excludes lost deals from stage data. It cites outside figures that we have not verified. And the publisher sells related software.

### How to use it well

Use it for shape, not precision. The shape is clear: cycles lengthen with deal size, the later stages stretch most, and enterprise deals can take half a year or more. The exact days matter less than the pattern. If your own pipeline shows a very different shape, that is worth investigating, because it may reveal a bottleneck or a difference in your market.

### Comparing your numbers

Compute your cycle for won deals only, using the same percentile ranges, and place it against the band for your contract value. If your enterprise deals close in 60 days, you are faster than the middle half in this study. If they take 240, you are slower. Either result is information, but neither proves anything about why.

### What this study does not say about outbound

Nothing in the study measures how a deal began. Outbound, inbound and referral deals are mixed together, and the page does not break out channels. So it cannot tell you whether outbound-sourced deals take longer. Do not read the benchmark as a statement about outbound email.` },
  ],
};
