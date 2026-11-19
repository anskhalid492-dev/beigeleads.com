/**
 * About page story. Every biographical fact below comes from the owner's own founder story (shared 19 Nov 2026)
 * or from CLAUDE.md (sourcing statement, policies). Nothing else may be added without the owner's confirmation.
 * Items to confirm are listed in TODO-BEFORE-LAUNCH.md ("About page").
 */
export const FOUNDER = {
  name: "Anas Khalid", // TO CONFIRM: owner wrote "Anus"; his own story spells it "Anas Khalid".
  first: "Anas",
  role: "Founder",
  photo: null as string | null, // path under /public once an approved photograph exists; until then an initials card is shown
};

export type Chapter = { id: string; label: string; title: string; paragraphs: string[] };

export const CHAPTERS: Chapter[] = [
  {
    id: "learning",
    label: "2020",
    title: "Learning outbound by doing it",
    paragraphs: [
      "Anas Khalid left college and chose a path built on practical experience instead of the usual route from classroom to career. In 2020 he stepped into client acquisition: the plain, unglamorous work of finding out how businesses actually get customers, and what makes outbound work when it does.",
      "There was no roadmap. He learned cold email, cold calling, lead generation, follow-ups, offers and prospect research the way most people eventually learn them, by doing them in front of real prospects. The education was real conversations, ignored emails and rejected offers.",
    ],
  },
  {
    id: "setbacks",
    label: "The messy part",
    title: "Some of it worked. Some of it did not.",
    paragraphs: [
      "Some of the businesses and projects he worked on succeeded, and others did not. Campaigns failed, offers landed in the wrong market, and plenty of messages went unanswered. He does not describe those failures as hidden successes. They were simply part of the process.",
      "They were also useful. They taught him how prospects think, why people reply, why messages get ignored, what makes an email relevant, and what makes automated outreach feel automated.",
    ],
  },
  {
    id: "campaigns",
    label: "Years of campaigns",
    title: "Running the machinery",
    paragraphs: [
      "He kept going. He built and operated client acquisition systems and agencies, and worked across campaigns, messaging, offers, follow-ups, personalization, deliverability, reply management and automation. By his own count, that work includes more than 30 million cold emails: years of testing what happens when an outbound system is put in front of real prospects.",
    ],
  },
  {
    id: "chain",
    label: "The first link",
    title: "A chain that starts with the list",
    paragraphs: [
      "From the outside, outbound looks simple: find a prospect, send an email, get a reply. Up close, every step is its own decision. The right prospect, the right message, the right timing, the right follow-up, the right mailbox, the right sending pace, then the reply and whatever comes next.",
      "Anas's view, formed over those years, is that the first of those steps limits all the others. Better targeting gives a message a reason to matter before a single word of it is written.",
    ],
  },
  {
    id: "sourcing",
    label: "The scattered part",
    title: "Where the names actually come from",
    paragraphs: [
      "The difficulty is that a good list does not sit in one place. The details of a local business are spread out: a map listing here, a company website there, a public registry, a directory, a professional profile. The owner's name may be in one of them and a published email in another, and plenty of businesses publish neither.",
      "Pulling that into one clean row, and then checking whether the email address will really accept mail, is slow work, and it starts again from zero every time a new list is needed. Anas had already watched outbound suffer when it was spread across too many separate tools. Sourcing leads was the same fragmentation, one step earlier.",
    ],
  },
  {
    id: "idea",
    label: "The idea",
    title: "Do the sourcing once, then sell the result",
    paragraphs: [
      "BeigeLeads is built around that first link. The team collects raw data from business listings, company websites, public government registries, directories, licensed providers, public professional profiles and its own research. It then fills in what is missing, such as owners and emails, using published addresses, pattern inference and enrichment, and verifies the emails with in-house SMTP checks. Every list is re-verified every 60 days.",
      "There are two ways in. A ready-made list suits a buyer who already knows the niche and the place: look at a masked sample, pay once in crypto, and receive the file as CSV, Excel or TXT by email. A custom list suits the buyer whose niche is not on the shelf: describe the requirement and the team sources it, subject to what can be sourced. In both cases there is no account to create and no subscription to cancel. An email address is enough.",
    ],
  },
];

export const PHILOSOPHY = {
  line: "Pay once. Own the list.",
  text: "A contact list is a working file, so BeigeLeads sells it like one: a single purchase, a single file, and no renewal date. You use it under the lawful-use policy, and if a list falls below the quality the policy promises, the replacement policy applies.",
};

export const VISION = {
  title: "Where this goes next",
  paragraphs: [
    "Today the lists cover the United States. The team will keep adding categories and places one at a time, and only when the data can be sourced and sold lawfully. Other regions follow once the legal groundwork for them is done, not before.",
    "The aim stays simple: a clean, verified list should be something you can find, preview and own in an afternoon, instead of a project you rebuild every quarter.",
  ],
};
