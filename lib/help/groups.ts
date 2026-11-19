/** Built-in sub-groups inside each category (article slugs). Used only to seed the CMS and as the code fallback. */
export const HELP_GROUPS: Record<string, { title: string; slugs: string[] }[]> = {
  "getting-started": [
    { title: "The basics", slugs: ["what-is-beigeleads", "how-beigeleads-works", "do-i-need-an-account"] },
    { title: "Finding your list", slugs: ["find-your-ideal-list", "ready-made-vs-custom", "preview-data-before-purchase"] },
  ],
  products: [
    { title: "What you get", slugs: ["whats-in-a-list", "record-counts", "list-packages"] },
    { title: "Choosing", slugs: ["industries-and-coverage", "choose-the-right-list", "list-unavailable"] },
  ],
  pricing: [
    { title: "How pricing works", slugs: ["one-time-purchases", "no-subscription", "why-prices-differ", "understanding-packages"] },
    { title: "Buying", slugs: ["how-to-purchase", "after-payment"] },
  ],
  payments: [
    { title: "Paying", slugs: ["accepted-payment-methods", "how-payment-confirmation-works"] },
    { title: "When something is wrong", slugs: ["pending-payment", "payment-fails", "billing-support", "refunds-and-replacements"] },
  ],
  delivery: [
    { title: "Receiving your list", slugs: ["how-you-receive-your-list", "download-your-list", "file-formats"] },
    { title: "Problems", slugs: ["download-issues", "wrong-file", "access-your-file-again"] },
  ],
  "data-quality": [
    { title: "How we verify", slugs: ["how-we-verify-data", "email-verification", "data-freshness"] },
    { title: "Quality and samples", slugs: ["emails-become-outdated", "masked-sample-data", "report-data-quality"] },
  ],
  "custom-list": [
    { title: "Making a request", slugs: ["request-a-custom-list", "select-industries-and-locations", "data-fields", "number-of-contacts"] },
    { title: "After you send it", slugs: ["how-quotes-work", "what-happens-after-request"] },
  ],
  "privacy-compliance": [
    { title: "Using data responsibly", slugs: ["responsible-use", "can-spam", "gdpr-considerations"] },
    { title: "Privacy and sources", slugs: ["privacy-policy", "data-removal", "data-sources"] },
  ],
  troubleshooting: [
    { title: "Common problems", slugs: ["search-not-relevant", "download-link-not-working", "no-delivery-email", "payment-not-confirmed"] },
    { title: "Getting help", slugs: ["request-assistance", "contact-support"] },
  ],
};
