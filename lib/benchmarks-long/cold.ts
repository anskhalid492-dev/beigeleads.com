import type { Long } from "./types";

// Source: Instantly, "Cold Email Benchmark Report" (updated 12 Jan 2026), re-read on 22 Nov 2026. Figures are the source's; guidance not from the source says so.
export const cold: Record<string, Long> = {
  "cold-email-response-rate": {
    sections: [
      { id: "who", heading: "Where these reply-rate numbers come from", body: `The figures on this page come from one vendor's platform. Instantly, a cold email sending platform, published a benchmark report in January 2026 that describes data from **1 January to 18 December 2025**. The report says the data covers "billions of cold email interactions" across "thousands of active workspaces". It does not give an exact number of emails or workspaces, and it says the data was aggregated and anonymized.

That matters for how you read the result. This is not a survey of what people say they achieve, and it is not a random sample of every company that sends outbound email. It is a record of what happened on one platform, among customers who chose to use it to send cold email. Senders who use a different tool, or who send from a personal inbox without any tool, are not part of it.

BeigeLeads did not collect or run this data. We read the source on 22 November 2026, wrote the figures down as the source states them, and kept the limits next to them. Where the source is silent, we say it is silent instead of filling the gap.

### The three tiers in the report

The report groups senders into tiers by reply rate:

- **Average:** a 3.43% reply rate.
- **Top 25%:** a 5.5% or higher reply rate. The text describes this as what the top quartile achieves.
- **Top 10% (elite):** the table gives 10.7% or higher, while the text describes elite senders as "users exceeding 10% reply rates or higher, representing the top 10% of all senders".

Those last two descriptions differ slightly: one says 10.7%+ and the other says "exceeding 10%". We show both rather than choosing one. Either way, the top tenth of senders replies at roughly three times the average rate, which is why the spread is more informative than the single average.` },
      { id: "definition", heading: "How the report defines a reply", body: `A benchmark is only useful if you know what was counted. Instantly defines two measures.

- **Overall reply rate:** the "percentage of all replies received (including follow-up responses) divided by total emails sent". This is a per-email measure. Every email in a sequence, first message or follow-up, sits in the denominator, and every reply sits in the numerator.
- **First-touch reply rate:** the "percentage of leads who reply to the very first email in a sequence". This is a per-lead measure and is a different calculation.

The 3.43% average is described as the overall average reply rate. That means it divides all replies by all emails sent, follow-ups included. If you calculate your own first-touch rate per lead and compare it with 3.43%, you are comparing two different things.

The report does not formally define a "positive" reply. It also does not say whether automatic out-of-office messages are counted as replies. It notes that Friday has the highest auto-reply volume on the platform but does not say whether those messages count toward reply rates. If your own tool counts auto-replies and the source's does not, or the other way round, your numbers will not line up with these tiers.

### Why a "reply" is not a "lead"

A reply can be a request for a meeting, a polite no, an unsubscribe request, or an automatic message. The report does not separate these. A reply rate therefore tells you how many people responded in some way. It does not tell you how many became conversations worth having. Treat it as a measure of attention, then look at your own count of positive replies separately.` },
      { id: "spread", heading: "Why the spread matters more than the average", body: `The report says elite senders reach "2-4x higher" reply rates than the average. It does not say what the baseline is for that multiplier, so we treat it as a general statement rather than a precise figure. The tier table is more concrete: 3.43% at the average, 5.5% at the top quartile, 10.7% at the top tenth.

Two things follow from that shape.

First, the average is pulled by a long tail of weaker campaigns. Half of senders sit below the middle of the distribution, and the report's own numbers show that moving from the average to the top quartile means roughly a one-and-a-half times higher reply rate. Moving from the top quartile to the top tenth roughly doubles it again.

Second, you should place yourself on the range rather than treat 3.43% as a pass mark. A campaign at 2% is below the platform average but not outside the range of normal. A campaign at 6% is in the top quartile of this platform's senders. A campaign at 12% would be in the elite group. These comparisons are only valid if your definition of a reply matches the one above.

### What the report links to better results

The report describes elite performers as using message personalization, micro-segmentation, short first emails and steady domain health. Specifically it says elite senders average fewer than 80 words in a first email and recommends a single, low-effort ask, such as a simple question.

The report does not measure how much each of these habits contributes. It describes what high-performing senders tend to do. That is an association, not proof that copying one habit will move your rate. A sender with a very well matched list will often write shorter, more specific emails because the offer fits, so the writing style and the list quality can be tangled together.` },
      { id: "list", heading: "What the report does and does not say about lists", body: `Reply rate is the end of a chain: the email must be delivered, opened or at least seen, read, and judged relevant by the right person. The report discusses the sending side in detail, including authentication and bounce rates. It does not publish a reply rate split by list source, list size, industry, job title, or data freshness.

That gap is worth stating plainly, because it is easy to read a reply-rate chart as if list quality were included. It is not measured. The report lists the following as not broken out: reply rates by subject line, personalization, industry, list size, send volume or send hour.

What the report does say, in qualitative terms, is that bounce rates should stay below 2% ("ideally much lower") and that a campaign should be paused and the list cleaned if bounces run high. The page also reports that teams with stable domain health and steady sending see 15 to 20 percent higher replies "in our dataset", though it does not state the baseline for that comparison.

Put simply: the report gives you a clear picture of how replies are distributed across senders and a sensible ceiling for bounces. It does not tell you how much of your reply rate depends on who you are writing to. For that you need to measure your own campaigns by segment.

### A practical way to test your list

If you want to know how much your list is limiting results, run a small, controlled comparison. This is general guidance, not a finding from the report.

1. Take one offer and one email.
2. Send it to two segments of similar size that differ in only one way, such as job function or company size.
3. Compare bounce rate first, then reply rate, using the same reply definition for both.

If bounces differ sharply, the problem is address quality. If bounces are similar but replies differ, the segment fit is the more likely cause. A [free masked sample](/sample) lets you check how the fields in a list look before you commit to a purchase.` },
      { id: "timing", heading: "Timing, volume and other details the report gives", body: `The report includes a few other measurements that help place the reply rate in context.

- **Days of the week.** Tuesday and Wednesday show peak reply rates, with Wednesday highest. Monday has the highest send volume across the platform, and Friday has the highest auto-reply volume.
- **Hours and time zones.** The report provides no hourly or time-zone data, so it cannot tell you what time of day to send.
- **Warm-up.** It suggests starting with 5 to 10 emails per day and increasing over 4 to 6 weeks. It gives no source for those figures, so treat them as the vendor's practice rather than a measured result.
- **Inbox placement.** The report says placement is measured by sending to test accounts at providers such as Gmail and Outlook, but it reports no placement percentages.
- **Authentication.** SPF, DKIM and DMARC are recommended. No adoption or impact numbers are given.
- **AI.** A line states that AI agents handle about 80% of research and sequencing work for elite teams. The report gives no method for that figure, so we do not rely on it.

The peak-day finding is a reminder that reply rate moves by small amounts with timing, while the tier gap (3.43% to 10.7%) is large. If your result is far from the average, send day is rarely the main reason.` },
      { id: "limits", heading: "How to read this benchmark responsibly", body: `Four habits keep a benchmark from misleading you.

1. **Match the definition.** Count replies the way the source does, as all replies divided by all emails sent, including follow-ups. If your tool reports per-lead first-touch replies, convert before you compare.
2. **Match the population.** These are Instantly customers sending cold email. If you send warm email to existing contacts, your rate will not be comparable.
3. **Do not average across vendors.** Other vendors publish different reply averages. Their definitions and populations differ, so mixing them produces a number that no one measured.
4. **Look for movement, not a single score.** Track your own rate over several campaigns. A change that persists across three or four sends tells you more than one result against an external average.

The report also lists things it does not state: statistical methods, confidence intervals, how outliers were handled, and whether the tier thresholds apply per campaign or per sender. Because those are missing, the tier boundaries are best read as approximate.

### Where this fits with the other benchmarks

Reply rate is one part of the outreach picture. For the share of replies that arrive after the first email, see [cold email follow-up benchmarks](/benchmarks/cold-email-follow-ups). For where messages land before anyone can reply, see [email inbox placement by provider](/benchmarks/b2b-email-deliverability). For how fast a list loses working addresses, see [email list decay](/benchmarks/b2b-data-decay).` },
    ],
    faq: [
      { q: "What is a good cold email reply rate?", a: "In Instantly's 2025 data the average is 3.43%, the top quartile starts at 5.5%, and the top tenth of senders reach 10.7% or more (the text says 'exceeding 10%'). Whether a given rate is good depends on your list, offer and definition of a reply." },
      { q: "Does the 3.43% average include follow-up replies?", a: "Yes. The report defines the overall reply rate as all replies, including follow-up responses, divided by total emails sent." },
      { q: "Is this a measure of B2B email only?", a: "The report describes cold email senders on one platform. It does not publish a B2B-only figure or any breakdown by industry or company size." },
      { q: "Do these numbers count out-of-office replies?", a: "The report does not say. It notes that Friday has the highest auto-reply volume but does not state whether those messages count as replies." },
      { q: "Can I use these tiers as a target?", a: "Use them as a range to place yourself in, not a promise. The report does not show how much personalization, list quality or message length each contribute, so copying one habit does not guarantee a result." },
      { q: "How reliable is the data?", a: "It comes from the vendor's own platform, aggregated and anonymized, with no independent check described and no confidence intervals given. We reproduce it as stated and list the limits above." },
    ],
  },
  "cold-email-follow-ups": {
    sections: [
      { id: "split", heading: "What the 58% and 42% split says", body: `Instantly's 2026 report states that "58% of all replies are generated from step one in a cold email campaign" and that the "remaining follow-ups contribute 42% of total replies". The data covers 1 January to 18 December 2025 across thousands of active workspaces on one platform, aggregated and anonymized.

Read the two numbers together. More than half of replies come from the opening message, so the first email carries the most weight. At the same time, a little over four in ten replies arrive only because someone sent a second, third or later message. A sender who stops after one email gives up that second group entirely.

The FAQ in the report narrows the follow-up share slightly: it says steps 2 to 4 contribute the 42%. The long tail beyond that exists but is small. The report says replies continue past step 10 "at much lower rates" and gives no figure for it.

### Why the split is not a per-email rate

It is easy to misread the split as "follow-ups are less effective." It is a share of replies, not a reply rate per message. A campaign with one first email and three follow-ups has four messages, but the first reaches every lead while later messages only reach those who have not yet replied. The fact that step one produces 58% of replies does not tell you how a single follow-up performs compared with a single first email.

What it does tell you is where replies accumulate. If you only measure the first email, you will undercount the total reply volume your sequence produces.` },
      { id: "length", heading: "How long a sequence should be, according to the report", body: `The report gives practical guidance on sequence length and timing. These are the vendor's recommendations, and the report does not publish the data behind each one.

- **Length:** "The sweet spot for sequence length is 4-7 touchpoints." Shorter sequences are described as stopping too early, and longer ones as showing diminishing returns unless each touch adds value.
- **Spacing:** touches roughly 3 to 4 days apart.
- **Minimum:** the FAQ recommends at least 4 emails.
- **Second message wording:** reply-style follow-ups, which read like a short human reply, "outperform formal follow-ups by ~30%". The report gives no sample size or method for that comparison.

The 4 to 7 range is consistent with the 58/42 split: if steps 2 to 4 contribute most of the follow-up replies, then stopping at one or two touches leaves a large share unclaimed, and going far beyond seven adds little. But the report does not show a reply rate per step, so you cannot read an exact drop-off curve from it.

### What the report does not show

It does not provide:

- a reply rate for each individual step,
- a comparison of sequences of different lengths on the same lists,
- the effect of follow-ups on spam complaints or unsubscribes,
- how the split changes by industry or list type.

Those are important gaps if you are deciding between a four-step and a seven-step sequence. The 4 to 7 recommendation is a reasonable starting range. You still need to measure unsubscribes, complaints and replies on your own sends.` },
      { id: "content", heading: "What makes a follow-up worth sending", body: `The report's advice on content is brief and mostly qualitative. It says each additional touch should add value, and it gives a few specifics:

- **First email length:** elite performers average fewer than 80 words in a first-touch email. The FAQ states the best campaigns are under 80 words.
- **Call to action:** a single, low-effort ask, such as a binary question or a simple request. The report offers no performance data beyond one anecdotal 2025 example.
- **Subject lines, personalization and A/B tests:** described without figures.

This is general guidance rather than measured fact, but a few working rules follow from it.

1. **Add something each time.** A follow-up that only says "just checking in" gives the reader no new reason to respond. A follow-up that adds a short example, a clearer question or a different angle gives them one.
2. **Keep the ask small.** A question that can be answered in one word is easier to reply to than a request for a call.
3. **Stay short.** If a first email is best under 80 words, a follow-up can usually be shorter.
4. **Stop when asked.** An unsubscribe request or a clear no ends the sequence for that person.

### The compliance side of follow-ups

Follow-ups are still commercial email. In the United States, the FTC's CAN-SPAM guidance applies to business-to-business messages as well as consumer ones, and requires that opt-out requests be honored within 10 business days. We checked this on the FTC's own guide on 18 November 2026. Rules differ by country, so this is not legal advice. The practical point is that every follow-up needs a working way to stop receiving it, and that stop must carry over to every later step. See our [lawful use policy](/legal/lawful-use) for how we expect lists to be used.` },
      { id: "data", heading: "Why sequence length depends on a clean list", body: `Every extra step multiplies the effect of bad addresses. A hard bounce on step one is one failure. If the same invalid address stays in a seven-step sequence, it may be retried several times unless your tool suppresses it. Even when the tool suppresses it, each bounce counts against your sending reputation.

Instantly's report says to keep bounce rates below 2% ("ideally much lower") and to pause a campaign and clean the list if bounces are high. It also says teams with stable domain health and steady sending see 15 to 20 percent higher replies in its dataset, with no baseline given.

Those two lines connect to follow-ups in a simple way. A longer sequence only helps if messages are still reaching inboxes at step four, five and six. If your first sends already cause bounces or complaints, later steps may land in spam. That is general reasoning from the report's own guidance, not a separate measurement.

### Checking a list before a long sequence

Before you commit a list to a multi-step sequence, you can reduce risk in three ways. These are general practices.

1. Verify the list. If you already own it, [email list verification](/email-list-verification) can check it before you send.
2. Send the first step to a small batch and watch the bounce rate before you release the rest.
3. Suppress anyone who replies, bounces or opts out from all later steps.

If you are buying a list, ask for a masked sample so you can check the field structure first. Every BeigeLeads list page includes one, and you can also [request a free sample](/sample). BeigeLeads refreshes its databases every 90 days, and our [verification page](/verification) explains the checks we run.` },
      { id: "plan", heading: "A simple plan for using this benchmark", body: `Here is one way to apply the finding without over-reading it. The steps below are general guidance built on the report's numbers, not a measured recipe.

1. **Measure your own split.** Count the replies that come from step one and from later steps in your last few campaigns. Compare your split with 58/42. If almost all of your replies come from step one, your follow-ups may be too weak or too late. If your follow-ups bring most replies, your first email may need work.
2. **Pick a length inside the range.** Start with four steps spaced three to four days apart. Extend toward seven only if each added step still produces replies at an acceptable unsubscribe and complaint rate.
3. **Write reply-style follow-ups.** Keep step two short and conversational.
4. **Watch bounces from the start.** Stay under the 2% line the report gives and pause if you cross it.
5. **Review after each campaign.** Change one thing at a time so you know what moved the result.

### What this benchmark cannot tell you

It cannot tell you the best number of steps for your list, your offer or your market. It cannot tell you how many follow-ups are acceptable to recipients in a given industry. It cannot tell you how follow-ups affect long-term sender reputation, because that was not measured. The split is a useful anchor and a reason not to stop at one email, nothing more.

For more context, read the [cold email reply rate benchmarks](/benchmarks/cold-email-response-rate), which define what the source counts as a reply, and the [sales cycle benchmarks](/benchmarks/b2b-sales-cycle), which show how many weeks a B2B deal can take after the first reply.` },
    ],
    faq: [
      { q: "How many follow-ups should I send?", a: "Instantly's report recommends 4 to 7 touchpoints in total, spaced about 3 to 4 days apart, and at least 4 emails. That is the vendor's guidance, not a measured optimum for every list." },
      { q: "What percentage of replies come from follow-up emails?", a: "In Instantly's 2025 data, 42% of replies came from follow-ups and 58% from the first email. The FAQ names steps 2 to 4 for the follow-up share." },
      { q: "Do replies continue after step ten?", a: "The report says replies continue past step 10 at much lower rates but gives no figure." },
      { q: "Is the 58% figure a reply rate?", a: "No. It is the share of all replies that arrived on step one. It does not show the reply rate of a single email." },
      { q: "Are follow-ups allowed under email law?", a: "They are commercial email like any other. In the United States the FTC's CAN-SPAM rules cover business email too and require opt-out requests to be honored within 10 business days. Rules differ by country and this is not legal advice." },
      { q: "Does this data show how follow-ups affect complaints?", a: "No. The report does not measure the effect of follow-ups on spam complaints or unsubscribes." },
    ],
  },
};
