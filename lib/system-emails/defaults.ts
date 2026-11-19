import type { TemplateDef } from "./types";

const SIGN = "The BeigeLeads team";
const KEEP = "BeigeLeads is a one-time purchase. There are no subscriptions and no recurring charges.";

/**
 * Built-in templates. Code is the source of truth until an admin publishes an edited version; the published row in D1
 * then wins. "connected" means a real backend event sends it today (see CONNECTIONS in the admin Triggers tab).
 */
export const TEMPLATES: TemplateDef[] = [
  // ---- Customer emails with a real trigger -------------------------------------------------------------
  {
    key: "product_delivery", name: "Product delivery", audience: "customer", connection: "connected",
    event: "A paid order whose delivery link is ready (sent once per order, never before the link exists).",
    vars: ["first_name", "order_number", "product_name", "package_name", "records", "download_url"], required: ["download_url", "product_name"],
    content: {
      subject: "{{first_name}}, your {{product_name}} is ready to download",
      preheader: "Access your purchased BeigeLeads data.",
      heading: "Your list is ready!",
      blocks: [
        { t: "p", text: "Hi {{first_name}}," },
        { t: "p", text: "Your purchased **{{product_name}}** is ready. Use the button below to open your data. Files come as CSV, Excel or TXT." },
        { t: "kv", rows: [{ label: "Order:", value: "{{order_number}}" }, { label: "List:", value: "{{product_name}}" }, { label: "Package:", value: "{{package_name}}" }, { label: "Records:", value: "{{records}}" }] },
        { t: "p", text: "**Permitted use:** you may use this list for your own lawful business outreach. Please don't use it for spam, fraud, harassment or unlawful processing, and don't resell or publish it." },
        { t: "list", items: ["Lawful use policy: {{website_url}}/legal/lawful-use", "Replacement and refund policy: {{website_url}}/legal/refund-replacement", "Opt-out requests (people who ask to be removed from our data): {{website_url}}/opt-out"] },
      ],
      cta: { label: "Download My List", url: "{{download_url}}" },
      signoff: `If you have any difficulty opening your file, contact our support team and include your order number. Keep this email as your receipt.\n\nThank you for choosing BeigeLeads.\n${SIGN}`,
    },
  },
  {
    key: "sample_request_received", name: "Free sample request received", audience: "customer", connection: "connected",
    event: "Someone submits the free sample form (sent once per email and list).",
    vars: ["first_name", "product_name"], required: ["product_name"],
    content: {
      subject: "{{first_name}}, we've received your sample request",
      preheader: "Your BeigeLeads sample request is in review.",
      heading: "Your sample request is in!",
      blocks: [
        { t: "p", text: "Thanks for asking for a free sample. We have your request for:" },
        { t: "kv", rows: [{ label: "Requested sample:", value: "{{product_name}}" }] },
        { t: "p", text: "Our team will review it and send the sample to this email address. This message only confirms that we received your request. No sample has been sent yet, and you do not need to do anything else." },
        { t: "note", text: "Samples contain masked data only, so you can check the structure and fields before you buy anything." },
      ],
      cta: { label: "Browse available lists", url: "{{lists_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "custom_request_received", name: "Custom list request received", audience: "customer", connection: "connected",
    event: "Someone submits the custom list builder (sent once per identical request).",
    vars: ["first_name", "request_reference", "industry", "country", "quantity", "data_fields", "requirements"], required: ["request_reference"],
    content: {
      subject: "{{first_name}}, we're reviewing your custom list request",
      preheader: "Here's a summary of the audience you requested.",
      heading: "Let's find your ideal audience.",
      blocks: [
        { t: "p", text: "Thanks for telling us who you want to reach. We saved your request under reference **{{request_reference}}**." },
        { t: "kv", rows: [{ label: "Target industry:", value: "{{industry}}" }, { label: "Locations:", value: "{{country}}" }, { label: "Requested contacts:", value: "{{quantity}}" }, { label: "Data fields:", value: "{{data_fields}}" }, { label: "Special requirements:", value: "{{requirements}}" }] },
        { t: "p", text: "This is a request, not an order. Nothing has been charged, and no price or availability has been promised yet. Our team will check what we can source and email you with availability and pricing before you decide anything." },
        { t: "p", text: "To change something, reply to this email or use the contact page and mention your reference." },
      ],
      cta: { label: "Explore Available Lists", url: "{{lists_url}}" },
      signoff: `${KEEP}\n${SIGN}`,
    },
  },
  {
    key: "contact_received", name: "Contact form confirmation", audience: "customer", connection: "connected",
    event: "Someone sends the contact form (sent once per identical message).",
    vars: ["first_name", "request_reference", "inquiry_topic", "inquiry_subject"], required: ["request_reference"],
    content: {
      subject: "We've received your message, {{first_name}}",
      preheader: "Thank you for contacting BeigeLeads.",
      heading: "Thanks for getting in touch.",
      blocks: [
        { t: "p", text: "We saved your message and our team will read it." },
        { t: "kv", rows: [{ label: "Reference:", value: "{{request_reference}}" }, { label: "Topic:", value: "{{inquiry_topic}}" }, { label: "Subject:", value: "{{inquiry_subject}}" }] },
        { t: "p", text: "This email only confirms that we received your message. If you want to add something, reply to this email or write again on the contact page and mention your reference." },
        { t: "p", text: "For quick answers about delivery, payments and policies, the Help Center is the fastest place to look." },
      ],
      cta: { label: "Open the Help Center", url: "{{help_url}}" },
      signoff: SIGN,
    },
  },

  // ---- Customer emails written and ready, but no backend event sends them yet ---------------------------
  {
    key: "order_confirmation", name: "Order confirmation", audience: "customer", connection: "not_connected",
    connectionNote: "Orders have no customer name or order email yet. Needs a confirmed-order event.",
    event: "An order reaches a confirmed state.",
    vars: ["first_name", "order_number", "order_url", "product_name", "package_name", "order_total", "payment_status"], required: ["order_number", "product_name"],
    content: {
      subject: "{{first_name}}, your BeigeLeads order #{{order_number}} is confirmed",
      preheader: "Your order details and next steps are inside.",
      heading: "Thanks for your order, {{first_name}}!",
      blocks: [
        { t: "p", text: "Thank you for choosing BeigeLeads. We've received your order for **{{product_name}}**." },
        { t: "kv", rows: [{ label: "Order number:", value: "{{order_number}}" }, { label: "Product:", value: "{{product_name}}" }, { label: "Package:", value: "{{package_name}}" }, { label: "Total:", value: "{{order_total}}" }, { label: "Payment status:", value: "{{payment_status}}" }] },
        { t: "p", text: "We'll send your download details once payment and fulfilment are confirmed." },
      ],
      cta: { label: "View Order Details", url: "{{order_url}}" },
      signoff: `${KEEP}\n${SIGN}`,
    },
  },
  {
    key: "payment_received", name: "Payment received", audience: "customer", connection: "not_connected",
    connectionNote: "The payment watcher marks orders paid but does not email the buyer separately; delivery is the buyer's email today.",
    event: "A payment is verified on-chain.",
    vars: ["first_name", "order_number", "order_url", "product_name"], required: ["product_name"],
    content: {
      subject: "Payment confirmed: {{product_name}}",
      preheader: "Your payment has been verified successfully.",
      heading: "Payment received, {{first_name}}.",
      blocks: [
        { t: "p", text: "Your payment for **{{product_name}}** has been confirmed." },
        { t: "p", text: "We're preparing the delivery information for your order. Delivery is usually instant and, in some cases, can take up to 12 hours." },
        { t: "p", text: "There are no recurring subscription charges for this purchase." },
      ],
      cta: { label: "View Your Order", url: "{{order_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "payment_pending", name: "Payment pending", audience: "customer", connection: "not_connected",
    connectionNote: "Needs a pending-payment event with the buyer's email.",
    event: "An order is waiting for payment confirmation.",
    vars: ["first_name", "order_number", "order_url", "product_name", "order_total", "payment_status"], required: ["order_number"],
    content: {
      subject: "Payment pending for BeigeLeads order #{{order_number}}",
      preheader: "Your order is awaiting payment confirmation.",
      heading: "We're waiting for your payment to confirm.",
      blocks: [
        { t: "p", text: "Hi {{first_name}}, your order for **{{product_name}}** has not been confirmed as paid yet." },
        { t: "kv", rows: [{ label: "Order number:", value: "{{order_number}}" }, { label: "Total:", value: "{{order_total}}" }, { label: "Status:", value: "{{payment_status}}" }] },
        { t: "p", text: "Crypto payments need network confirmations, so this can take a little while after you send them. You don't need to do anything if you have already paid. We confirm automatically and email you the moment it is verified." },
        { t: "p", text: "If you paid and the status does not change, open your order and use the \"I already paid\" form, or contact us with your order number." },
      ],
      cta: { label: "View Your Order", url: "{{order_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "payment_failed", name: "Payment could not be confirmed", audience: "customer", connection: "not_connected",
    connectionNote: "Needs an expired/partial-payment event with the buyer's email.",
    event: "An order expired or was underpaid.",
    vars: ["first_name", "order_number", "order_url", "payment_status", "product_name"], required: ["order_number"],
    content: {
      subject: "We couldn't confirm payment for order #{{order_number}}",
      preheader: "Review your payment status and available options.",
      heading: "We couldn't confirm your payment.",
      blocks: [
        { t: "p", text: "Hi {{first_name}}, we could not confirm a matching payment for order **{{order_number}}** ({{product_name}})." },
        { t: "kv", rows: [{ label: "Current status:", value: "{{payment_status}}" }] },
        { t: "p", text: "This does not always mean something went wrong. A payment can be late, sent with a different amount than quoted, or still waiting for network confirmations. If you already sent a payment, we will review it manually; nothing is lost." },
        { t: "p", text: "Open your order to see the exact status, or contact us with your order number and the transaction ID so we can check it." },
      ],
      cta: { label: "View Your Order", url: "{{order_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "sample_delivery", name: "Free sample delivery", audience: "customer", connection: "not_connected",
    connectionNote: "Samples are prepared by hand and there is no \"sample fulfilled\" event or link field yet.",
    event: "A sample is marked fulfilled and has an authorised link.",
    vars: ["first_name", "product_name", "sample_url"], required: ["sample_url", "product_name"],
    content: {
      subject: "Your BeigeLeads sample for {{product_name}} is ready",
      preheader: "Review the available sample before purchasing.",
      heading: "Your sample is ready.",
      blocks: [
        { t: "p", text: "Hi {{first_name}}, the sample you asked for, **{{product_name}}**, is ready." },
        { t: "p", text: "The sample shows the structure and fields of the full list. Contact details in it are masked, so you can judge the format without receiving working contacts." },
      ],
      cta: { label: "View My Sample", url: "{{sample_url}}" },
      signoff: `If the full list fits what you need, you can buy it once and keep it. ${KEEP}\n${SIGN}`,
    },
  },
  {
    key: "custom_quote", name: "Custom quotation", audience: "customer", connection: "not_connected",
    connectionNote: "There is no approved-quotation record yet. A price is never generated automatically.",
    event: "An admin approves a quotation.",
    vars: ["first_name", "request_reference", "quote_summary", "quote_url"], required: ["quote_summary", "request_reference"],
    content: {
      subject: "Your custom B2B data quote is ready, {{first_name}}",
      preheader: "Review the available options for your requested audience.",
      heading: "Your custom quote is ready.",
      blocks: [
        { t: "p", text: "Thanks for your patience. We reviewed request **{{request_reference}}** and prepared the following quotation." },
        { t: "note", text: "{{quote_summary}}" },
        { t: "p", text: "If this matches what you need, reply to this email or use the link below and we will tell you how to complete the purchase. It is a single payment with no subscription." },
      ],
      cta: { label: "Review My Quote", url: "{{quote_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "category_request_received", name: "Category request received", audience: "customer", connection: "not_connected",
    connectionNote: "The category request form only alerts the owner today; there is no customer confirmation.",
    event: "Someone suggests a business category.",
    vars: ["first_name", "category_name"], required: [],
    content: {
      subject: "Your requested business category is under review",
      preheader: "We're reviewing your suggestion for BeigeLeads.",
      heading: "Thanks for the suggestion.",
      blocks: [
        { t: "p", text: "We received your request for the category **{{category_name}}**." },
        { t: "p", text: "We look at requests by checking whether we can source and verify that kind of data lawfully. We can't promise that a category will be added, but every request helps us decide what to build next." },
        { t: "p", text: "If you need a list for it sooner, the custom list builder lets you describe exactly who you want to reach." },
      ],
      cta: { label: "Build a custom list", url: "/custom-list" },
      signoff: SIGN,
    },
  },
  {
    key: "delivery_issue", name: "Delivery issue", audience: "customer", connection: "not_connected",
    connectionNote: "Failed deliveries alert the owner; no buyer notice is sent automatically.",
    event: "An admin confirms a delivery problem.",
    vars: ["first_name", "order_number", "delivery_issue", "order_url"], required: ["order_number"],
    content: {
      subject: "An update about your BeigeLeads order #{{order_number}}",
      preheader: "Important information about your order delivery.",
      heading: "An update on your delivery.",
      blocks: [
        { t: "p", text: "Hi {{first_name}}, we want to tell you about your order **{{order_number}}**." },
        { t: "p", text: "{{delivery_issue|There was a problem delivering your list.}}" },
        { t: "p", text: "We are working on it and will email you as soon as your list is on its way. You don't need to place a new order. If you would like to speak to us sooner, reply to this email and include your order number." },
      ],
      cta: { label: "Contact Support", url: "{{contact_url}}" },
      signoff: SIGN,
    },
  },
  {
    key: "refund_update", name: "Refund or replacement update", audience: "customer", connection: "not_connected",
    connectionNote: "There is no refund/replacement case record yet; cases are handled by hand.",
    event: "A refund or replacement case changes status.",
    vars: ["first_name", "request_reference", "case_status", "case_update"], required: ["request_reference", "case_status"],
    content: {
      subject: "Update on your BeigeLeads request #{{request_reference}}",
      preheader: "Here's the latest status of your request.",
      heading: "An update on your request.",
      blocks: [
        { t: "p", text: "Hi {{first_name}}, here is the latest on request **{{request_reference}}**." },
        { t: "kv", rows: [{ label: "Status:", value: "{{case_status}}" }] },
        { t: "p", text: "{{case_update}}" },
        { t: "p", text: "Outcomes follow our refund and replacement policy. A refund or replacement is only confirmed once we tell you it has been approved." },
      ],
      cta: { label: "Read the policy", url: "/legal/refund-replacement" },
      signoff: SIGN,
    },
  },

  // ---- Admin alerts (copy only: sending is never switched off by a template) ------------------------------
  ...([
    ["admin_new_order", "New order", "An order is created.", "[BeigeLeads] New order {{order_number}}", ["order_number", "product_name", "package_name", "order_total", "timestamp", "admin_url"], "Order {{order_number}} was created and is waiting for payment."],
    ["admin_payment_verified", "Payment verified", "A payment is verified on-chain.", "[BeigeLeads] Payment verified for order {{order_number}}", ["order_number", "product_name", "order_total", "timestamp", "admin_url"], "Payment for order {{order_number}} is verified. Delivery will be sent automatically if a link is set for this product."],
    ["admin_sample_request", "New sample request", "Someone requests a free sample.", "[BeigeLeads] New sample request: {{product_name}}", ["product_name", "request_reference", "timestamp", "admin_url"], "A new free sample was requested for {{product_name}}. Prepare it and mark it fulfilled."],
    ["admin_custom_request", "New custom list inquiry", "Someone submits the custom list builder.", "[BeigeLeads] New custom list request {{request_reference}}", ["request_reference", "industry", "country", "quantity", "timestamp", "admin_url"], "A custom list request needs review: {{industry}}, {{country}}, {{quantity}} contacts."],
    ["admin_contact", "New contact form message", "Someone sends the contact form.", "[BeigeLeads] New contact inquiry {{request_reference}}", ["request_reference", "inquiry_topic", "inquiry_subject", "timestamp", "admin_url"], "New message ({{inquiry_topic}}): {{inquiry_subject}}"],
    ["admin_delivery_failure", "Delivery failure", "A delivery email keeps failing.", "[BeigeLeads] Delivery FAILED for order {{order_number}}", ["order_number", "details", "timestamp", "admin_url"], "The delivery email for order {{order_number}} failed after several attempts. {{details}} Send it again from Delivery Links or contact the buyer."],
    ["admin_refund_request", "Refund or replacement request", "A buyer asks for a refund or replacement.", "[BeigeLeads] Refund or replacement request {{request_reference}}", ["request_reference", "order_number", "details", "timestamp", "admin_url"], "A buyer asked for a refund or replacement on order {{order_number}}. {{details}}"],
    ["admin_system_issue", "Critical system issue", "A health check or job fails.", "[BeigeLeads] System issue: {{details}}", ["details", "timestamp", "admin_url"], "Something needs attention: {{details}}"],
  ] as const).map(([key, name, event, subject, vars, line]): TemplateDef => ({
    key, name, audience: "admin", connection: "not_connected",
    connectionNote: "Current owner alerts still use their built-in text. Review the copy here before it is switched on.",
    event, vars: [...vars], required: [],
    content: {
      subject, preheader: "Action may be needed in the BeigeLeads admin.", heading: name,
      blocks: [
        { t: "p", text: line },
        { t: "kv", rows: ([["request_reference", "Reference:"], ["order_number", "Order:"], ["product_name", "Product:"], ["order_total", "Total:"], ["timestamp", "Time:"]] as const).filter(([k]) => (vars as readonly string[]).includes(k)).map(([k, label]) => ({ label, value: `{{${k}}}` })) },
      ],
      cta: { label: "Open in admin", url: "{{admin_url}}" },
      signoff: "No customer secrets are included in this alert.",
    },
  })),
];

export const getTemplate = (key: string) => TEMPLATES.find((t) => t.key === key);
