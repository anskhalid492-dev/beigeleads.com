import { notFound } from "next/navigation";
import { Empty, PageHeader, Panel } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { BpNav } from "../nav";

export const dynamic = "force-dynamic";
const LATER: Record<string, [string, string, string]> = {
  knowledge: ["Knowledge Base", "Phase 2", "Sync help articles, policies and your own answers, with restricted claims."],
  conversations: ["Conversations", "Phase 3", "Chats are not stored yet. History, search and retention rules come with Phase 3."],
  unanswered: ["Unanswered Questions", "Phase 2", "Questions BeigePilot could not answer, so you can add the missing knowledge."],
  leads: ["Leads & Handoffs", "Phase 2", "A handoff form with consent, saved for your team."],
  analytics: ["Analytics", "Phase 3", "Usage trends, satisfaction and top questions, from real data only."],
};
export default async function LaterSection({ params }: { params: Promise<{ section: string }> }) {
  await guardAdmin();
  const { section } = await params; const x = LATER[section]; if (!x) notFound();
  return (<><PageHeader title={x[0]} /><BpNav here={`/admin/beigepilot/${section}`} /><Panel><Empty title={`Coming in ${x[1]}`} text={x[2]} /></Panel></>);
}
