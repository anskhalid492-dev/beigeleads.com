import { DATABASE_STATEMENT, PRICE_PER_VERIFIED_CONTACT_USD, RESPONSE_HOURS } from "./config";

export const CREATORS_TITLE = "Creator & Influencer Database | BeigeLeads";
export const CREATORS_DESC = "Build custom influencer contact lists from our creator database. Filter by platform, niche, country, and followers. $0.10 per verified contact.";
export const PRICE_LABEL = `$${PRICE_PER_VERIFIED_CONTACT_USD.toFixed(2)}`;
export { DATABASE_STATEMENT, RESPONSE_HOURS };

export const DIMENSIONS: { name: string; text: string; note?: string }[] = [
  { name: "Social platform", text: "Instagram, TikTok, YouTube, X, Facebook, Twitch and other major platforms." },
  { name: "Creator niche", text: "Fitness, beauty, gaming, food, travel, finance: describe the audience your brand wants to reach." },
  { name: "Country and region", text: "Where the creator is based. Name one country, several, or a whole region." },
  { name: "Follower count", text: "From small creators to large channels, in ranges you choose." },
  { name: "Creator language", text: "The language the creator publishes in." },
  { name: "Audience geography", text: "Where a creator's audience lives.", note: "Where available" },
  { name: "Engagement metrics", text: "Engagement requirements you care about.", note: "Where available" },
  { name: "Public business contact fields", text: "The public business contact details we can include for each creator." },
  { name: "Requested list size", text: "How many contacts you want. Your quote follows from this number." },
];

export const EXAMPLE_QUANTITIES = [1000, 5000, 10000, 50000];

export const STEPS = [
  { t: "Tell us your ideal creator audience", d: "Pick platforms, a niche, a country or region, a follower range and how many contacts you need." },
  { t: "We review availability and confirm your custom quote", d: "Our team checks what we can build for your requirements and confirms quantity and price." },
  { t: `Our team replies within ${RESPONSE_HOURS} hours`, d: "You get a confirmation email straight away, and a reply from our team about your quote." },
];

export const CREATOR_FAQS: readonly (readonly [string, string])[] = [
  ["What counts as a verified contact?", "A verified contact is a creator contact detail our team has checked before delivery. When we confirm your quote we tell you which contact fields are included and what checks were applied. Not every creator in the database has an available verified contact, which is why we confirm availability before you pay anything."],
  ["Can I target specific countries?", "Yes. Name a country, several countries or a region in the form. We confirm how many verified contacts are available for that location when we reply."],
  ["Which platforms are supported?", "The form lists Instagram, TikTok, YouTube, X (Twitter), Facebook, Twitch, LinkedIn, Pinterest and Snapchat, plus an Other option. Availability differs by platform and niche, so our reply confirms what we can build for your selection."],
  ["Can I filter by follower count?", "Yes. Choose a range in the form, from 1K to 10K up to 1M and above, or pick mixed if you are not sure yet."],
  ["How is pricing calculated?", `$${PRICE_PER_VERIFIED_CONTACT_USD.toFixed(2)} per verified influencer contact, multiplied by the number of contacts you request. 5,000 contacts is an estimated $500. We do not add discounts or minimum charges to the estimate. The final quantity and total are confirmed by our team once availability is checked.`],
  ["What happens after I submit?", `Your request is saved and we email you a confirmation with an inquiry ID. Our team reviews your requirements and replies within ${RESPONSE_HOURS} hours with a confirmed quote. Submitting the form does not charge you or create an order.`],
  ["Can I request a sample?", "Yes. Mention it in the notes field. In our reply we tell you what we can share for your criteria before you decide."],
  ["How quickly will I hear back?", `We aim to reply within ${RESPONSE_HOURS} hours of your submission. That is the time to our reply about your quote, not the delivery time of a finished list.`],
];
