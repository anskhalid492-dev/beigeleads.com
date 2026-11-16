// NEEDS LAWYER REVIEW. Drafts written from how BeigeLeads is designed to operate (CLAUDE.md).
// "[TO CONFIRM: ...]" marks a fact or legal choice the owner or a lawyer must decide. Launch is
// blocked until every marker is resolved (see TODO-BEFORE-LAUNCH.md).

/** Date the current wording was published. Update whenever any legal text or the verification page changes. */
export const LEGAL_UPDATED = "2026-11-16";
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
        "Download records: when you download a file we keep the time and a hashed version of your IP address, so we can settle disputes.",
        "Anti-spam signals: our forms use Cloudflare Turnstile and a rate limit to block bots.",
      ] },
      { h: "What we do not do", p: ["We do not run advertising trackers. Our analytics (Cloudflare Web Analytics) are cookie-free. We do not sell data about our visitors and buyers."] },
      { h: "Why we use your data", p: ["To deliver what you ordered, to answer you, to keep the service secure, and to meet legal duties. Lawful basis under GDPR: [TO CONFIRM: contract, legitimate interests, legal obligation]."] },
      { h: "Who we share it with", p: ["Service providers that run the site: Cloudflare (hosting, storage, spam checks) and Resend (transactional email only; we never use it for marketing or cold email). [TO CONFIRM: full processor list]"] },
      { h: "How long we keep it", p: ["[TO CONFIRM: retention period for orders, form messages, download logs and payment records]"] },
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
      { h: "Licence", p: ["After payment you get a licence to use the file for your own business outreach, under our lawful use policy. [TO CONFIRM: reselling, sharing with clients, number of users, term of licence]"] },
      { h: "Orders and payment", p: [
        "Prices are in US dollars and paid in crypto. The coin amount is locked for 30 minutes when you start checkout. Crypto payments cannot be reversed, so read the crypto payment policy before you pay.",
        "An order is complete only when your payment is confirmed on the network.",
      ] },
      { h: "Delivery and refunds", p: ["Delivery is described in the delivery policy and problems with contacts in the refund and replacement policy."] },
      { h: "Acceptable use", p: ["You must follow the lawful use policy. We may refuse or stop service if you do not."] },
      { h: "Data accuracy", p: ["We verify every list and re-check data every 60 days, but no contact data is perfect. We do not promise any particular result, such as a reply rate or sales."] },
      { h: "Liability", p: ["[TO CONFIRM: limits on liability, warranty disclaimer, indemnity]"] },
      { h: "Governing law", p: ["[TO CONFIRM: governing law and where disputes are settled]"] },
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
      { h: "What we do", p: ["We replace the bounced emails with verified ones from the same list. If we cannot bring the list back to 95%, we [TO CONFIRM: credit or refund, and how much]."] },
      { h: "What is not covered", p: ["Bounces caused by misuse (for example sending from a blocked or brand-new domain), claims made after the claim window, lists that were shared or resold against the licence, and a lack of replies or sales."] },
      { h: "Refunds are paid in crypto", p: ["Because payments are crypto, any refund is sent in [TO CONFIRM: the coin you paid with or USDT] to an address you give us. Network fees and rate changes are explained in the crypto payment policy."] },
      { h: "Overpayments and late payments", p: ["If you overpay, we flag it and refund or credit the difference. If a payment arrives after the 30-minute quote has expired, we review it by hand and decide on a refund or a re-quote."] },
      { h: "How long it takes", p: ["We aim to answer within 3 working days of receiving your claim."] },
    ],
  },
  {
    slug: "delivery",
    title: "Delivery policy",
    summary: "How and when you get your list.",
    sections: [
      { h: "How delivery works", p: ["When your payment has enough confirmations, we email a secure download link to the address you gave at checkout. Nothing is sent before payment is confirmed."] },
      { h: "The download link", p: [
        "The link is valid for 72 hours and works up to 5 times. If it expires or you use up the downloads, contact us and we can issue a new one.",
        "Files are kept in private storage and are never publicly linked.",
      ] },
      { h: "The file", p: ["A CSV file that opens in Excel, Google Sheets and most email tools. The list page shows the fields it includes."] },
      { h: "Opt-outs are applied first", p: ["Before a file is created for you, we remove everyone on our suppression list, so people who opted out are not in it."] },
      { h: "What is in the email", p: ["Your invoice, a note on permitted use, a link to the refund and replacement policy, and a link to the opt-out page."] },
      { h: "Records", p: ["We log each download with the time and a hashed IP address to help settle disputes."] },
      { h: "Delivery time", p: ["[TO CONFIRM: usual time between confirmation and email]"] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie policy",
    summary: "Which cookies and similar technologies this site uses.",
    sections: [
      { h: "Short version", p: ["We use only what the site needs to work. We do not use advertising or tracking cookies, so there is no cookie banner. [TO CONFIRM after a cookie audit of the live site]"] },
      { h: "Analytics", p: ["We use Cloudflare Web Analytics, which does not use cookies and does not track you across sites."] },
      { h: "Security checks", p: ["Our forms use Cloudflare Turnstile to tell people from bots. [TO CONFIRM: any cookies or local storage Turnstile sets]"] },
      { h: "If this changes", p: ["If we ever add non-essential cookies, we will ask for your consent first and update this page."] },
    ],
  },
  {
    slug: "gdpr",
    title: "GDPR",
    summary: "How we treat the personal data in our lists under EU and UK data protection law.",
    sections: [
      { h: "Our role", p: ["For the business contact data in our database, we act as [TO CONFIRM: controller]. The contacts are business contacts at companies. Lawful basis: [TO CONFIRM: for example legitimate interests, with a written assessment]."] },
      { h: "Where the data comes from", p: ["From public listings, company websites, registries, directories, licensed providers, public professional profiles, surveys and our own research. The data sources page explains each, which also serves as the notice required when data is not collected from the person directly."] },
      { h: "Your rights", p: ["You can ask us to show what we hold about you, correct it, delete it, or stop using it. The quickest way is the opt-out page, which adds you to our suppression list. We apply it to every file we deliver afterwards. We aim to act within [TO CONFIRM: number of days]."] },
      { h: "Regions we serve", p: ["[TO CONFIRM: which EU and UK data we sell, to whom, and any restrictions or blocks at checkout]"] },
      { h: "Transfers and representative", p: ["[TO CONFIRM: international transfer mechanism, EU/UK representative if needed]"] },
      { h: "Complaints", p: ["You can complain to the data protection authority in your country."] },
    ],
  },
  {
    slug: "ccpa",
    title: "CCPA and CPRA",
    summary: "Your California privacy rights.",
    sections: [
      { h: "What we hold", p: ["Business contact details such as name, job title, business email, business phone and company details, gathered from the sources on our data sources page."] },
      { h: "Sale of information", p: ["Selling lists is our business, so we treat it as a sale of personal information. [TO CONFIRM: data broker registration and any required notice]"] },
      { h: "Your rights", p: ["California residents can ask to know what we hold, to delete it, to correct it, and to opt out of its sale. Use the opt-out page, which also adds you to our suppression list. We do not discriminate against you for using these rights."] },
      { h: "How we verify requests", p: ["[TO CONFIRM: verification steps and use of an authorised agent]"] },
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
      { h: "Not legal advice", p: ["This page is a summary. Check the law with your own lawyer. [TO CONFIRM]"] },
    ],
  },
  {
    slug: "casl",
    title: "CASL",
    summary: "Canada's anti-spam law and what it means if you email Canadian contacts.",
    sections: [
      { h: "Why it matters", p: ["Canada's anti-spam law is stricter than US law. In general, you need consent, express or implied, before you send a commercial message to a Canadian address."] },
      { h: "Our position", p: ["[TO CONFIRM: whether we sell Canadian contacts at launch, and with what limits]"] },
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
        "Resell, publish or share the file outside the licence. [TO CONFIRM: exact licence limits]",
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
      { h: "When this applies", p: ["Most of what we do is selling lists, where you receive data as your own controller. This agreement covers the cases where we process personal data on your behalf. [TO CONFIRM: whether a DPA is needed at launch, and who signs it]"] },
      { h: "Details of processing", p: ["Subject, purpose, kinds of data and duration: [TO CONFIRM]."] },
      { h: "Our commitments", p: ["We process only on your documented instructions, keep the data confidential, and delete or return it when the service ends. [TO CONFIRM]"] },
      { h: "Security", p: ["Files are held in private storage, download links are random and stored only as hashes, links expire, and access to the admin area is protected by Cloudflare Access with two-factor authentication. [TO CONFIRM: complete list of measures]"] },
      { h: "Sub-processors", p: ["Cloudflare (hosting and storage) and Resend (transactional email). [TO CONFIRM: complete list and notice of changes]"] },
      { h: "Incidents and audits", p: ["We will tell you without undue delay after we find a personal data breach that affects your data. [TO CONFIRM: notice period, audit rights, transfer clauses]"] },
    ],
  },
  {
    slug: "crypto-payments",
    title: "Crypto payment policy",
    summary: "How crypto checkout works, and what can go wrong.",
    sections: [
      { h: "Coins we accept", p: ["At launch: Bitcoin (BTC) and USDT on the TRON network (TRC20). We may add more later."] },
      { h: "Use the right network", p: ["Send each coin on the network checkout shows. USDT on any other network, such as Ethereum or BSC, will not reach us and cannot be recovered. Always check the network before you send."] },
      { h: "Exact amount and the 30-minute lock", p: [
        "Checkout shows an exact coin amount, converted from US dollars and locked for 30 minutes. The rate comes from public market data from several sources. If the sources disagree, or a stablecoin moves more than 2% from one dollar, checkout is paused.",
        "For USDT, each order has its own amount with small extra decimals (for example 49.0137). Send exactly that amount so we can match your payment.",
      ] },
      { h: "Confirmations", p: ["An order is paid once the payment has enough confirmations on the network: for BTC 2, or 3 for large orders, and for USDT TRC20 once the transaction is final. Your download link is sent after that."] },
      { h: "If the amount is wrong", p: [
        "Under by up to 1%: accepted. Under by more: the order is marked partial and checkout shows the amount still to pay.",
        "Over: we flag the extra for refund or credit.",
      ] },
      { h: "If you pay late", p: ["A payment that arrives after the quote has expired is reviewed by hand. We will decide whether to complete the order at the new rate or refund you. [TO CONFIRM: refund rules for late payments]"] },
      { h: "Payments cannot be reversed", p: ["Crypto transactions are final. You pay the network fee. If you sent a payment and checkout does not show it, use the form to submit your transaction hash and we will check it."] },
    ],
  },
];

export const legalBySlug = Object.fromEntries(legalDocs.map((d) => [d.slug, d])) as Record<string, LegalDoc>;
