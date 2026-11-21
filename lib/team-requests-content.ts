// Copy for /team-purchase-requests. Every statement describes what the Team Purchase Request feature
// really does today (lib/sales/team.ts, CLAUDE.md section 114). If the feature changes, change this file.
import { REMINDER_HOURS, REQUEST_DAYS } from "@/lib/sales/team-constants";

export const TPR_TITLE = "Team Purchase Requests | Get Manager Approval for Databases | BeigeLeads";
export const TPR_DESC =
  "Need manager approval to purchase business databases? Build your cart, send a secure purchase request, and let your manager approve and pay on BeigeLeads.";

export const TPR_STEPS = [
  { icon: "search", title: "Choose Your Databases", text: "Browse our database catalog and add the products your business needs to your cart." },
  { icon: "send", title: "Request Manager Approval", text: "Click “Request manager approval” in your cart, enter your manager’s email address, and send your request." },
  { icon: "check", title: "Your Manager Reviews & Pays", text: "Your manager receives an email with a secure link to review the selected databases, approve or decline, and pay at the normal checkout." },
  { icon: "mail", title: "Receive Your Databases", text: "Once the payment is confirmed, the delivery email with the download links goes to the manager who paid. They can pass the links on to you." },
] as const;

export const TPR_EMPLOYEE = [
  "Choose the databases you actually need.",
  "Nothing is charged to you: your manager pays.",
  "Send a clear request with the databases and a note.",
  "Get email updates when the request is approved, declined or paid.",
  "No account to create.",
];

export const TPR_MANAGER = [
  "Review the requested databases before paying.",
  "See the total cost and any discount that applies.",
  "Approve or decline with one click.",
  "Pay at the same secure checkout everyone else uses.",
  "Get a confirmation email once the payment is confirmed.",
];

export const TPR_BENEFITS = [
  { icon: "card", title: "No Shared Credit Cards", text: "Employees can request a purchase without needing access to company payment details." },
  { icon: "list", title: "Clear Purchase Details", text: "Managers see the selected databases and the total before they pay." },
  { icon: "lock", title: "Secure Checkout", text: "Payment is made through the existing BeigeLeads checkout. Every price is calculated on our server." },
  { icon: "bell", title: "Automatic Email Updates", text: "Requesters and managers get an email when the request is sent, approved, declined, expired or paid." },
] as const;

export const TPR_FAQS: readonly (readonly [string, string])[] = [
  ["Do I need a BeigeLeads account?", "No. There are no accounts on BeigeLeads. You create a request from your cart with your name and email, and your manager does not need to register either."],
  ["Does it cost extra to send a purchase request?", "No. Sending a request is free and BeigeLeads adds no fee. You only pay for the databases, and only if your manager approves and pays."],
  ["Can my manager decline the request?", "Yes. A manager can decline without paying, and can add a short reason that is passed on to you."],
  ["When will I receive the databases?", "After the payment is confirmed on the network, the delivery email with the download links is sent to the manager who paid. Delivery is mostly instant and can take up to 12 hours. The manager can forward the links to you, and we email you when the request is paid."],
  ["Can I request multiple databases at once?", "Yes. Add several databases to your cart and send them in one request. Your manager approves and pays one total."],
  ["Will volume discounts still apply?", "Buy More, Save More discounts are calculated from the databases in the cart and shown to your manager before they pay. Promo codes and reward codes are not carried into a team request."],
  ["How long does a purchase request remain valid?", `A request is valid for ${REQUEST_DAYS} days. The expiry date is shown in the email and on the review page. If your manager has not answered after ${REMINDER_HOURS / 24} days, they get one reminder email.`],
  ["Can my manager pay without creating an account?", "Yes. The manager opens the secure link, confirms the email address the request was sent to, and continues to the normal checkout. No account or dashboard is involved."],
];
