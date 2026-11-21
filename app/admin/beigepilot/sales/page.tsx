import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getSettings } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";
import { SalesForm } from "./form";

export const dynamic = "force-dynamic";
export default async function SalesAssistantPage() {
  await guardAdmin();
  const { s } = await getSettings(getCloudflareContext().env);
  return (
    <>
      <PageHeader title="Sales Assistant" text="Choose what BeigePilot may do for shoppers: find databases, add them to the cart, shop by budget and hand over to the support team. Products and prices always come from the real catalog." />
      <BpNav here="/admin/beigepilot/sales" />
      <div className="max-w-3xl"><SalesForm s={s.sales} /></div>
    </>
  );
}
