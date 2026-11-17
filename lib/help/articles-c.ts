import type { HelpArticle } from "./types";

export const articlesC: readonly HelpArticle[] = [
  // ---------- Custom list ----------
  {
    category: "custom-list", slug: "request-a-custom-list",
    title: "How to request a custom business contact list",
    description: "Fill in the custom list form with your industry, place, quantity and fields.",
    keywords: ["custom list", "request", "build", "form", "special", "not listed"],
    body: [
      ["ol", ["Open the [custom list builder](/custom-list).", "Choose an industry and a country, and add a state or city if you need one.", "Enter how many contacts you want and the fields you need.", "Add your email address and any notes, then send the request."]],
      ["p", "A request is not an order and nothing is charged. We reply by email after checking whether we can source it."],
    ],
    related: ["custom-list/select-industries-and-locations", "custom-list/what-happens-after-request", "getting-started/ready-made-vs-custom"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "custom-list", slug: "select-industries-and-locations",
    title: "Selecting industries and locations",
    description: "Be specific: an industry plus a state or city gives the clearest request.",
    keywords: ["industry", "location", "state", "city", "country", "target"],
    body: [
      ["p", "The more specific the request, the easier it is for us to say whether we can source it."],
      ["ul", ["Name the industry in plain words, for example a type of shop or service.", "Add the state or city you want. Leave it empty for the whole country.", "Mention any size or type limits in the notes."]],
      ["p", "Not sure what exists? Browse the [lists page](/lists) first."],
    ],
    related: ["custom-list/request-a-custom-list", "custom-list/data-fields", "products/industries-and-coverage"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "custom-list", slug: "data-fields",
    title: "Choosing required data fields",
    description: "Tick the fields you need, such as email, phone or website.",
    keywords: ["fields", "columns", "email", "phone", "website", "job titles"],
    body: [
      ["p", "In the form you choose which fields you want in the file. Our standard fields are business name, address, city, country, phone, email and website."],
      ["p", "If you need something else, such as specific job titles, say so in the form or the notes. We tell you in our reply whether it is possible."],
    ],
    related: ["products/whats-in-a-list", "custom-list/request-a-custom-list", "custom-list/number-of-contacts"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "custom-list", slug: "number-of-contacts",
    title: "Requesting a specific number of contacts",
    description: "Enter the quantity you want. We reply with what we can source.",
    keywords: ["quantity", "number", "how many", "size", "contacts"],
    body: [
      ["p", "Enter the number of contacts you want in the quantity field. It is a target, not a promise. The number of businesses that match depends on the industry and place."],
      ["p", "If we can source fewer than you asked for, we tell you in our reply before you pay anything."],
    ],
    related: ["custom-list/request-a-custom-list", "products/record-counts", "custom-list/how-quotes-work"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "custom-list", slug: "how-quotes-work",
    title: "How custom quotations work",
    description: "We reply by email after checking your request. Nothing is charged for a request.",
    keywords: ["quote", "quotation", "price", "custom price", "cost"],
    body: [
      ["p", "A custom list request does not show a price, because we first need to check whether we can source what you asked for."],
      ["ol", ["You send the request.", "We review it and reply by email.", "If we can source it, we tell you what we can deliver. You decide whether to go ahead."]],
      ["p", "No payment details are asked for a request."],
    ],
    related: ["custom-list/what-happens-after-request", "pricing/one-time-purchases", "custom-list/number-of-contacts"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "custom-list", slug: "what-happens-after-request",
    title: "What happens after submitting a request?",
    description: "We save your request and reply by email once we have checked it.",
    keywords: ["after request", "submitted", "reply", "response", "status"],
    body: [
      ["p", "When you send a request, it is saved and our team is notified. Success is only shown after it is saved."],
      ["p", "We then check whether we can source it and reply to the email address you entered. You do not need an account to follow up: [contact us](/contact) from the same address."],
    ],
    related: ["custom-list/how-quotes-work", "custom-list/request-a-custom-list", "troubleshooting/contact-support"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },

  // ---------- Privacy ----------
  {
    category: "privacy-compliance", slug: "responsible-use",
    title: "Responsible use of business contact data",
    description: "Use lists for lawful business outreach and honour opt-outs.",
    keywords: ["lawful use", "responsible", "spam", "acceptable use", "rules"],
    body: [
      ["p", "Lists are for legitimate business outreach that follows the laws of your country and of the person you contact, such as sales, partnerships, recruiting and market research."],
      ["ul", ["Do not send spam or break anti-spam laws.", "Do not use the data for fraud, phishing, harassment or unlawful processing.", "Do not resell or publish the file outside the licence.", "If someone asks you to stop, stop and keep them on your own suppression list."]],
      ["p", "Read the full [lawful use policy](/legal/lawful-use)."],
    ],
    related: ["privacy-compliance/can-spam", "privacy-compliance/data-removal", "privacy-compliance/gdpr-considerations"],
  },
  {
    category: "privacy-compliance", slug: "gdpr-considerations",
    title: "GDPR considerations",
    description: "Our lists currently cover United States businesses only. People can ask to be removed.",
    keywords: ["gdpr", "eu", "uk", "europe", "data protection", "legitimate interest"],
    body: [
      ["p", "Our current lists cover businesses in the United States. We do not sell lists of EU or UK businesses at the moment, and we will publish the rules before we start."],
      ["p", "People can ask to see, correct or delete data about them, or to stop us using it. The quickest way is the [opt-out page](/opt-out). Read the [GDPR page](/legal/gdpr) for the details."],
      ["note", "This is a summary, not legal advice. Check the rules that apply to your own outreach with a lawyer."],
    ],
    related: ["privacy-compliance/data-removal", "privacy-compliance/data-sources", "privacy-compliance/responsible-use"],
  },
  {
    category: "privacy-compliance", slug: "can-spam",
    title: "CAN-SPAM considerations",
    description: "As the sender, you must follow CAN-SPAM when you email US contacts.",
    keywords: ["can-spam", "unsubscribe", "email law", "us law", "sender duties"],
    body: [
      ["p", "We sell data and do not send marketing email for you. When you email contacts in the United States, you are the sender and CAN-SPAM applies to you."],
      ["ul", ["Use accurate From and Reply-To details and a subject line that matches the content.", "Include your valid postal address.", "Give a clear way to opt out and honour it promptly.", "You are responsible for emails sent on your behalf."]],
      ["p", "Read the [CAN-SPAM page](/legal/can-spam). It is a summary, not legal advice."],
    ],
    related: ["privacy-compliance/responsible-use", "privacy-compliance/data-removal", "privacy-compliance/gdpr-considerations"],
  },
  {
    category: "privacy-compliance", slug: "privacy-policy",
    title: "Privacy policy",
    description: "What we collect from visitors and buyers, and what we do not do.",
    keywords: ["privacy", "personal data", "cookies", "tracking", "policy"],
    body: [
      ["p", "In short: we collect your order email, payment details such as the transaction hash, and what you type into our forms. We never receive card details."],
      ["p", "We do not run advertising trackers. Our analytics are cookie-free. Read the full [privacy policy](/legal/privacy) and the [cookie policy](/legal/cookies)."],
    ],
    related: ["privacy-compliance/data-removal", "privacy-compliance/gdpr-considerations", "privacy-compliance/data-sources"],
  },
  {
    category: "privacy-compliance", slug: "data-removal",
    title: "Data removal requests",
    description: "Use the opt-out page. Removed addresses are left out of future files.",
    keywords: ["opt out", "remove", "delete", "suppression", "unsubscribe", "data removal"],
    body: [
      ["p", "Anyone can ask to be removed. Use the [opt-out page](/opt-out) and enter the email address or domain to remove."],
      ["p", "Removals are added to our suppression list and applied to files we deliver afterwards. We aim to act within 30 days."],
    ],
    related: ["privacy-compliance/gdpr-considerations", "privacy-compliance/responsible-use", "privacy-compliance/privacy-policy"],
  },
  {
    category: "privacy-compliance", slug: "data-sources",
    title: "Data sources and processing policies",
    description: "Our team collects data from public sources, verifies it in-house and re-verifies it every 60 days.",
    keywords: ["sources", "where data comes from", "google maps", "registries", "directories", "processing"],
    body: [
      ["p", "Our team collects raw data from business listings such as Google Maps, company websites, public government registries, directories, licensed providers, public professional profiles, surveys and our own research."],
      ["p", "We then add missing details, verify emails with in-house SMTP checks and organise the data. All data is re-verified every 60 days. See the [data sources page](/data-sources)."],
    ],
    related: ["data-quality/how-we-verify-data", "privacy-compliance/gdpr-considerations", "privacy-compliance/privacy-policy"],
  },

  // ---------- Troubleshooting ----------
  {
    category: "troubleshooting", slug: "search-not-relevant",
    title: "Search isn't returning relevant lists",
    description: "Use fewer words, an industry plus a place, or send a custom list request.",
    keywords: ["search", "no results", "not found", "relevant", "cannot find list"],
    body: [
      ["p", "Our search checks the real catalog, so it only shows lists that exist."],
      ["ul", ["Try an industry and a place, such as a type of business and a state.", "Use fewer or simpler words.", "Check the close alternatives, which are shown separately.", "Browse the [lists page](/lists)."]],
      ["p", "Still nothing? [Request a custom list](/custom-list)."],
    ],
    related: ["getting-started/find-your-ideal-list", "products/list-unavailable", "custom-list/request-a-custom-list"],
    cta: { label: "Build a custom list", href: "/custom-list" },
  },
  {
    category: "troubleshooting", slug: "download-link-not-working",
    title: "My download link isn't working",
    description: "Copy the full link, try another browser, then contact us with your order ID.",
    keywords: ["link broken", "not working", "download error", "expired link"],
    body: [
      ["ol", ["Copy the whole link from the email and open it in a new tab.", "Try another browser or device.", "Switch off any VPN or blocker, then try again."]],
      ["p", "If it still fails, [contact us](/contact) with your order ID. We can send a new link."],
    ],
    related: ["delivery/download-issues", "delivery/access-your-file-again", "troubleshooting/contact-support"],
  },
  {
    category: "troubleshooting", slug: "no-delivery-email",
    title: "I haven't received my delivery email",
    description: "Check that the payment is confirmed, then spam folders and the email address you entered.",
    keywords: ["no email", "not received", "missing email", "delivery email", "spam"],
    body: [
      ["ol", ["Check that your payment is confirmed. The email is sent only after confirmation.", "Look in spam, promotions and other folders.", "Check you are using the address typed at checkout.", "Delivery is mostly instant. In some cases it can take up to 12 hours at most."]],
      ["p", "Still nothing? [Contact us](/contact) with your order ID and we will check the order and send it again."],
    ],
    related: ["pricing/after-payment", "delivery/download-your-list", "troubleshooting/payment-not-confirmed"],
  },
  {
    category: "troubleshooting", slug: "payment-not-confirmed",
    title: "My payment isn't showing as confirmed",
    description: "Check the amount, address and network, then submit your transaction hash.",
    keywords: ["payment not confirmed", "stuck", "pending", "tx hash", "not showing"],
    body: [
      ["ol", ["Look up your transaction in a block explorer and check it has confirmations.", "Check you sent the exact amount, to the right address, on the right network.", "On the checkout page, use \"I already paid\" and submit the transaction hash."]],
      ["p", "We check the transaction and reply by email. Read [what to do when a payment is pending](/help/payments/pending-payment)."],
    ],
    related: ["payments/pending-payment", "payments/payment-fails", "payments/billing-support"],
  },
  {
    category: "troubleshooting", slug: "request-assistance",
    title: "How to request assistance",
    description: "Send a message with your order ID and a short description.",
    keywords: ["help", "assistance", "support request", "problem", "ticket"],
    body: [
      ["p", "Use the [contact page](/contact). The more detail you give, the faster we can help."],
      ["ul", ["Your order ID, if you have one", "What you were trying to do", "What happened, including any message you saw"]],
    ],
    related: ["troubleshooting/contact-support", "payments/billing-support", "delivery/wrong-file"],
  },
  {
    category: "troubleshooting", slug: "contact-support",
    title: "How to contact BeigeLeads support",
    description: "Use the contact form. We reply by email.",
    keywords: ["contact", "support", "email", "reach us", "message"],
    body: [
      ["p", "Send a message through the [contact page](/contact). We reply to the email address you enter."],
      ["p", "For a refund or replacement claim, contact us within 30 days of delivery. We aim to answer claims within 3 working days. Read the [Refund & Returns policy](/legal/refund-replacement)."],
    ],
    related: ["troubleshooting/request-assistance", "payments/billing-support", "payments/refunds-and-replacements"],
  },
];
