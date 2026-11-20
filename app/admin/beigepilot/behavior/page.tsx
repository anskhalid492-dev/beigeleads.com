import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getSettings } from "@/lib/beigepilot/store";
import { BpNav } from "../nav";
import { BehaviorForm } from "../providers/forms";

export const dynamic = "force-dynamic";
export default async function BehaviorPage() {
  await guardAdmin();
  const { s } = await getSettings(getCloudflareContext().env);
  return (<><PageHeader title="Appearance & Behavior" text="Switch the widget on or off and set how the assistant greets visitors." /><BpNav here="/admin/beigepilot/behavior" /><div className="max-w-3xl"><BehaviorForm enabled={s.enabled} greeting={s.greeting} instructions={s.instructions} /></div></>);
}
