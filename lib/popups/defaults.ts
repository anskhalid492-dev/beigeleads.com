import type { Campaign, Rules } from "./types";

const R = (o: Partial<Rules>): Rules => ({ pages: [], visitor: "any", minSeconds: 0, minScrollPct: 0, exitIntent: false, signal: null, minPages: 0, minProductViews: 0, maxImpressions: 2, cooldownHours: 24, dismissCooldownDays: 14, ...o });

/**
 * The 12 launch campaigns. They are saved as DRAFTS: nothing shows until an admin sets one live. Copy states only
 * what the site really does (see CLAUDE.md): no counts, no prices, no reviews, no urgency.
 */
export const DEFAULT_POPUPS: Campaign[] = [
  { id: "audience-discovery", name: "Prospect discovery", stage: "tofu", status: "draft", priority: 40, version: 1, format: "modal", block: "audience",
    headline: "Who Are You Trying to Reach?", body: "Pick an industry and a place. We will show the matching lists from our catalog, or help you request a custom one.",
    cta: { label: "Find My Leads", href: "/lists" }, secondary: null, rules: R({ pages: ["home"], visitor: "new", minSeconds: 20, minScrollPct: 30, maxImpressions: 1 }) },
  { id: "educational-discovery", name: "Educational discovery", stage: "tofu", status: "draft", priority: 35, version: 1, format: "slide", block: "guides",
    headline: "Better Prospecting Starts With Better Data.", body: "Practical guides on building lists, staying compliant and sending outreach that gets read.",
    cta: { label: "Explore Free Guides", href: "/blog" }, secondary: null, rules: R({ pages: ["blog"], minSeconds: 30, minScrollPct: 50, maxImpressions: 1, cooldownHours: 24 * 7 }) },
  { id: "first-time-help", name: "First-time visitor assistance", stage: "tofu", status: "draft", priority: 30, version: 1, format: "card", block: "steps",
    headline: "New to BeigeLeads? Start Here.", body: "Three ways to get a list: a ready-made list, a free masked sample first, or a custom list sourced for you.",
    cta: { label: "See How It Works", href: "/how-it-works" }, secondary: null, rules: R({ pages: ["home", "lists"], visitor: "new", minSeconds: 45, maxImpressions: 1 }) },
  { id: "sample-preview", name: "Sample preview", stage: "mofu", status: "draft", priority: 60, version: 1, format: "slide", block: "sample",
    headline: "See What's Inside Before You Buy.", body: "This is the kind of masked preview you get free. Emails and phone numbers are hidden so you can judge the format first.",
    cta: { label: "Try a Sample", href: "/sample?product={product_slug}" }, secondary: null, rules: R({ pages: ["product"], minSeconds: 25, minScrollPct: 40, maxImpressions: 2 }) },
  { id: "find-right-list", name: "Find the right list", stage: "mofu", status: "draft", priority: 45, version: 1, format: "card", block: "matcher",
    headline: "Not Sure Which List Fits?", body: "Tell us the industry and where you sell. We will point you to the closest list in the catalog.",
    cta: { label: "Find My List", href: "/lists" }, secondary: null, rules: R({ pages: ["lists"], minSeconds: 30, minPages: 3, maxImpressions: 1 }) },
  { id: "custom-audience", name: "Custom prospects", stage: "mofu", status: "draft", priority: 80, version: 1, format: "modal", block: "custom",
    headline: "Can't Find Your Ideal Prospects?", body: "We can check whether we can source it. Your search is carried over, so you do not start from zero.",
    cta: { label: "Build My List", href: "{custom_href}" }, secondary: null, rules: R({ signal: "search_noresults", maxImpressions: 3, cooldownHours: 1 }) },
  { id: "checkout-reassurance", name: "Checkout reassurance", stage: "bofu", status: "draft", priority: 65, version: 1, format: "nudge", block: "checkout",
    headline: "Your List. One Purchase. No Subscription.", body: "You pay once in crypto, no account needed. After payment is confirmed we email you the delivery link.",
    cta: { label: "Continue to Checkout", href: "{product_url}#pricing" }, secondary: null, rules: R({ pages: ["product"], minSeconds: 40, minScrollPct: 70, minProductViews: 1, maxImpressions: 1 }) },
  { id: "product-exit", name: "Product exit intent", stage: "bofu", status: "draft", priority: 55, version: 1, format: "modal", block: "sample",
    headline: "Still Deciding? Review the Data First.", body: "Look at a masked sample of this list. It is free and needs no payment details.",
    cta: { label: "View Sample", href: "/sample?product={product_slug}" }, secondary: null, rules: R({ pages: ["product"], exitIntent: true, minSeconds: 15, maxImpressions: 1, cooldownHours: 24 * 3 }) },
  { id: "purchase-assistance", name: "Purchase assistance", stage: "bofu", status: "draft", priority: 50, version: 1, format: "card", block: "help",
    headline: "Have a Question Before You Buy?", body: "Answers about payment, delivery and our replacement policy are in the Help Center.",
    cta: { label: "Get Answers", href: "/help-center" }, secondary: { label: "Contact us", href: "/contact" }, rules: R({ pages: ["product"], minSeconds: 60, minProductViews: 2, maxImpressions: 1 }) },
  { id: "download-assistance", name: "Download assistance", stage: "post", status: "draft", priority: 90, version: 1, format: "modal", block: "after",
    headline: "Your Data Is Ready. Here's What's Next.", body: "Payment is confirmed. Your delivery link is emailed to the address you used at checkout; delivery is usually instant and can take up to 12 hours.",
    cta: { label: "Where Is My Delivery Email?", href: "/help/delivery/how-you-receive-your-list" }, secondary: null, rules: R({ pages: ["checkout"], signal: "purchased", maxImpressions: 1, cooldownHours: 0 }) },
  { id: "getting-started", name: "Getting started", stage: "post", status: "draft", priority: 40, version: 1, format: "slide", block: "guides",
    headline: "Make the Most of Your New List.", body: "Guides on outreach and handling your data lawfully.",
    cta: { label: "Explore Guides", href: "/blog" }, secondary: null, rules: R({ pages: ["home", "blog", "help", "lists"], minSeconds: 20, maxImpressions: 1, cooldownHours: 24 * 14 }) },
  { id: "additional-lists", name: "Relevant additional lists", stage: "post", status: "draft", priority: 35, version: 1, format: "card", block: "related",
    headline: "Exploring Other Prospects?", body: "Other lists from the catalog.",
    cta: { label: "Browse Related Lists", href: "/lists" }, secondary: null, rules: R({ pages: ["home", "lists", "product"], minSeconds: 25, maxImpressions: 2, cooldownHours: 24 * 7 }) },
];
