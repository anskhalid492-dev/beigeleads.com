/** Sub-groups inside each category (article slugs). Articles not listed fall into "More". */
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

export function groupedArticles<T extends { slug: string }>(category: string, list: T[]): { title: string; items: T[] }[] {
  const groups = HELP_GROUPS[category] ?? [];
  const used = new Set<string>();
  const out = groups.map((g) => ({ title: g.title, items: g.slugs.map((s) => list.find((a) => a.slug === s)).filter((a): a is T => !!a) }));
  out.forEach((g) => g.items.forEach((a) => used.add(a.slug)));
  const rest = list.filter((a) => !used.has(a.slug));
  if (rest.length) out.push({ title: "More", items: rest });
  return out.filter((g) => g.items.length > 0);
}
