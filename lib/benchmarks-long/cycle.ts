import type { Long } from "./types";

// Source: Optifai Pipeline Study (page last updated 20 Apr 2026), re-read on 22 Nov 2026. Optifai sells sales software; its outside citations were not verified by us.
export const cycle: Record<string, Long> = {
  "b2b-sales-cycle": {
    sections: [
      { id: "study", heading: "What the study is", body: `The figures come from Optifai's Pipeline Study, published as a benchmark page that Optifai last updated on 20 April 2026. The page states "N=939 B2B SaaS companies with stage-level CRM data". The period is given as Q2 2025 to Q1 2026. A version note says the first release used 687 companies and was later expanded to 939.

Stage durations are "based on CRM timestamp analysis of won deals". Cycle ranges "represent 25th-75th percentile", so a stated range such as 30 to 60 days describes the middle half of deals, not the fastest or slowest.

The page never defines a sales cycle. From its stage table it appears to run from discovery through close, but the exact start and end points are not stated. The publisher is a vendor that sells sales software, and the page includes calls to action for its products. BeigeLeads did not run this study. We reproduce the figures as stated and list the limits.

### Headline result

"The median B2B SaaS sales cycle is 84 days." The page also says cycles "have lengthened 22% since 2022". It does not explain how that comparison was calculated.

### Cycle length by deal size

| Deal size (annual contract value) | Cycle length |
|---|---|
| SMB (under $15K) | 14-30 days |
| Mid-market ($15K-$50K) | 30-60 days |
| Upper mid ($50K-$100K) | 60-90 days |
| Enterprise (over $100K) | 90-180+ days |

The page is inconsistent about mid-market. Its headline says mid-market is $15K to $100K at 30 to 90 days. Its deal-size table splits that range into two bands, which is what we show. The two descriptions agree on the overall span (30 to 90 days) and differ in how it is divided.` },
      { id: "stages", heading: "Where the time goes: stage durations", body: `The page breaks the cycle into four stages and gives a duration range for each, by deal size. All figures are in days.

| Stage | SMB | Mid-market | Enterprise | Bottleneck named |
|---|---|---|---|---|
| Discovery to demo | 3-5 | 5-10 | 10-20 | Calendar coordination |
| Demo to proposal | 1-3 | 5-15 | 15-30 | Internal alignment |
| Proposal to negotiation | 3-7 | 10-20 | 20-40 | Stakeholder buy-in |
| Negotiation to close | 2-5 | 10-20 | 30-60 | Legal and procurement |

### What the stage table shows

The last stage grows the most with deal size. For SMB deals it is 2 to 5 days. For enterprise deals it is 30 to 60 days. The page says negotiation to close "accounts for 35-40% of total cycle time in Enterprise deals", though it does not show how the share was calculated.

The earliest stage, discovery to demo, is the stage that outbound contact data touches most directly. Even there, enterprise deals take 10 to 20 days in this data, mostly because of calendar coordination, according to the page.

### A caution on adding ranges

You cannot simply add the stage ranges to get the total. Each is a 25th to 75th percentile range for its own stage, and the stages are not independent. A deal that is slow in one stage is not necessarily slow in all. The page's overall bands, such as 90 to 180 days or more for enterprise, are the figures to use for the whole cycle.

### Only won deals

The stage data comes from won deals. Deals that stalled or were lost are excluded from the stage figures. That means the numbers describe how long deals that closed took. They do not describe how long deals that did not close sat in the pipeline. If lost deals are slower than won ones, which is plausible but not stated, real cycles would look longer than these figures.` },
      { id: "drivers", heading: "Why cycles got longer, according to the page", body: `The page attributes the 22% lengthening to several factors. Some figures come from outside sources the page cites, and we did not verify those sources.

- **More people in the decision.** "Average B2B deal now involves 6.8 stakeholders, up from 5.4 in 2020 (Gartner, 2024)."
- **More finance involvement.** "CFO involvement in software purchases increased 40% (Forrester SaaS Purchase Survey, 2024)."
- **Security and compliance review.** "SOC 2, GDPR, and vendor risk assessments add 2-4 weeks to the average cycle", citing Optifai and Vanta (2025).
- **Economic uncertainty and remote buying committees,** described without figures.

### These are explanations, not proof

The page gives no method for attributing the 22% increase to these causes. They are plausible and widely discussed, but the data presented does not prove them. We keep them in this article because they are the source's account, and we mark them as such.

### Tactics the page lists

The page also lists three tactics with associated figures:

- **Multi-threading:** "Deals with 3+ contacts engaged close 2.4x faster than single-threaded deals", with an impact listed as a 25 to 35 percent reduction in cycle time.
- **Mutual action plans:** listed impact of 20 to 30 percent reduction, with no supporting data.
- **Same-day proposals:** "Deals where proposals are sent within 24 hours of demo close 35% faster", with listed impact of 15 to 25 percent.

The page does not explain how the impact ranges were derived, and the figures show association rather than cause. A deal that is moving quickly may be more likely to have several contacts engaged and a fast proposal, instead of the other way around. Treat these as hypotheses to test in your own pipeline.` },
      { id: "outbound", heading: "What this means for outbound and list data", body: `A cycle measured in weeks has practical consequences for how you contact people. The following is general reasoning built on the benchmark, not a finding from the study.

1. **Contact data must stay valid longer.** An address that works on the day you start may not work 90 days later. The [decay benchmark](/benchmarks/b2b-data-decay) reports that at least 23% of email addresses decayed in a year in its verification data.
2. **Multiple contacts per account matter.** The page's multi-threading figure, if it holds in your market, implies a single contact is a weak point in a long cycle. Lists that include several roles per company help, if the data supports it. BeigeLeads lists are business-level, and each list page shows which fields are included.
3. **Follow-up outlasts the first reply.** In cold email data from Instantly, 42% of replies come after the first email; see [follow-up benchmarks](/benchmarks/cold-email-follow-ups). The sales cycle begins after a reply, so a long cycle follows a long sequence.
4. **Plan by deal size.** An SMB team can expect a first-contact-to-close window of a few weeks. An enterprise team should plan for months. Setting follow-up cadence and data refresh around the right band avoids both over-contacting small deals and abandoning large ones.

### Using the benchmark honestly

Compare your own cycle only with the band that matches your contract value. The overall median of 84 days is a blend of very different deals, so it describes few of them well. Measure your cycle the same way the study does, from stage timestamps of won deals, and note the definition.

### Where outbound data helps

List data helps at the start of the cycle: reaching the right company and the right role. It does not shorten negotiation or procurement. If you need contacts for a specific trade or country, [browse lists](/lists) or [request a free sample](/sample). BeigeLeads refreshes its databases every 90 days; see how we verify on the [verification page](/verification).` },
      { id: "cycle-limits", heading: "Limits to keep in mind", body: `Several limits apply, and the page states or implies them.

- **B2B SaaS only.** The sample is companies with stage-level CRM data in SaaS. Other industries, such as manufacturing, professional services or local businesses, may have very different cycles.
- **No selection criteria.** The page gives no confidence intervals, sampling method or description of how companies were chosen.
- **Naming and dates.** The source is called "Optifai Pipeline Study" in most places and "Optifai Sales Ops Benchmark" in one summary line, and the version note date (16 February 2026) differs from the "data last updated" date (20 April 2026).
- **No win/loss or channel breakdown.** The page does not compare won and lost deals, and it does not break cycles down by lead source or channel.
- **Vendor interest.** The publisher sells software for pipeline management.

### What it cannot tell you

It cannot tell you how long a deal from an outbound email takes compared with one from referral or inbound. It cannot tell you your cycle. It cannot say whether any tactic will shorten it for you.

Use it as a map of the typical shape of B2B SaaS cycles: short for small deals, long for large ones, with the last stage growing most. Then measure your own pipeline.

For the early stage of the funnel, see [cold email reply rates](/benchmarks/cold-email-response-rate) and [email deliverability](/benchmarks/b2b-email-deliverability).` },
    ],
    faq: [
      { q: "How long is the typical B2B SaaS sales cycle?", a: "Optifai's study of 939 B2B SaaS companies puts the median at 84 days, with ranges from 14-30 days for small deals to 90-180+ days for enterprise deals." },
      { q: "Do these ranges include lost deals?", a: "No. The stage data is based on won deals only." },
      { q: "What do the percentile ranges mean?", a: "They show the 25th to 75th percentile, so the middle half of deals, not the fastest or slowest." },
      { q: "Why did cycles get longer?", a: "The page links the 22% increase to more stakeholders, more finance involvement and security review, but gives no method proving those causes." },
      { q: "Does this apply to industries other than SaaS?", a: "The sample is B2B SaaS. Other industries may differ." },
      { q: "Does contact data affect the sales cycle?", a: "The study does not measure it. Data quality affects reaching people at the start, not negotiation or procurement." },
    ],
  },
};
