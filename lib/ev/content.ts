// Copy for /email-list-verification. Facts come from how the service really works (manual processing, limits, retention from the admin settings).
// No accuracy percentages, no turnaround promises, no reviews, no security certifications.
import type { EvSettings } from "./settings";

export const EV_TITLE = "Bulk Email List Verification Service | BeigeLeads";
export const EV_DESC = "Verify 5,000 to 1 million+ email addresses with BeigeLeads. Choose a package, securely upload your list, and receive organized verification results.";

export const EV_BENEFITS_HERO = [
  "Verify Emails from 5K to 1M Emails",
  "CSV, XLSX, and TXT supported",
  "Secure file submission",
  "Manual processing by our team",
  "Organized, downloadable results",
  "No customer account required",
];

export const EV_WHY: [string, string][] = [
  ["Identify invalid email addresses", "Addresses with a wrong format or a domain that cannot receive mail are flagged so you can remove them before sending."],
  ["Detect duplicates", "Repeated addresses are marked, so one person does not receive the same message several times."],
  ["Identify disposable domains", "Addresses on throwaway email services are separated from the rest of your list."],
  ["Highlight potentially risky addresses", "Addresses that need care, such as catch-all domains, are marked as risky instead of being treated as safe."],
  ["Improve list organization", "You receive your list sorted by result status, so it is easier to decide what to send, review or remove."],
  ["Reduce avoidable delivery problems", "Removing addresses that are clearly invalid can lower avoidable bounces. No verification can guarantee inbox placement."],
];

export const EV_STEPS: [string, string][] = [
  ["Choose Your Package", "Select a package based on the number of email addresses you need checked."],
  ["Complete Your Purchase", "Pay securely through BeigeLeads."],
  ["Paste or Upload Your List", "Submit your email addresses using our secure upload form."],
  ["Receive Your Results", "Our team manually processes your order and sends secure access to your completed files."],
];

export const EV_FORMATS: [string, string][] = [
  ["CSV", "Comma-separated files. We find the column that holds email addresses; if several look like emails, you choose."],
  ["XLSX", "Excel workbooks. We read the first worksheet. Spreadsheets can be up to 50 MB; save larger lists as CSV or TXT."],
  ["TXT", "Plain text with one email per line, or addresses separated by commas or semicolons."],
];

export const EV_STATUSES: [string, string, string][] = [
  ["Valid", "forest", "The address passed our checks. This is an estimate based on the checks available, not a guarantee of future delivery."],
  ["Invalid", "sand", "The address has a wrong format or a domain or mailbox that does not exist, so it is likely to bounce."],
  ["Risky", "purple", "The address may work but carries uncertainty, for example a catch-all domain. Send with care."],
  ["Unknown", "sand", "The mail server did not give a clear answer, so we cannot say either way."],
  ["Disposable", "sand", "The address belongs to a temporary or throwaway email service."],
  ["Duplicate", "sand", "The same address appears more than once in your file."],
];

export const EV_PRIVACY: [string, string][] = [
  ["Private file storage", "Lists are stored in private cloud storage. There are no public links and no public file listing."],
  ["Restricted access", "Only authorized BeigeLeads staff can open a submitted list, and each access is logged."],
  ["Secure submission", "Your upload link is unique to your paid order, and files are checked before they are accepted."],
  ["Authorized staff processing", "Your list is verified by our team for your order only."],
  ["Expiring download access", "Result downloads use short-lived links and require the email address used for the order."],
];

export function evFaqs(s: EvSettings): [string, string][] {
  const top = s.packages[s.packages.length - 1];
  const low = s.packages[0];
  const fmts = s.formats.map((f) => f.toUpperCase()).join(", ");
  return [
    ["What is email verification?", "Email verification checks a list of addresses before you send to them, so you can find invalid, duplicate, disposable and risky addresses and decide what to keep."],
    ["Is verification automatic?", "No. Our team processes every order manually, so results are not instant. You get an email when work starts and when your results are ready."],
    ["What file formats are supported?", `${fmts}. You can also paste addresses into the submission form.`],
    ["Can I paste emails instead of uploading?", "Yes. After purchase, choose Paste Emails and paste one address per line, or separate them with commas or semicolons. We save the text as a private file."],
    ["How many emails can I verify?", `Packages run from up to ${low.limit.toLocaleString("en-US")} emails to up to ${top.limit.toLocaleString("en-US")} emails. For larger lists, request a custom quote.`],
    ["Can I submit fewer emails than my package limit?", `Yes. Each package is a maximum. The ${low.name} package accepts lists from about 5,000 up to ${low.limit.toLocaleString("en-US")} emails, and smaller lists can use it too.`],
    ["What happens if I exceed the package limit?", "We reject the file and tell you the allowed count, how many you submitted and how many remain. We never silently cut a list. You can submit a smaller list, choose a larger package, or contact us."],
    ["How long does verification take?", "It depends on the size of the list and our queue, and we do not promise a fixed turnaround. We email you when processing starts and when results are ready."],
    ["How do I receive my results?", `We email a secure link to your order status page. Enter the email address used for the order to get short-lived download links. Results stay available for ${s.resultDownloadDays} days after completion.`],
    ["Can I submit multiple files?", "Yes, while your order is waiting for a list. All files together must stay within your package limit, so splitting a large list does not raise the limit."],
    ["Are duplicates counted toward my plan?", "Yes. Every email entry in your file counts toward the limit, duplicates included. Duplicates are marked in your results."],
    ["Is my data kept private?", `Files are stored privately and only opened by authorized staff for your order. Original files are deleted ${s.retainOriginalDays} days after the job is completed, and results ${s.retainResultDays} days after delivery.`],
    ["Can I verify more than 1M emails?", "Yes. Use the custom quote form on this page and tell us the estimated size. We reply by email with a quote."],
    ["Will verification guarantee zero bounces?", "No. Verification results are estimates based on the checks available at the time. They can lower avoidable bounces, but they cannot guarantee delivery or inbox placement."],
    ["Can I add verification when purchasing a database?", "Yes. If your cart has a database, you will see an optional offer to add a verification package. It is never required and is priced separately."],
    ["Do I need an account?", "No. You pay at checkout and receive a secure link by email. There is no customer account to create."],
    ["What happens if my uploaded file is invalid?", "We tell you why on the page, for example an unsupported type, no email column, a file that is too large or a count above your limit. The file is not stored and you can try again."],
    ["Can I submit a replacement file?", "Yes. If we ask for a different file, we email you a link and the reason. A new accepted file replaces the earlier one. Once processing has started, contact support before changing a list."],
  ];
}
