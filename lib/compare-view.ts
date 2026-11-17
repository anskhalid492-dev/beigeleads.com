// View helpers for comparison pages. Visible text never shows research notes: sentences the vendor's
// page did not state are dropped, and rows with nothing left are hidden. Source links stay in the data.
import { US, type Comparison, type Row } from "@/lib/compare-data";

const UNSTATED = /not stated/i;

export function cleanText(t: string): string {
  const parts = t.match(/[^.]+\.?(?:\s|$)/g) ?? [t];
  return parts.filter((p) => !UNSTATED.test(p)).join("").trim();
}

export function visibleRows(c: Comparison): Row[] {
  return c.rows
    .map((r) => ({ ...r, them: cleanText(r.them) }))
    .filter((r) => r.them.length > 0);
}

export function compareFaqs(c: Comparison): [string, string][] {
  const n = c.name;
  const rows = visibleRows(c);
  const model = rows[0]?.them ?? c.about;
  return [
    [`What is the difference between BeigeLeads and ${n}?`, `${c.about} BeigeLeads is a marketplace where you buy a ready-made list once, check a free masked sample first, and get the file by email link. ${US.coverage}`],
    ["Does BeigeLeads require a subscription?", `No. ${US.model} ${n === "subscription tools" ? "Nothing renews, so there is nothing to cancel." : `With ${n}, ${model.charAt(0).toLowerCase()}${model.slice(1)}`}`],
    ["Can I buy business contact lists with a one-time payment?", `Yes. Pick a list and a package, pay once in crypto, and the download link is emailed after the payment is confirmed. ${US.account}`],
    ["Can I preview BeigeLeads data before purchasing?", `Yes. ${US.sample} The sample is masked, so you can check the fields and layout without seeing working contact details.`],
    ["How does BeigeLeads pricing work?", `Each list has its own page with fixed packages, so you see the price of the list you want before checkout. There are no seats, credits or renewals. ${US.payment}`],
    ["Can I request a custom business contact list?", `Yes. If the list you need is not in the catalog, describe it on the custom list page and we reply by email after checking whether we can source it. Sending a request does not charge you. ${US.coverage}`],
    [`Which is better for agencies and sales teams, BeigeLeads or ${n}?`, `It depends on how you work. Choose ${n} if: ${c.chooseThem[0].replace(/\.$/, "").replace(/^You /, "you ")}. Choose BeigeLeads if: ${c.chooseUs[0].replace(/\.$/, "").replace(/^You /, "you ").replace(/^Your /, "your ")}.`],
    ["How do I get started with BeigeLeads?", "Browse the lists, open the one that fits, and request the free masked sample. When you are ready, choose a package and pay once. If you do not see your niche, request a custom list."],
  ];
}
