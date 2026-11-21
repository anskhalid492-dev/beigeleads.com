import type { TemplateDef } from "./types";

// DFY Outbound emails (section 123). Each is sent ONLY by a verified event (payment seen on the network, or an admin action that
// changes a real status). They never contain passwords, domain logins or promises of results.
const rows: [key: string, name: string, event: string, subject: string, heading: string, text: string, cta: string][] = [
  ["dfy_payment_confirmed", "DFY: payment confirmed", "A DFY payment is confirmed on the network.", "Your DFY Outbound Payment Is Confirmed", "Your payment is confirmed", "Thank you. Your {{package_name}} DFY Outbound payment is confirmed. Your order page below is private to you.", "Open Your Order Page"],
  ["dfy_onboarding_invite", "DFY: onboarding invitation", "Sent with payment confirmation: onboarding starts now.", "Next Step: Tell Us About Your Outbound", "Start your onboarding", "We need a few details to plan your outbound: who you sell to, what you offer and your compliance information. Never send passwords through the form or by email.", "Start Onboarding"],
  ["dfy_onboarding_submitted", "DFY: onboarding received", "The customer submits onboarding.", "We Received Your Onboarding Details", "Onboarding received", "Thanks. Our team will review your details and plan your infrastructure. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_infra_planning", "DFY: infrastructure planning started", "An admin moves the order to Infrastructure Planning.", "We Started Planning Your Infrastructure", "Infrastructure planning has started", "Our team started planning the domains and inboxes for your outbound. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_domains_done", "DFY: domain setup completed", "An admin marks domain setup as verified.", "Your Sending Domains Are Set Up", "Domain setup is complete", "Your sending domains have been set up and checked by our team. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_inboxes_done", "DFY: inbox setup completed", "An admin marks inbox setup as verified.", "Your Inboxes Are Set Up", "Inbox setup is complete", "Your inboxes are set up and will now be warmed up gradually. This is not instant. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_leads_done", "DFY: lead sourcing completed", "An admin marks lead sourcing/verification as completed.", "Your Lead List Is Ready for Review", "Lead sourcing is complete", "Your prospect list has been sourced and verified by our team. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_copy_ready", "DFY: copy ready for approval", "Sequence copy is submitted for the customer's approval.", "Your Outreach Copy Is Ready for Your Approval", "Your copy needs your approval", "We wrote your outreach sequence. Please review it and approve it or ask for changes. Nothing is sent until you approve.", "Review and Approve"],
  ["dfy_campaign_approved", "DFY: campaign approved", "The customer approves the copy.", "Your Campaign Copy Is Approved", "Approval received", "Thanks for approving your copy. Our team will confirm everything is ready before launch. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_campaign_launched", "DFY: campaign launched", "An admin starts the campaign after all launch checks pass.", "Your Campaign Has Launched", "Your campaign is live", "Your campaign has started. Sending is managed by our team and follows your approved plan. We cannot promise replies, meetings or revenue. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_report_available", "DFY: report available", "An admin publishes a report.", "Your Outbound Report Is Available", "A new report is available", "Your latest campaign report is on your order page.", "View Your Report"],
  ["dfy_renewal_reminder", "DFY: renewal reminder", "A renewal is due soon (about a week before).", "Your DFY Outbound Renewal Is Due Soon", "Your renewal is coming up", "Your {{package_name}} service renews on {{renewal_date}}. Renewals are paid manually in crypto: open your order page to pay. The service pauses if the renewal is not paid.", "Open Your Order Page"],
  ["dfy_ownership_ready", "DFY: ownership transfer ready", "An admin marks the transfer as ready.", "Your Infrastructure Transfer Is Ready", "Your transfer is ready", "The transfer of the agreed infrastructure is ready, subject to provider rules. We will never send passwords by email. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_ownership_done", "DFY: ownership transfer completed", "An admin marks the transfer as completed.", "Your Infrastructure Transfer Is Complete", "Your transfer is complete", "The agreed infrastructure has been transferred or registered under your ownership, subject to provider rules. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_payment_failed", "DFY: payment problem", "A renewal payment is overdue or a payment could not be matched.", "There Is a Problem With Your DFY Payment", "Your payment needs attention", "We could not confirm a payment for your {{package_name}} service. Your service may be paused until it is resolved. {{dfy_detail}}", "Open Your Order Page"],
  ["dfy_cancelled", "DFY: cancellation confirmed", "An admin confirms a cancellation.", "Your DFY Outbound Service Is Cancelled", "Your service is cancelled", "Your {{package_name}} DFY Outbound service has been cancelled. No further renewals will be invoiced. {{dfy_detail}}", "Open Your Order Page"],
];

export const DFY_TEMPLATES: TemplateDef[] = rows.map(([key, name, event, subject, heading, text, cta]): TemplateDef => ({
  key, name, audience: "customer", category: "DFY Outbound", canDisable: true, connection: "connected", event,
  vars: ["order_number", "package_name", "dfy_url", "dfy_detail", "renewal_date"], required: ["dfy_url"],
  content: {
    subject, preheader: heading + ". Your order page is private to you.", heading,
    blocks: [{ t: "p", text }, { t: "note", text: "Never share your private order link. BeigeLeads will never ask for passwords by email." }],
    cta: { label: cta, url: "{{dfy_url}}" }, signoff: "The BeigeLeads team",
  },
}));
