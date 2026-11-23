// Copy for /pricing. Every statement matches our published policies (CLAUDE.md sections 25, 33, 42):
// one-time purchase, crypto checkout, delivery mostly instant (up to 12 hours), unlimited downloads,
// CSV/Excel/TXT, replacement above 5% bounce, 30-day claim window. No prices or counts live here.

export const PRICE_FACTORS = [
  { icon: "users", t: "Number of contacts", d: "A bigger package holds more records, so it can cost more." },
  { icon: "briefcase", t: "Industry or specialization", d: "Some prospect groups take more work to find and check than others." },
  { icon: "map", t: "Geographic targeting", d: "A whole country and a single region are different files." },
  { icon: "list", t: "Available data fields", d: "Email, phone, website and address are not equally available for every prospect group." },
  { icon: "package", t: "Package size", d: "Each list page shows its own package sizes and the price of each." },
  { icon: "search", t: "Custom sourcing", d: "A list we have to build for you is quoted on its own." },
] as const;

export const BUY_STEPS = [
  { t: "Find your database", d: "Browse by industry, job title, contact type or location." },
  { t: "Preview available data", d: "Review the product details and request a masked sample where one is offered." },
  { t: "Choose your package", d: "Select the contact volume and the package price shown on the product page." },
  { t: "Pay once and receive your list", d: "Complete the one-time payment. We email your download link once the payment is confirmed." },
] as const;

export const PRICING_FAQS: readonly (readonly [string, string])[] = [
  ["Does BeigeLeads charge monthly fees?", "No. You pay once for each list you buy. There is no subscription, no recurring fee and no account."],
  ["Do I need to purchase credits?", "No. We do not sell credits or tokens. You buy a list, download the file and keep it."],
  ["Are all database prices the same?", "No. Each list has its own packages and prices, shown on its product page before you pay. Prices can depend on things like the number of contacts, the prospect group, the place and the fields included."],
  ["Can I preview a sample before purchasing?", "Yes. List pages show masked sample rows, and you can request a free sample by email. Sample files only ever contain masked data."],
  ["Can I choose different contact volumes?", "Where a list offers more than one package, each one has its own record count and price on the product page. Need a different size or place? Send a custom list request."],
  ["How will I receive my database?", "Once your payment is confirmed, we email your download link. Delivery is mostly instant and in some cases takes up to 12 hours at most. You can download the file as many times as you like, in CSV, Excel or TXT."],
  ["What payment methods are accepted?", "Crypto only. Checkout shows the coins that are open at that moment. We do not take card payments yet."],
  ["Can I request a custom database?", "Yes. Describe the industry, place and fields you need on the custom list page. It is a request, not an order, and we reply with what is possible and a quote. No custom price is promised in advance."],
  ["What happens if there is a problem with my purchase?", "Our Refund & Returns policy applies. If more than 5% of the emails bounce, we replace the bounced emails until the list is back to 95% verified, or refund in proportion in crypto. Contact us within 30 days of delivery with your order details and the bounce report."],
];
