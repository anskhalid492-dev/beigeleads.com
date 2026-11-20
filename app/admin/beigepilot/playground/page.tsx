import { PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { PROVIDER_IDS, PROVIDER_LABEL } from "@/lib/beigepilot/providers";
import { BpNav } from "../nav";
import { CASES } from "@/lib/beigepilot/cases";
import { AutoTests, Playground } from "./client";

export const dynamic = "force-dynamic";
export default async function PlaygroundPage() {
  await guardAdmin();
  return (<><PageHeader title="Testing & Playground" text="Ask BeigePilot anything and see exactly which tools it used. Nothing here is saved." /><BpNav here="/admin/beigepilot/playground" /><Playground providers={PROVIDER_IDS.map((id) => ({ id, label: PROVIDER_LABEL[id] }))} /><AutoTests cases={CASES.map((c) => ({ id: c.id, title: c.title, question: c.question }))} providers={PROVIDER_IDS.map((id) => ({ id, label: PROVIDER_LABEL[id] }))} /></>);
}
