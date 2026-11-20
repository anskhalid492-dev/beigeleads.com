// All words for /partners. Only facts the owner stated (50% for approved partners, review within 7 days, one-time purchases,
// no subscription, no dashboard/referral/commission) and our existing policies. No prices, no counts, no testimonials.
export const PARTNER_HIGHLIGHTS = [
  "50% off every product for verified partners",
  "One-time database purchases",
  "No subscription or membership fees",
  "Access to the existing database catalog",
  "Application reviewed within 7 days",
] as const;

export const PARTNER_STEPS = [
  { title: "Apply", text: "Submit your business details." },
  { title: "We Review", text: "Our team reviews your application within 7 days." },
  { title: "Get Verified", text: "Approved partners receive their partner discount instructions." },
  { title: "Purchase & Resell", text: "Buy eligible BeigeLeads databases at 50% off, subject to partner terms." },
] as const;

export const PARTNER_FAQS: readonly (readonly [string, string])[] = [
  ["Who can apply to the data reseller program?", "Any business that buys business contact data for its own resale or client work can apply: marketing and lead generation agencies, sales and SDR teams, consultants, data resellers and brokers, and similar businesses. We review every application individually."],
  ["How long does approval take?", "We review applications within 7 days. The decision is emailed to the business email address you applied with. Until then, nothing changes on your account because no account is needed to buy."],
  ["What discount do approved partners get?", "Approved partners get 50% off every BeigeLeads database product and every package, as a personal partner code. Submitting an application does not grant a discount: only an approved partner receives a code."],
  ["How do I use my partner code?", "Add lists to your cart, open checkout, choose \"Approved data reseller partner? Add your code\", and enter your code together with the email address you applied with. The checkout total shows the discount before you pay."],
  ["Is there a membership fee or subscription?", "No. There are no membership fees and no subscriptions. Each list is a one-time purchase, paid in crypto at checkout like any other order."],
  ["Can I share my partner code?", "No. The code is tied to the approved partner's email address and only works for an order placed with that email. We can deactivate a code that is shared or misused."],
  ["Can I resell the data I buy?", "The standard BeigeLeads license covers your own lawful business use and does not by itself allow redistributing a file. If your plan involves reselling or sharing data, describe it in your application: we review it and confirm in writing what is allowed for your business. All use must follow our lawful use policy."],
  ["Can I combine the partner discount with other offers?", "No. One partner code applies per order and it is not combined with other promotions."],
  ["Does the discount apply to custom lists?", "The 50% partner code applies to ready-made lists bought through checkout. Custom list requests are quoted separately, so the code does not apply to them."],
  ["What happens if my application is declined?", "You will get an email with the decision. You can still buy any BeigeLeads database at its standard price, and you are welcome to apply again if your business changes."],
] as const;

/** Short, plain terms. Needs the owner's / lawyer's review before launch (see TODO-BEFORE-LAUNCH.md). */
export const PARTNER_TERMS: readonly string[] = [
  "The partner discount is 50% off the list price of ready-made BeigeLeads databases bought through checkout. It is available only after your application is approved.",
  "Your partner code is personal. It works only with the business email address on your approved application and may not be shared or sold.",
  "One code applies per order and cannot be combined with other promotions. Custom list requests are quoted separately.",
  "Every purchase is a one-time purchase. There are no membership fees and no subscriptions.",
  "Data bought through the program remains subject to the BeigeLeads lawful use policy and refund and replacement policy. Resale or redistribution of data is allowed only as confirmed to you in writing at approval.",
  "We may decline an application, and we may deactivate a code if it is misused, shared, or if these terms are not followed.",
];
