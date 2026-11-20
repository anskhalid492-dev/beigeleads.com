import type { StarterArticle } from "./starters";

/**
 * Case studies. Created as DRAFT case studies from /admin/blog/starters through the normal CMS save path (cover image copied from /case-studies/*.webp).
 * IMPORTANT: no documented customer outcomes exist yet, so all three are ILLUSTRATIVE USE CASES: composite scenarios that show how targeted data
 * is used. They name no customer, show no logo, and state no conversion rate, revenue, ROI or campaign result. Every study says so in its first lines
 * and on its page. Replace or add real, permissioned customer stories only with the customer's written approval, and add the slug to
 * REAL_CUSTOMER_SLUGS in lib/case-studies.ts so the "Illustrative use case" label is removed for that one.
 * Facts about BeigeLeads come from the site's own policies (seven fields, in-house SMTP checks, 60-day re-verification, replacement policy).
 */
const NOTE = (extra = "") => `:::info
**Illustrative use case.** This is a composite scenario written to show how targeted business data can be used. It is not a report about a real customer, and it contains no customer names, logos, testimonials or measured results.${extra}
:::`;

export const CASE_STUDY_STARTERS: StarterArticle[] = [
  {
    kind: "case",
    slug: "targeted-business-data-for-agency-prospecting",
    title: "How Targeted Business Data Can Improve Agency Prospecting",
    excerpt: "An illustrative use case: how a small marketing agency can define an ideal customer, choose one industry and a few places, and prepare an outreach-ready prospect list instead of mailing a broad file.",
    seoTitle: "Targeted Business Data for Agency Prospecting",
    metaDescription: "An illustrative B2B lead generation case study: how a marketing agency can define an ideal customer, choose an industry and places, and prepare a focused list.",
    focusKeyword: "B2B prospecting strategies for agencies",
    featuredAlt: "Scattered contact dots narrowing through a funnel into a short list of outreach-ready business contact cards",
    brandImage: "/case-studies/targeted-agency-prospecting.webp",
    category: "Marketing Agencies",
    tags: ["Agency prospecting", "Ideal customer profile", "Business data use cases", "Local business marketing"],
    markdown: `${NOTE()}

Most small marketing agencies do not have a shortage of ambition. They have a shortage of attention: the owner is also the account manager, the strategist and the person who sends the proposals. Prospecting happens in the gaps, usually with whatever list is nearest. This use case follows a fictional agency through a better way to do it, and shows where targeted business data fits at each step.

## Background and context

Picture a four-person agency that sells local search and website work. Its current clients came from referrals, which is great until referrals slow down. The owner decides to start outbound outreach, buys a large, general business email file and sends a first campaign to all of it.

The campaign goes badly for reasons that have nothing to do with the offer. The file covers every type of business in many places, so the message has to stay vague. Some addresses are out of date and bounce. Replies, when they come, are mostly "not relevant to us". The agency has spent time and sending reputation and learned very little.

This is a common pattern, and it is a data problem as much as a copywriting problem. The rest of this use case shows how the same agency could start again with a narrower plan.

## The challenge

The agency needs a prospect list that is **relevant**, **reachable** and **small enough to personalise**. That breaks down into four questions:

- Which type of business is the agency best placed to help?
- Which places can it realistically serve and visit?
- Which contact details does it need to reach a decision-maker or the business owner?
- How can it check that the list is usable before it sends a single message?

None of these questions is about volume. The agency's capacity is a few dozen thoughtful conversations a week, not tens of thousands of messages.

## The data strategy

### Step 1: write an ideal customer profile

The owner writes down what the best existing clients have in common. Not "small businesses", but something specific: independent businesses that depend on local customers, that have a website that could be better, and where one owner or manager makes the buying decision.

Dental practices fit that description well. Patients search locally, the practice website is its main marketing asset, and most practices have a clear owner or practice manager. The agency chooses one industry to start with, deliberately. A single industry lets it use one case-specific message, one proof point and one set of examples. If it works, the agency can repeat the process for a second industry. If it does not, the agency has lost two weeks, not a quarter.

### Step 2: choose places the agency can serve

The agency works with clients by video call, but the owner likes to meet new clients in person at least once. Two neighbouring states are manageable; the whole country is not. The agency picks a small set of places and writes them down, so every later decision can be checked against them.

BeigeLeads organises lists the same way. The [dentists](/lists/dentists) category has a [United States page](/lists/dentists/united-states) and place pages below it where inventory is recorded, so the agency can see what exists for each state or city before it buys anything. The [ready-made dentist email list](/lists/dentists-us) is the national product; place pages are views of it.

### Step 3: decide which fields matter

BeigeLeads lists carry seven fields: business name, address, city, country, phone, email and website. For this agency, each has a job:

- **Business name and website** let the agency review the practice's site before writing. A few minutes of research produces a specific first line.
- **City and address** allow sorting by place, and make local references possible.
- **Email and phone** are the two ways to reach the business.
- **Country** keeps a multi-country plan tidy.

The agency does not need a long list of extra attributes. A short, consistent set of fields that it will actually use is better than a wide one it will ignore.

### Step 4: look before buying

Every BeigeLeads list page has a masked sample, and the [free sample](/sample) is a way to see the structure and quality of a list before paying. The agency checks that the rows are the kind of business it wants, that the fields are filled, and that the layout fits how it works. Because a list is a one-time purchase and the file is the agency's to keep, the decision is about fit, not about a subscription.

## Implementation approach

With the data chosen, the agency builds a repeatable weekly routine.

1. **Segment the file.** The list is sorted by city. The agency starts with one or two cities where it already has a local reference.
2. **Clean before sending.** The agency removes duplicates, rows missing an email, and obvious role mailboxes that are unlikely to reach a decision-maker. BeigeLeads checks emails with in-house SMTP verification and re-verifies data every 60 days, but a quick tidy on the agency's side is still sensible, and it makes the spreadsheet easier to work with.
3. **Research a small batch.** The owner picks twenty practices, opens each website and notes one specific observation: an outdated page, a missing service page, no clear booking path.
4. **Write one message per batch.** Each email references the observation, offers one concrete next step and includes the sender's real name, postal address and an easy way to opt out. The [CAN-SPAM guidance](/legal/can-spam) applies to business email in the United States, and the agency treats unsubscribe requests as final.
5. **Send small, then review.** The agency sends a small batch, watches bounces and replies, and only then sends the next. A rising bounce rate is a signal to stop and look at the list, not to push harder.
6. **Record what happens.** Each practice gets a status: not contacted, contacted, replied, not interested, meeting booked. After a few weeks the agency can compare cities and messages with real information.

A guide such as [the complete guide to B2B lead generation](/guides/b2b-lead-generation-guide) covers the surrounding steps in more depth, including follow-up and measurement.

## Results and lessons learned

Because this is an illustrative use case, there are no results to report, and we are not going to invent any. What can be said is what a team in this position should measure, and what they are likely to learn.

**What to measure.** Bounce rate per batch, reply rate per message, the share of replies that are relevant, and meetings booked per hundred contacts reached. Track them by city and by message version, so the next decision is based on the agency's own numbers.

**What the scenario illustrates:**

- A narrow ideal customer makes the message easier to write and easier to believe.
- A small geographic scope keeps follow-up manageable and makes local references possible.
- Fewer, better-chosen rows beat a bigger file because the agency's real limit is attention.
- Checking the list before sending protects sending reputation, which is hard to rebuild.
- A one-time purchase turns the list into an asset the agency can keep working through, rather than a rental that stops when a plan ends.

## Key takeaways

- Define the ideal customer first, then buy data, not the other way round.
- Start with one industry and a small set of places.
- Choose the few fields you will actually use, and look at a masked sample before you buy.
- Clean the list, send small batches and watch bounces.
- Record outcomes so each round of outreach teaches you something.

## Related BeigeLeads databases

- [Dentist email lists](/lists/dentists), with a [United States view](/lists/dentists/united-states)
- [Restaurant email lists](/lists/restaurants) for agencies working with hospitality
- [All business email lists](/lists), by industry and location
- [Marketing agency solutions](/solutions/marketing-agencies), with more on agency workflows

Ready to look at real inventory? [Explore business email lists](/lists) and start with a masked sample.`,
  },
  {
    kind: "case",
    slug: "geographic-segmentation-for-b2b-campaigns",
    title: "Using Geographic Segmentation to Build More Relevant B2B Campaigns",
    excerpt: "An illustrative use case: how a B2B team can plan campaigns by country, state and city, avoid irrelevant targeting and choose a database package that matches the markets it can actually serve.",
    seoTitle: "Geographic Segmentation for B2B Campaigns",
    metaDescription: "An illustrative case study on geographic lead segmentation: plan B2B campaigns by country, state and city and choose a database package that fits.",
    focusKeyword: "geographic lead segmentation",
    featuredAlt: "A dot-matrix map with one highlighted region and city pins beside a short list of local business contact cards",
    brandImage: "/case-studies/geographic-segmentation.webp",
    category: "Geographic Segmentation",
    tags: ["Geographic lead segmentation", "Regional sales", "Campaign planning", "B2B prospecting strategies"],
    markdown: `${NOTE()}

Geography is the most under-used filter in B2B outreach. Teams spend hours on subject lines and almost no time on a more basic question: should this message go to this place at all? This use case follows a fictional regional sales team through a location-first approach, from the first map to the choice of a database package.

## Background and context

Imagine a company that sells commercial kitchen equipment and servicing. Its field team of three covers a handful of regions. Marketing wants to start an email programme to book demo visits and service calls.

The first plan is "email every restaurant we can find". It sounds ambitious and efficient. In practice it creates three problems. Many recipients are in places the team cannot visit, so any offer of a visit is empty. Messages cannot mention anything local, so they read like mass mail. And the team cannot tell, after the campaign, whether a weak result came from the message or from sending it to the wrong places.

## The challenge

The team needs to turn a vague "everywhere" into a plan with edges. Specifically it has to:

- decide which countries, states and cities to start with;
- keep campaign content relevant to each place;
- avoid spending effort on areas it cannot serve;
- choose a database package that covers its plan without paying for far more than it will use.

## The data strategy

### Work from the outside in: country, state, city

The team splits its thinking into three levels, because each answers a different question.

- **Country** decides which rules, languages and currencies apply. It also decides which products can be offered at all. Email rules vary: the United States, the European Union and individual countries inside it treat unsolicited commercial email differently, and some are stricter than others. Before writing to a new country, the team checks the local rules, ideally with legal advice.
- **State or region** is usually the level at which a field team is organised. Sales territories often follow it.
- **City** is the level at which a visit, a local event or a local reference makes sense.

BeigeLeads mirrors this structure. A list category such as [restaurants](/lists/restaurants) has country pages, and below them state and city pages where inventory has been recorded. Place pages show what exists for each place and link to neighbouring areas, which makes it simple to see where a list is deep and where it is thin. The longer [guide to building a list by country, state and city](/guides/build-b2b-email-list-by-country-state-city) explains the method in detail.

### Start where service is possible

The team draws its coverage on a map: the cities its engineers can reach in a day. Those become "tier one". Neighbouring cities that would need a longer trip are "tier two". Everything else is out of scope for now.

Tier one gets the first campaigns. Tier two waits until tier one has produced learning and capacity. This sounds slow, but it is the opposite: because every message can honestly offer a visit, replies are more likely to turn into bookings.

### Country list or city list?

Both exist, and the choice is practical rather than technical. A country list suits a team with national reach, such as a supplier that ships anywhere or a service that is delivered remotely. A city list suits a team whose value depends on being nearby, or a team that wants to test a market before committing to it.

A sensible compromise is to start with the city list for the one city where the team already has a local reference, and move up to the country list only when that first city shows the offer works. The reverse is also reasonable: a team that already has the country list can treat each city as its own campaign by sorting the file, and still get the benefit of testing one place at a time.

### Segment content, not just lists

Segmentation is not only about whom to send to. The team prepares one short template and then localises one line for each city: a landmark, a trade fair, a regional association, a local regulation that affects kitchens. Local references take minutes to add and make the message feel written for the reader.

## Implementation approach

1. **Map coverage.** The team lists its tier-one cities and writes who covers each.
2. **Check inventory per place.** For each city the team opens the place page and the list's masked sample to confirm that real rows exist there. A place with no recorded inventory is moved to a later phase, or covered through a custom request.
3. **Choose the package.** Lists are sold in package sizes, and bigger packages cost more. The team adds up how many contacts it can realistically work through in a quarter, not how many it would like. If tier one needs a few thousand rows, it picks the smallest package that covers that, and can buy another later. Packages and prices are shown on each list page.
4. **Run one city first.** The first campaign goes to one tier-one city. The team reviews bounces and replies before opening the next.
5. **Compare places.** After a few rounds, the team compares cities against each other. If one city responds far better, it is worth asking why: seasonality, competition, the local reference used.
6. **Expand deliberately.** Tier-two cities are added one at a time, each with its own localised line.

The [Germany business email database](/lists/germany-business-email-lists) and the [Berlin business email list](/lists/berlin-business-email-list) show the same idea at national and city level: a team can start with a single city and move to the national list if the first step works.

## Results and lessons learned

This is an illustrative use case, so there are no measured outcomes to share and none are claimed. The value of the scenario is the lessons it points to and the numbers a team should watch.

**What to measure.** Bounce rate and reply rate by city; meetings or service calls booked by city; time from reply to visit; and the share of replies that are out of area. That last figure is the cleanest test of whether geographic targeting is working: it should fall as the plan tightens.

**What the scenario illustrates:**

- Place is a filter on relevance, not decoration. A message that can name a city and offer a visit is a different message.
- Tiers keep a small team honest about what it can serve.
- Looking at inventory per place before buying prevents plans built on places with no data.
- Package choice follows capacity, not ambition. It is easier to add a second list than to use a list that was far too large.
- Comparing cities is only possible when each campaign is clearly separated.

## Mistakes this approach avoids

- **Treating a region as one market.** Two cities in the same state can have different competitors, seasons and buying habits. Treat them as separate campaigns until the data says otherwise.
- **Promising visits to everyone.** An offer to visit is only credible when the sender can actually come. Tiers keep the promise honest.
- **Buying for the dream plan.** A package sized for every market the company might ever enter is mostly unused data. Sized for the next quarter, it is a working tool.
- **Mixing too many changes at once.** If the city, the message and the offer all change between two campaigns, the team cannot tell which change mattered.
- **Forgetting the rules at the border.** A message that is fine in one country may not be allowed in another. Check before the first send, not after the first complaint.

## Key takeaways

- Plan by country, then state or region, then city.
- Match the plan to where you can actually serve, and add places in tiers.
- Localise one line per place; keep the rest of the template steady so comparisons are fair.
- Check email rules in each new country before sending.
- Pick the smallest package that covers the next quarter's work.

## Related BeigeLeads databases

- [Restaurant email lists](/lists/restaurants), with country, state and city views
- [Germany business email lists](/lists/germany-business-email-lists) and the [Berlin city list](/lists/berlin-business-email-list)
- [All lists by industry and location](/lists)
- [Request a free masked sample](/sample) to inspect a list before you buy

[Discover geographic lists](/lists) and see which places have recorded inventory.`,
  },
  {
    kind: "case",
    slug: "from-broad-contact-lists-to-focused-sales-prospecting",
    title: "From Broad Contact Lists to Focused Sales Prospecting",
    excerpt: "An illustrative use case: how a small sales team can turn a broad contact file into a structured prospecting workflow by filtering by industry, cleaning and verifying data, and prioritising the right contacts.",
    seoTitle: "From Broad Contact Lists to Focused Prospecting",
    metaDescription: "An illustrative sales prospecting case study: filter a broad contact file by industry, clean and verify it, and build a structured, focused workflow.",
    focusKeyword: "sales prospecting database",
    featuredAlt: "An organisation tree with one highlighted path leading to a short list of verified contact cards",
    brandImage: "/case-studies/focused-sales-prospecting.webp",
    category: "Sales Prospecting",
    tags: ["Sales prospecting databases", "Data cleaning", "Decision-makers", "B2B lead generation case studies"],
    markdown: `${NOTE(" Where the example mentions job titles, note that BeigeLeads lists today are business-level lists with seven fields; they do not include a job-title field.")}

A big contact file feels like progress. Thousands of rows, all in one place. But a sales team does not work on a file; it works on conversations, and conversations need a reason to contact this person now. This use case follows a fictional two-person sales team as it turns a broad list into a focused prospecting workflow.

## Background and context

Imagine a small company that sells scheduling and booking software to independent service businesses. Two salespeople share one inbox and one spreadsheet. A colleague exported a large mixed contact file from an old project: many industries, uneven columns, some addresses clearly stale.

The pipeline is unfocused. Some rows are well outside the product's sweet spot, others duplicate each other, and nobody knows which contacts are worth a phone call and which only deserve an email. Prospecting becomes a matter of mood: whoever has time that day opens the file and picks names.

## The challenge

The team wants to move from "a big file" to "a short, ordered queue". The questions are practical:

- Which industries are really a fit for the product?
- Which contacts are likely to be the right person, and which are generic mailboxes?
- How much of the file can be trusted to be deliverable?
- What routine lets two people work the list without stepping on each other?

## The data strategy

### Filter by industry first

The team starts by deleting. It lists the types of business that actually buy: salons, clinics, small studios and similar independent shops that take appointments. Everything else is set aside. This single step removes more noise than any later cleanup, and it makes messaging simpler, because every remaining row shares a basic situation.

When the team later buys fresh data, it follows the same rule: one industry per list. A category list such as [dentists](/lists/dentists) or [restaurants](/lists/restaurants) arrives already scoped to one kind of business, so the first filter is done before the file reaches the team.

### Be realistic about "decision-makers"

In a large company, picking the right job title is a skill: the head of operations, the sales director, the practice manager. In a small independent business, the owner often makes the decision and the same person reads the general inbox. That affects how a list is used.

BeigeLeads lists are business-level: business name, address, city, country, phone, email and website. They do not carry job titles. So the team identifies the likely decision-maker in a different way: it checks the website's "about" or "team" page for the owner or manager's name, and uses a direct address if one is published. Lists that carry job titles and job functions are planned but not available yet, and this use case does not assume them.

The takeaway is not that titles are unimportant. It is that a prospecting workflow should be built around the fields you really have, and each field should have a job.

### Write the first message for each priority group

Priority changes the message, not only the order. For priority A, where the team has a named owner, the first email can be short and direct, addressed by name, with one observation about the business. For priority B, where only a general address exists, the email should make it easy for whoever reads it to forward: one clear sentence on who the message is for and what the next step is. For priority C, phone-only rows, the first contact is a short call with a clear reason, followed by an email only if the person asks for one.

Treating the groups differently keeps effort proportional. The most research goes where the chance of reaching the right person is highest.

### Clean, then verify

Cleaning and verification are two different things, and a good workflow does both.

- **Cleaning** is what the team does on its own: remove duplicates, drop rows with no email and no phone, standardise city and country spellings, and flag generic mailboxes such as info@ for a lower priority.
- **Verification** is a check that an address can receive mail. BeigeLeads verifies emails with in-house SMTP checks, and re-verifies its data every 60 days; the [verification page](/verification) explains the process. A bounce still can happen, which is why the policy on [refunds and replacements](/legal/refund-replacement) exists.

Neither step replaces the other. Cleaning makes the file easier to work with. Verification makes it safer to send.

## Implementation approach

1. **Scope the file.** Keep only the industries that match the ideal customer. Record the reason for each exclusion.
2. **Add a priority column.** Priority A: a named owner or manager with a direct email. Priority B: the business has a working website and a general email. Priority C: phone only.
3. **Split the work.** One salesperson takes cities in the north, the other the south, so nobody contacts the same business twice.
4. **Set a routine.** Mornings are for research on priority A, with one specific line per message. Afternoons are for phone calls to priority C and follow-ups.
5. **Send in small batches.** The team starts with a few dozen emails, watches bounces, and only then moves on. A sudden rise in bounces is a reason to pause and inspect the file.
6. **Keep a status per business.** Not contacted, contacted, replied, not now, meeting booked, not a fit. Statuses make it possible to see where the queue is, and to stop contacting people who asked not to be contacted.
7. **Respect opt-outs permanently.** Anyone who unsubscribes is marked and never emailed again. The [CAN-SPAM guidance](/legal/can-spam) sets the baseline in the United States, and other countries may be stricter.

For a wider view of how this fits in an outbound programme, see the [sales prospecting solution](/solutions/sales-prospecting) and the [complete guide to B2B lead generation](/guides/b2b-lead-generation-guide).

## Results and lessons learned

As an illustrative use case, this study has no measured results and does not claim any. It offers a method and a list of things worth measuring instead.

**What to measure.** Share of rows removed at each stage (industry filter, duplicates, missing contact), bounce rate per batch, reply rate by priority group, and time spent per booked conversation. Comparing priority groups is the most useful: it shows whether the extra research on priority A is paying for itself.

**What the scenario illustrates:**

- Deleting the wrong rows is the most effective filter, and it costs nothing.
- A workflow built around the fields you really have is more useful than one that assumes fields you do not.
- Cleaning and verification solve different problems; skipping either one shows up later as bounces or wasted calls.
- A visible priority and status for every row turns a spreadsheet into a queue two people can share.
- A smaller, ordered list is easier to follow up properly than a large unordered one.

## Questions to ask before buying more data

Once the workflow runs, the team can decide whether it needs more data, and what kind. A few questions keep that decision grounded:

- Is the current queue empty, or is it only unattended? If rows are waiting, more data will not help.
- Which industry or city produced the best replies, and is there a list for the next similar one?
- Do the fields on offer match how the team actually works? Look at a masked sample first.
- What is the smallest package that covers the next quarter?

## Key takeaways

- Filter by industry before anything else.
- Know which fields your data has, and design the workflow around them.
- Clean the file yourself and use verified data; they are separate jobs.
- Prioritise rows, split territories and record a status for each business.
- Keep opt-outs permanent.

## Related BeigeLeads databases

- [Dentist email lists](/lists/dentists) and [restaurant email lists](/lists/restaurants), each scoped to one industry
- [All business email lists](/lists), by industry and location
- [Data verification](/verification) and [data sources](/data-sources), to see how the data is collected and checked
- [Request a free masked sample](/sample)

[View available databases](/lists) and look at a masked sample to see the fields you would work with.`,
  },
];
