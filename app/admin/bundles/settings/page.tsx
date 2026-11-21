import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel } from "@/components/admin/ui";
import { loadBuilderSettings } from "@/lib/bundles/settings";
import { gate } from "../gate";
import { BuilderForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bundle builder", robots: { index: false, follow: false } };
export default async function BuilderSettings() {
  await gate();
  const s = await loadBuilderSettings(getCloudflareContext().env);
  return (<><PageHeader title="Bundle builder" text="Build Your Own Bundle on /bundles. It uses the same Buy More, Save More discounts as the cart (edit them under Volume Discounts)." /><Panel className="p-5"><BuilderForm enabled={s.enabled} excluded={s.excluded.join("\n")} /></Panel></>);
}
