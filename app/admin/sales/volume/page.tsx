import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { loadSalesSettings } from "@/lib/sales/settings";
import { VolumeForm } from "../forms";

export const dynamic = "force-dynamic";
export default async function VolumePage() {
  await guardAdmin();
  const { volume } = await loadSalesSettings(getCloudflareContext().env);
  return (<><PageHeader title="Volume Discounts" text="Buy More, Save More. The discount depends on how many different databases are in the cart." />
    <Panel title="Settings"><VolumeForm v={volume} /></Panel>
    <Panel title="How it is applied" className="mt-6"><ul className="list-disc space-y-1 p-5 pl-9 text-sm"><li>Counted: distinct databases (the same list twice counts once). Excluded products and categories do not count and get no discount.</li><li>Applies to catalog lists only; custom lists are quoted separately.</li><li>A partner code applies alone. Other codes or promotions replace this discount unless stacking is on.</li><li>The crypto amount is calculated from the discounted total on the server.</li></ul></Panel></>);
}
