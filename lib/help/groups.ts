/** Built-in sub-groups inside each category (article slugs). Used only to seed the CMS and as the code fallback. */
export const HELP_GROUPS: Record<string, { title: string; slugs: string[] }[]> = {
  "getting-started": [
    { title: "The basics", slugs: ["what-is-beigeleads", "how-beigeleads-works", "do-i-need-an-account", "what-is-beigeleads-and-how-it-works", "purchasing-b2b-databases-guide"] },
    { title: "Finding your list", slugs: ["find-your-ideal-list", "ready-made-vs-custom", "preview-data-before-purchase", "find-the-right-business-database", "understanding-database-product-information"] },
    { title: "Support and Pilo", slugs: ["how-to-contact-beigeleads-support", "how-to-use-beigepilot-pilo"] },
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
  "b2b-databases": [
    { title: "What is in a database", slugs: ["what-information-is-included-in-a-b2b-database", "understanding-database-record-counts", "how-beigeleads-organizes-country-specific-databases", "understanding-industry-and-job-title-targeting"] },
    { title: "Quality and updates", slugs: ["what-does-verified-business-data-mean", "how-database-updates-and-refreshes-work", "understanding-data-accuracy-and-limitations", "how-to-request-a-custom-b2b-database"] },
  ],
  "orders-checkout": [
    { title: "Buying", slugs: ["step-by-step-checkout-guide", "accepted-payment-methods-and-processing", "how-discounts-and-promotional-codes-work", "what-to-do-when-a-payment-fails"] },
    { title: "After you pay", slugs: ["what-happens-after-you-complete-a-purchase", "how-to-find-your-order-confirmation", "how-to-access-purchased-database-files", "troubleshooting-download-problems"] },
  ],
  "email-verification": [
    { title: "Using the service", slugs: ["complete-guide-to-email-verification", "how-to-submit-an-email-list-for-verification", "how-long-does-email-verification-take", "how-to-download-your-verification-results"] },
    { title: "Results and limits", slugs: ["understanding-email-verification-results", "valid-invalid-risky-and-unknown-email-addresses", "common-email-verification-questions"] },
  ],
  "dfy-outbound": [
    { title: "The service", slugs: ["what-is-beigeleads-done-for-you-outbound", "comparing-starter-growth-and-scale-dfy-packages", "what-happens-after-purchasing-a-dfy-package", "what-is-the-optional-infrastructure-ownership-fee"] },
    { title: "How a campaign runs", slugs: ["understanding-dfy-lead-sourcing-and-verification", "how-dfy-email-sending-and-follow-ups-work", "understanding-sending-domains-and-inboxes", "how-dfy-campaign-copywriting-and-approvals-work", "understanding-dfy-campaign-reporting-and-performance"] },
  ],
  "account-support": [
    { title: "Privacy and security", slugs: ["how-beigeleads-protects-customer-downloads", "how-customer-information-is-used-and-protected", "understanding-terms-and-data-usage-responsibilities"] },
    { title: "Help with an order", slugs: ["request-help-with-an-existing-order", "how-refunds-cancellations-and-disputes-are-handled"] },
  ],
  "pilo-website": [
    { title: "Pilo", slugs: ["how-pilo-helps-you-choose-databases-and-services", "how-pilo-discounts-and-eligibility-rules-work"] },
    { title: "Website", slugs: ["how-to-use-beigeleads-ai-discovery-links-and-llms-txt"] },
  ],
  "custom-list": [
    { title: "Making a request", slugs: ["request-a-custom-list", "select-industries-and-locations", "data-fields", "number-of-contacts", "information-to-provide-for-a-custom-list"] },
    { title: "After you send it", slugs: ["how-quotes-work", "what-happens-after-request", "how-custom-database-requests-work", "how-custom-database-pricing-and-delivery-are-determined", "what-happens-if-custom-requirements-change"] },
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
