import Link from "next/link";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
const items = [
  ["Volume Discounts", "/admin/sales/volume", "Buy More, Save More: tiers by number of distinct databases, exclusions, stacking."],
  ["Second Purchase Offer", "/admin/sales/reward", "Personal code after a first paid order: settings, issued codes, revoke, resend."],
  ["Team Purchase Requests", "/admin/sales/team", "Approval requests from team members to managers: status, resend, cancel."],
  ["Email Templates", "/admin/system-emails", "Edit, preview and test-send the reward emails (category Sales Features)."],
  ["Email Delivery Logs", "/admin/system-emails", "Open the Email activity tab for delivery status of every system email."],
];
export default async function SalesHome() {
  await guardAdmin();
  return (<><PageHeader title="Sales Features" text="Offers that raise order value and bring buyers back. All discounts are calculated on the server." />
    <div className="grid gap-4 sm:grid-cols-2">{items.map(([t, h, d]) => (<Link key={t} href={h}><Panel className="h-full p-5 hover:border-forest-500"><p className="font-bold text-forest-900">{t}</p><p className="mt-1 text-sm">{d}</p></Panel></Link>))}</div></>);
}
