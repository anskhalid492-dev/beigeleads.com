import { CASE_STUDY_STARTERS } from "./case-study-starters";
import { GUIDE_STARTERS } from "./guide-starters";
import type { Kind } from "./kind";
import { mdToDoc } from "./markdown";

/** Ready-written articles an admin can add as a DRAFT from /admin/blog/starters. They go through the normal CMS save path; nothing is published automatically. */
export type StarterArticle = {
  slug: string; title: string; excerpt: string; seoTitle: string; metaDescription: string; focusKeyword: string; featuredAlt: string;
  category: string; tags: string[]; markdown: string;
  /** "guide" starters become guides (/guides/<slug>); default is a blog article. */
  kind?: Kind;
  /** Approved brand image under /public (for example /brand/social/...png), copied into the media library when the draft is created. */
  brandImage?: string;
};

export const STARTERS: StarterArticle[] = [
  {
    slug: "how-to-build-a-b2b-email-list",
    title: "How to Build a Targeted B2B Email List for Cold Outreach",
    excerpt: "A step-by-step guide to building a B2B email list that gets delivered: define your ideal customer, choose markets, source and verify contacts, and reach out within the rules.",
    seoTitle: "How to Build a B2B Email List for Cold Outreach",
    metaDescription: "Learn how to build a B2B email list step by step: define your ideal customer, pick markets, source and verify contacts, clean the data and stay compliant.",
    focusKeyword: "how to build a B2B email list",
    featuredAlt: "Abstract illustration of business contacts being filtered and checked into a clean targeted list",
    category: "Cold Email Outreach",
    tags: ["B2B email list building", "Targeted business email lists", "B2B prospecting", "Business contact data", "Cold email lead generation"],
    markdown: `Most cold email campaigns are decided before the first message is written. If the list is wrong, no subject line can save it: the wrong people never reply, bounced addresses damage your sending reputation, and the few real prospects you do reach get a message that has nothing to do with them.

A good list is the opposite. It is small enough to personalise, narrow enough that one message fits everyone on it, and clean enough that your emails actually arrive. This guide walks through how to build a B2B email list step by step, from deciding who you are targeting to checking, cleaning and using the data responsibly.

## What is a targeted B2B email list?

A targeted B2B email list is a set of business contacts who share the characteristics of the customers you want: the same kind of company, in the same kind of place, in a role that cares about the problem you solve. Each row is a real person or a real business mailbox, with enough context (company, role, location, website) that you can tell why they are on the list.

It differs from a "big list" in three ways:

- **It is defined by a profile, not by volume.** You can explain in one sentence who is on it.
- **It is recent.** Business contact data goes out of date as people change jobs and companies close, so a list is only as good as its last check.
- **It is lawful to use for your purpose.** You know where the data came from and how you will honour opt-outs.

Targeted lists are the foundation of B2B prospecting, which is simply the work of finding and reaching organisations that could plausibly become customers.

## Step 1: Define your ideal customer profile

Start with who already buys, not who you hope will buy. Write down the three to five customers you are happiest with and look for what they share:

- **Industry or niche.** "Dental practices" is a list. "Healthcare" is a category.
- **Company size.** Employee count or number of locations often changes who makes the decision.
- **Location.** Country, state, or city, depending on whether you serve customers locally.
- **Role.** The person who feels the problem or signs off on the budget: an owner at a small business, a department head at a larger one.
- **A trigger or need.** Something visible that suggests they need you, such as a new location, an out-of-date website, or a hiring push.

Then turn that into a one-sentence definition you can test every row against, for example: "Independent dental practices in Texas with one to three locations, where the owner or practice manager handles marketing."

If you cannot write that sentence, you are not ready to buy or build a list yet.

## Step 2: Choose your industries and geographic markets

Resist the urge to start broad. A narrow first list lets you learn quickly what works. Pick one industry and one geography, send to it, and read the replies before you expand.

Some practical rules:

- **Pick markets where one message fits everyone.** A plumber and a law firm need different wording, so they belong on different lists.
- **Go local when the service is local.** For services delivered in person, state or city lists beat national ones.
- **Split by sub-niche.** "Restaurants" becomes "independent restaurants" and "restaurant groups" when their buying process differs.
- **Check the market is big enough.** If the profile only matches a few hundred businesses, make sure that is enough for the campaign you have in mind.

## Step 3: Find reliable business contact data

There are four common ways to get business contact data, and most teams use a mix.

1. **Build it yourself.** You collect companies from maps and listings, find websites, and look for published contact details. This is accurate to your own standards but slow.
2. **Buy a ready-made list.** A data provider has already collected, organised and checked contacts for a specific niche and location. This is the fastest route when your target matches an existing list.
3. **Order a custom list.** The provider builds a list to your exact definition: industry, geography, roles and fields. It takes longer but fits unusual targets.
4. **Use a subscription database.** You log in, filter and export, usually on a monthly or annual plan. This suits teams that prospect continuously.

Whichever you choose, ask the same questions: Where does the data come from? How is it checked, and when was it last checked? What happens if many addresses bounce? A provider that cannot answer these clearly is a risk.

Here is how that looks for BeigeLeads. We are a B2B data provider: our team collects business data from sources such as business listings, company websites and public registries, enriches it, and checks emails with SMTP verification. You can read the details on our [data sources](/data-sources) and [verification](/verification) pages, and you pay once for a list rather than subscribing.

## Step 4: Evaluate data quality and freshness

Before you send a single email, inspect the list. Open the file and look at a sample of rows by hand.

:::tip
Ask for a free sample before you buy anything. A real sample lets you check formatting, completeness and relevance on your own screen. You can [request a free masked sample](/sample) of a BeigeLeads list at any time.
:::

Check these things:

- **Relevance.** Do the businesses match your profile? If one in five rows does not, the list is not targeted enough.
- **Completeness.** Which fields are filled in: company name, address, phone, website, email, size? Empty fields limit your personalisation.
- **Role fit.** Are the contacts decision makers or generic mailboxes? Both can work, but you should know which you have.
- **Duplicates.** The same business appearing twice means two emails to one inbox.
- **Freshness.** Ask when the data was last verified and how often it is refreshed. Business data decays, so a list verified recently is worth more than a larger list nobody has checked in a year.

## Step 5: Understand email verification

Verification is the step that decides whether your emails land. At a basic level, it answers three questions about each address:

- **Is the format valid?** Typos and impossible addresses are removed first.
- **Does the domain accept email?** The domain must exist and have mail servers.
- **Does the mailbox exist?** An SMTP check asks the receiving server whether it would accept mail for that address, without sending a message.

Verification has limits, and it helps to know them:

- **Catch-all domains** accept mail for any address, so a check cannot prove a specific mailbox exists. Treat those addresses as lower confidence.
- **Role addresses** such as info@ or sales@ usually reach a team, not a person. They are fine for some campaigns and poor for personal outreach.
- **Results go stale.** A mailbox that was valid last quarter may not be valid today, which is why re-checking matters. BeigeLeads re-verifies all data every 60 days.

No verification process is perfect, so a good provider also tells you what happens when addresses still bounce. Our [replacement and refund policy](/legal/refund-replacement) covers that.

## Step 6: Clean and organise your list

Even a good list needs a quick tidy before it goes into your sending tool.

1. **Remove duplicates** by email address and by company.
2. **Standardise fields.** Consistent capitalisation for names, companies and cities avoids awkward merge fields such as "Hi JOHN".
3. **Segment.** Split the list by sub-niche, location or role so each segment gets a relevant message.
4. **Suppress what you must not email.** Add anyone who has opted out, current customers, and existing conversations to a suppression list.
5. **Keep the source and date.** Note where each list came from and when, so you can answer questions later.

Formats matter too. A good list arrives as a CSV, Excel or TXT file you can open anywhere, so you are never locked into one tool.

## Step 7: Reach out responsibly

Cold email to businesses is generally allowed in the United States when you follow the rules, and ignoring them is expensive. Three sets of rules matter most.

**The law.** The FTC's [CAN-SPAM Act guide for business](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) says header information must be accurate, subject lines must not be deceptive, the message must be identified as an advertisement, and it must include a valid physical postal address. It must also explain how to opt out, and opt-out requests must be honoured promptly, within 10 business days. The FTC states that the law makes no exception for business-to-business email, and that each violating email can carry penalties of up to $53,088.

**The mailbox providers.** Large inbox providers set their own standards. Google's [email sender guidelines](https://support.google.com/a/answer/81126) require senders of more than 5,000 messages a day to Gmail accounts to authenticate with SPF, DKIM and DMARC and to support one-click unsubscribe for marketing messages. Google also says to keep your spam rate in Postmaster Tools under 0.30%, and recommends staying below 0.10%. Even small senders benefit from following the same practices.

**Other countries.** Rules outside the US differ. Canada's anti-spam law and the privacy and e-privacy rules in Europe and the UK, for example, can require consent that US law does not. If you will email outside the United States, get advice that covers those places. BeigeLeads' own policies are in our [lawful use](/legal/lawful-use) and [CAN-SPAM](/legal/can-spam) pages, and this article is general information, not legal advice.

Beyond compliance, a few habits keep your reputation healthy:

- Send from a domain you own, with SPF, DKIM and DMARC set up.
- Start with small batches and increase volume gradually.
- Make unsubscribing easy and honour every request, every time.
- Stop emailing addresses that bounce.

## Common list-building mistakes

- **Starting too broad.** A list of "all small businesses" produces vague messages and weak results.
- **Chasing volume.** More rows means more bounces, more complaints and less time per prospect.
- **Skipping the sample check.** Looking at fifty rows takes minutes and can save a whole campaign.
- **Ignoring freshness.** An old list can contain closed businesses and people who left.
- **Mixing prospect types.** One message sent to very different segments fits nobody.
- **Forgetting suppression.** Emailing people who opted out is the fastest way to create complaints.
- **Treating the list as the strategy.** A good list only gives you a chance. The message and the offer still have to be worth reading.

## Ready-made vs custom B2B contact lists

If you are buying data, the first decision is whether an existing list fits.

| | Ready-made list | Custom list |
|---|---|---|
| Best for | Common niches and locations | Specific or unusual targets |
| Speed | Mostly instant delivery | Takes longer, because it is built for you |
| Fit | Good if your profile matches the niche | Built to your definition |
| Before you buy | Browse and request a sample | Describe what you need and get a review |

At BeigeLeads you can [browse ready-made lists](/lists) by industry and location. If your target is more specific, send a [custom list request](/custom-list) with the industry, location and roles you need, and we will review it. Our [how it works](/how-it-works) page explains the full process from sample to delivery.

## A practical checklist

Use this before every campaign:

- I can describe my ideal customer in one sentence.
- My list covers one industry and one geography.
- I know where the data came from and when it was last verified.
- I checked a sample of rows by hand.
- Duplicates are removed and fields are consistent.
- The list is split into segments with a matching message for each.
- Opt-outs, customers and open conversations are suppressed.
- My sending domain has SPF, DKIM and DMARC.
- Every email has a postal address and a working unsubscribe.
- I have a plan for handling bounces and replies.

## Frequently asked questions

### How big should a B2B email list be?

Big enough to test, small enough to personalise. For a first campaign, a few hundred well-matched contacts teach you more than tens of thousands of loosely matched ones. Grow the list after you see what works.

### Is it legal to send cold emails to businesses?

In the United States it is generally allowed if you follow CAN-SPAM: accurate headers, honest subject lines, a clear advertisement notice, a postal address and a working opt-out that you honour. Other countries have different rules, and this guide is not legal advice.

### How often should I clean my list?

Check it before every campaign and re-verify addresses you have not emailed recently. Business contact data changes constantly as people move and companies close, so older lists need more checking.

### What is the difference between a verified and an unverified email?

A verified email has passed checks such as format, domain and mailbox tests, so it is more likely to be delivered. An unverified address might be mistyped, closed or fake. Verification reduces bounces but cannot guarantee delivery.

### Should I buy a list or build my own?

Build your own when you have time and a very unusual target. Buy a ready-made list when your target matches an existing niche and you want to start quickly, and order a custom list when you need something specific built for you. Whatever you choose, ask for a sample first.

## Conclusion

Building a B2B email list is mostly decisions made in the right order: who you serve, where, which contacts matter, whether the data is fresh and verified, and how you will contact them within the rules. Get those right and a modest list can outperform a huge one.

When you are ready to start, [browse the ready-made lists](/lists) or [request a free sample](/sample) and check the data yourself before you spend anything.
`,
  },
];

export const starterDoc = (s: StarterArticle) => mdToDoc(s.markdown);

// Guides come after the articles so existing article lookups by position keep working.
STARTERS.push(...GUIDE_STARTERS, ...CASE_STUDY_STARTERS);
