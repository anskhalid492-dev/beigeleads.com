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
  return (<><PageHeader title="Appearance & Behavior" text="Switch the assistant on or off and set its name, welcome message, personality, mascot motion and launcher position." /><BpNav here="/admin/beigepilot/behavior" /><div className="max-w-3xl"><BehaviorForm enabled={s.enabled} name={s.name} humor={s.humor} motion={s.motion} launcher={s.launcher} suggestions={s.suggestions.join("\n")} greeting={s.greeting} instructions={s.instructions} saveChats={s.saveChats} retentionDays={s.retentionDays} /></div></>);
}
