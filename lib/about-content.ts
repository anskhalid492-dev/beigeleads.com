/**
 * About page story. Every biographical fact below comes from the owner's own founder story (shared 19 Nov 2026)
 * or from CLAUDE.md (sourcing statement, policies). Nothing else may be added without the owner's confirmation.
 * Items to confirm are listed in TODO-BEFORE-LAUNCH.md ("About page").
 */
export const FOUNDER = {
  name: "Anus", // confirmed by the owner, 19 Nov 2026
  first: "Anus",
  role: "Founder",
  photo: "/about/founder-anus.webp" as string | null, // owner-supplied photo (19 Nov 2026), background recoloured to forest-500; null shows a logo card
};

export type Chapter = { id: string; label: string; title: string; paragraphs: string[] };

export const CHAPTERS: Chapter[] = [
  {
    id: "learning",
    label: "2020",
    title: "Dropped out, and started anyway",
    paragraphs: [
      "Anus dropped out of college. In his own words: \u201cI wasn\u2019t supposed to make it.\u201d There was no plan to follow and no one to hand him a roadmap, so in 2020 he started in outbound, the work of finding businesses that might need what you offer and getting a reply from them.",
      "He learned it by doing it: cold emailing, cold calling, and freelancing, with real prospects on the other end and no safety net.",
    ],
  },
  {
    id: "setbacks",
    label: "The messy part",
    title: "Starting, failing, starting again",
    paragraphs: [
      "Along the way he started several businesses and failed at several of them, before, as he puts it, finally cracking the code. He does not describe those failures as anything other than failures.",
      "They were useful all the same. Each one taught him a little more about how prospects think, why people reply, why messages get ignored, and what makes an email feel relevant instead of automated.",
    ],
  },
  {
    id: "years",
    label: "Six years",
    title: "More than 50 million emails",
    paragraphs: [
      "More than six years later he is still in the same space. By his own count he has now sent over 50 million emails, along with years of cold calling, outbound sales and freelance work. Every one of those campaigns was a test of the same thing: what happens when a message meets a real prospect.",
    ],
  },
  {
    id: "chain",
    label: "The first link",
    title: "A chain that starts with the list",
    paragraphs: [
      "From the outside, outbound looks simple: find a prospect, send an email, get a reply. Up close, every step is its own decision. The right prospect, the right message, the right timing, the right follow-up, the right mailbox, the right sending pace, then the reply and whatever comes next.",
      "Anus\u2019s view, formed over those years, is that the first of those steps limits all the others. Better targeting gives a message a reason to matter before a single word of it is written.",
    ],
  },
  {
    id: "sourcing",
    label: "The scattered part",
    title: "Where the names actually come from",
    paragraphs: [
      "The difficulty is that a good list does not sit in one place. The details of a local business are spread out: a map listing here, a company website there, a public registry, a directory, a professional profile. The owner\u2019s name may be in one of them and a published email in another, and plenty of businesses publish neither.",
      "Pulling that into one clean row, and then checking whether the email address will really accept mail, is slow work, and it starts again from zero every time a new list is needed. Sourcing leads was the part of outbound that stayed scattered across too many places.",
    ],
  },
  {
    id: "idea",
    label: "The build",
    title: "Built from scratch, by one person",
    paragraphs: [
      "BeigeLeads is the result: a B2B data provider that Anus built entirely from scratch, drawing on his outbound sales, his freelancing journey and the habit of documenting the work every day. Every feature, pricing decision, integration and late-night fix was his.",
      "It is built around that first link. The team collects raw data from business listings, company websites, public government registries, directories, licensed providers, public professional profiles and its own research. It fills in what is missing, such as owners and emails, using published addresses, pattern inference and enrichment, and verifies the emails with in-house SMTP checks. Every list is re-verified every 60 days.",
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
