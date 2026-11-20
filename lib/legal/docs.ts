// Owner chose to publish without lawyer review (Nov 2026) and delegated the open details to the
// assistant. Wording is written from how BeigeLeads operates (CLAUDE.md) and is NOT lawyer-reviewed.

/** Date the current wording was published. Update whenever any legal text or the verification page changes. */
export const LEGAL_UPDATED = "2026-11-20";
export const formatLegalDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export type LegalSection = { h: string; p: string[] };
export type LegalDoc = { slug: string; title: string; summary: string; sections: LegalSection[] };

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy policy",
    summary: "What personal data BeigeLeads collects from visitors and buyers, why, and what you can do about it.",
    sections: [
      { h: "Who we are", p: ["BeigeLeads is operated by BeigeLeads LLC, 215 W Pershing Rd, Kansas City, MO 64108, United States. You can reach us through the contact page."] },
      { h: "What we collect from visitors and buyers", p: [
        "Order email: you give us an email address so we can send your download link. There are no accounts and no passwords.",
        "Payment data: the coin and network you pick, the amount, the receiving address and the transaction hash. We never receive bank card details.",
        "Forms: if you request a sample, send a message or ask for a category, we keep what you type and your email address.",
        "Help Center feedback: if you tell us an article was or was not helpful, we store that answer together with the article name. We do not store your email, IP address or a cookie with it.",
        "Help Center searches and views: when you search the Help Center we store the words you typed and how many articles matched, for up to 90 days, to find missing answers. We also count article views per day. This is stored without your IP address, email, account or a cookie. We ignore searches that look like an email address or a long number, so please do not type personal details into the search box.",
        "Data Reseller Partner applications: if you apply on the partner page we keep your full name, business name, business email, website, country, business type, how you plan to resell our data, the optional monthly volume and notes you add, the time you accepted the Partner Program Terms, and a reference number. We also keep our internal notes and decision (pending, under review, approved or declined). We use this only to review your application, to email you the decision, and to prevent duplicate applications. If you are approved we also keep your personal discount code, tied to your email address, and record the code and discount on any order you place with it. Applications are kept for 12 months after the decision; the code and discount on an order are kept with the order for 7 years.",
        "Anti-spam signals: our forms use Cloudflare Turnstile and a rate limit to block bots.",
        "Shopping cart: the lists you add to your cart are kept only in your own browser (local storage on your device), as a list name and package. We do not create an account or a server-side cart for you, and the browser never stores prices. Clearing your browser data empties the cart.",
        "Anonymous cart counters: when you add or remove a list, open the cart or start checkout, we count that event (the event type and the number of items) to understand where visitors drop out. The count is stored without your email, IP address, account or a cookie and is deleted after 90 days. We do not send these counters if your browser sends Do Not Track or Global Privacy Control.",
        "Pop-ups and on-site messages: to avoid showing you the same message again and again, your browser remembers on your device how many times a message was shown, closed or used, and a few actions such as having requested a sample or started checkout. This stays in your browser. We also count, anonymously, that a message was shown, clicked or closed (and the type of page), with no email, IP address, account or cookie, for up to 90 days. These counters are not sent if your browser sends Do Not Track or Global Privacy Control.",
      ] },
      { h: "What we do not do", p: ["We do not run advertising trackers. Our analytics (Cloudflare Web Analytics) are cookie-free. We never pass on data about our visitors and buyers."] },
      { h: "Why we use your data", p: ["To deliver what you ordered, to answer you, to keep the service secure, and to meet legal duties. Lawful bases under GDPR: contract (to deliver your order), legitimate interests (security and fraud prevention) and legal obligation (tax and accounting records)."] },
      { h: "Who we share it with", p: ["Service providers that run the site: Cloudflare (hosting, storage, spam checks) and Resend (transactional email only; we never use it for marketing or cold email)."] },
      { h: "How long we keep it", p: ["Orders and payment records are kept for 7 years for tax and accounting. Form messages and sample requests are kept for 12 months. After that they are deleted or anonymised."] },
      { h: "The business contact data we sell", p: ["The lists we sell contain business contact details. They are covered on the data sources page, the opt-out page and our GDPR, CCPA, CAN-SPAM and CASL pages."] },
      { h: "Your rights", p: ["Depending on where you live you may ask to see, correct or delete your data, or object to how we use it. Use the contact page, or the opt-out page if you want to be removed from our lists."] },
      { h: "Changes", p: ["We will post changes here and update the date at the top of the page."] },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    summary: "The rules for buying and using a BeigeLeads list.",
    sections: [
      { h: "Agreement", p: ["By placing an order or using this site you accept these terms and the policies they link to. If you do not accept them, do not order."] },
      { h: "What we sell", p: ["We sell digital contact lists as a one-time purchase. There is no subscription and no account. You receive a download file for the list and tier you paid for."] },
      { h: "Licence", p: ["After payment you get a licence to use the file for your own business outreach, under our lawful use policy. The licence is non-exclusive, non-transferable and has no end date. It covers your own organisation and its staff, and campaigns you run for clients on their behalf. You may not resell, publish or hand the file itself to anyone else."] },
      { h: "Orders and payment", p: [
        "Prices are in US dollars and paid in crypto. The coin amount is locked for 30 minutes when you start checkout. Crypto payments cannot be reversed, so read the crypto payment policy before you pay.",
        "An order is complete only when your payment is confirmed on the network.",
      ] },
      { h: "Delivery and refunds", p: ["Delivery is described in the delivery policy and problems with contacts in the refund and replacement policy."] },
      { h: "Acceptable use", p: ["You must follow the lawful use policy. We may refuse or stop service if you do not."] },
      { h: "Data accuracy", p: ["We verify every list and re-check data every 60 days, but no contact data is perfect. We do not promise any particular result, such as a reply rate or sales."] },
      { h: "Liability", p: ["Lists are provided as they are. No verification is perfect, and we do not promise sales, replies or any particular result. Our remedy for faulty data is the Refund & Returns policy. To the extent the law allows, our total liability for an order is limited to the amount you paid for it, and we are not liable for indirect or consequential loss. You agree to cover us against claims that arise from your use of a list in breach of the lawful use policy."] },
      { h: "Governing law", p: ["These terms are governed by the laws of the State of Missouri, United States. Disputes are settled in the state or federal courts located in Jackson County, Missouri."] },
      { h: "Changes", p: ["We may update these terms. The terms in force when you order apply to that order. Last updated: the date shown at the top of this page."] },
    ],
  },
  {
    slug: "refund-replacement",
    title: "Refund & Returns",
    summary: "What happens if too many emails in your list bounce: we replace them until the list is back at 95%.",
    sections: [
      { h: "Our promise", p: [
        "If more than 5% of the emails you send from a BeigeLeads list bounce, we replace the bounced emails with fresh, verified ones. We keep replacing them until the list is back to at least 95% verified and 95% accurate, which means a bounce rate of 5% or less.",
        "No verification is perfect, because some mail servers accept every address. That is why we stand behind the list with this replacement promise instead of claiming a perfect result.",
      ] },
      { h: "How the bounce rate is counted", p: ["Bounce rate is the number of emails that bounced divided by the number of emails sent from the list, as shown in the report from your email tool. Send from a properly set up domain and include the bounce report when you claim."] },
      { h: "How to claim", p: ["Contact us within 30 days of delivery with your order details and the bounce report from your email tool. We will check it against the list we delivered."] },
      { h: "What we do", p: ["We replace the bounced emails with verified ones from the same list. If we cannot bring the list back to 95%, we refund the price paid for the bounced emails, in proportion, in crypto."] },
      { h: "What is not covered", p: ["Bounces caused by misuse (for example sending from a blocked or brand-new domain), claims made after the claim window, lists that were shared or resold against the licence, and a lack of replies or sales."] },
      { h: "Refunds are paid in crypto", p: ["Because payments are crypto, any refund is sent in the coin you paid with, to an address you give us. Network fees are deducted from the refund, and rate changes are explained in the crypto payment policy."] },
      { h: "Overpayments and late payments", p: ["If you overpay, we flag it and refund or credit the difference. If a payment arrives after the 30-minute quote has expired, we review it by hand and decide on a refund or a re-quote."] },
      { h: "How long it takes", p: ["We aim to answer within 3 working days of receiving your claim."] },
    ],
  },
  {
    slug: "delivery",
    title: "Delivery policy",
    summary: "How and when you get your list.",
    sections: [
      { h: "How delivery works", p: ["When your payment has enough confirmations, we email a download link to the address you gave at checkout. Nothing is sent before payment is confirmed."] },
      { h: "The download link", p: ["You can download the file as many times as you like. If you lose the email, contact us and we can send the link again."] },
      { h: "The file", p: ["A file in CSV, Excel or TXT format that opens in Excel, Google Sheets and most email tools. The list page shows the fields it includes."] },
      { h: "Opt-outs are applied first", p: ["Before a file is created for you, we remove everyone on our suppression list, so people who opted out are not in it."] },
      { h: "What is in the email", p: ["Your invoice, a note on permitted use, a link to the refund and replacement policy, and a link to the opt-out page."] },
      { h: "Delivery time", p: ["Delivery is mostly instant once your payment has the required confirmations. In some cases it can take up to 12 hours at most."] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    summary: "Which cookies and similar technologies this site uses.",
    sections: [
      { h: "Short version", p: ["We use only what the site needs to work. We do not use advertising or tracking cookies, so there is no cookie banner."] },
      { h: "Analytics", p: ["We use Cloudflare Web Analytics, which does not use cookies and does not track you across sites."] },
      { h: "Local storage on your device", p: ["Besides cookies, the site uses your browser\u2019s local storage for your shopping cart and to remember which on-site messages you have already seen. This data stays on your device, is not used for advertising and is not shared with third parties. You can clear it in your browser settings at any time. See the privacy policy for the anonymous counters we keep."] },
      { h: "Security checks", p: ["Our forms use Cloudflare Turnstile to tell people from bots. Turnstile may keep a short-lived token in your browser to show that you passed the check. It is not used for advertising."] },
      { h: "If this changes", p: ["If we ever add non-essential cookies, we will ask for your consent first and update this page."] },
    ],
  },
  {
    slug: "gdpr",
    title: "GDPR",
    summary: "How we treat the personal data in our lists under EU and UK data protection law.",
    sections: [
      { h: "Our role", p: ["For the business contact data in our database, we act as controller. The contacts are business contacts at companies. Lawful basis: legitimate interests, supported by a written balancing assessment."] },
      { h: "Where the data comes from", p: ["From public listings, company websites, registries, directories, licensed providers, public professional profiles, surveys and our own research. The data sources page explains each, which also serves as the notice required when data is not collected from the person directly."] },
      { h: "Your rights", p: ["You can ask us to show what we hold about you, correct it, delete it, or stop using it. The quickest way is the opt-out page, which adds you to our suppression list. We apply it to every file we deliver afterwards. We aim to act within 30 days."] },
      { h: "Regions we serve", p: ["We sell business lists for the United States, the EU and the UK, and add more countries on request. Where the GDPR applies, the rights described on this page apply to the people in our lists."] },
      { h: "Transfers and representative", p: ["Our hosting provider, Cloudflare, runs a global network. Where data about EU or UK individuals is transferred, we rely on standard contractual clauses. Ask us through the contact page about our EU or UK representative arrangements."] },
      { h: "Complaints", p: ["You can complain to the data protection authority in your country."] },
    ],
  },
  {
    slug: "ccpa",
    title: "CCPA and CPRA",
    summary: "Your California privacy rights.",
    sections: [
      { h: "What we hold", p: ["Business contact details such as name, job title, business email, business phone and company details, gathered from the sources on our data sources page."] },
      { h: "Sale of information", p: ["Selling lists is our business, so we treat it as a sale of personal information. Where a state requires data brokers to register, we register before selling there and show the notices it requires."] },
      { h: "Your rights", p: ["California residents can ask to know what we hold, to delete it, to correct it, and to opt out of its sale. Use the opt-out page, which also adds you to our suppression list. We do not discriminate against you for using these rights."] },
      { h: "How we verify requests", p: ["We match the details in your request, such as your email address, against our records. You may use an authorised agent, who must give us your written permission."] },
    ],
  },
  {
    slug: "can-spam",
    title: "CAN-SPAM",
    summary: "What buyers must do when they email contacts from our lists in the United States.",
    sections: [
      { h: "Our role", p: ["We sell contact data. We do not send marketing email for you. The emails we send are transactional only, such as your download link."] },
      { h: "Your duties as a sender", p: [
        "Use accurate From, Reply-To and routing details, and a subject line that matches the content.",
        "Say clearly that the message is an advertisement where the law requires it, and include your valid physical postal address.",
        "Give a clear way to opt out, and honour opt-out requests promptly. The US law allows 10 business days at most.",
        "You are responsible for emails sent by anyone acting for you.",
      ] },
      { h: "Our suppression list", p: ["People who opt out with us are left out of future files. You must also keep your own do-not-contact list."] },
      { h: "Not legal advice", p: ["This page is a summary. Check the law with your own lawyer."] },
    ],
  },
  {
    slug: "casl",
    title: "CASL",
    summary: "Canada's anti-spam law and what it means if you email Canadian contacts.",
    sections: [
      { h: "Why it matters", p: ["Canada's anti-spam law is stricter than US law. In general, you need consent, express or implied, before you send a commercial message to a Canadian address."] },
      { h: "Our position", p: ["Yes, we sell lists that include Canadian businesses. You are responsible for having a valid basis to send under CASL before you email them."] },
      { h: "Your duties as a sender", p: ["Make sure you have a valid basis to send, identify yourself clearly, and include a working unsubscribe that you honour quickly."] },
      { h: "Not legal advice", p: ["Rules differ by case. Ask your own lawyer before you email Canadian contacts."] },
    ],
  },
  {
    slug: "lawful-use",
    title: "Lawful use policy",
    summary: "What you may and may not do with a BeigeLeads list.",
    sections: [
      { h: "You may", p: ["Use the data for legitimate business outreach that follows the laws of your country and the country of the person you contact, such as sales, partnerships, recruiting and market research."] },
      { h: "You may not", p: [
        "Send spam, or send messages that break CAN-SPAM, CASL, GDPR, PECR or any other law that applies.",
        "Commit fraud, run scams or phishing, or impersonate anyone.",
        "Harass, threaten or stalk anyone.",
        "Process the data unlawfully or use it to profile people in ways the law forbids.",
        "Resell, publish or share the file outside the licence. The licence limits are set out in the terms.",
      ] },
      { h: "Honour opt-outs", p: ["If someone asks you to stop, stop and keep them on your own suppression list."] },
      { h: "If you break these rules", p: ["We may refuse or cancel service, deny refunds and replacements, and report unlawful use where the law requires it."] },
    ],
  },
  {
    slug: "dpa",
    title: "Data processing agreement",
    summary: "The terms that apply where we process personal data for a customer.",
    sections: [
      { h: "When this applies", p: ["Most of what we do is selling lists, where you receive data as your own controller. This agreement covers the cases where we process personal data on your behalf. A data processing agreement is available on request for customers who need it. It is signed by BeigeLeads LLC and the customer."] },
      { h: "Details of processing", p: ["Subject: the contact records you give us. Purpose: only the service you ordered. Kinds of data: business contact details. Duration: until the job is delivered, then deleted within 30 days."] },
      { h: "Our commitments", p: ["We process only on your documented instructions, keep the data confidential, and delete or return it when the service ends."] },
      { h: "Security", p: ["Access to our admin area is protected by Cloudflare Access plus a second login with a password and a one-time code. Traffic uses HTTPS. Our public forms use Cloudflare Turnstile and are rate limited per IP. Delivery links are sent only to the email address given at checkout. We do not store payment card details, private keys or seed phrases."] },
      { h: "Sub-processors", p: ["Cloudflare (hosting and storage) and Resend (transactional email). We tell customers about changes by updating this page."] },
      { h: "Incidents and audits", p: ["We will tell you without undue delay after we find a personal data breach that affects your data. We will notify you within 72 hours of becoming aware of a breach. On reasonable written request, once a year, we will answer your audit questions. Transfers rely on standard contractual clauses where they apply."] },
    ],
  },
];

export const legalBySlug = Object.fromEntries(legalDocs.map((d) => [d.slug, d])) as Record<string, LegalDoc>;
