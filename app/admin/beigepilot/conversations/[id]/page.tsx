import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PageHeader, Panel, fmtDate } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { guardAdmin } from "@/lib/admin/guard";
import { getConversation } from "@/lib/beigepilot/history";
import { BpNav } from "../../nav";
import { deleteConversationAction } from "../../actions";

export const dynamic = "force-dynamic";
export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  await guardAdmin();
  const { id } = await params;
  const { conv, messages } = await getConversation(getCloudflareContext().env, id);
  if (!conv) notFound();
  return (
    <>
      <PageHeader title="Conversation" text={`${fmtDate(new Date(conv.startedAt * 1000))}${conv.page ? ` · started on ${conv.page}` : ""}`} actions={<form action={deleteConversationAction}><input type="hidden" name="id" value={conv.id} /><Button variant="secondary" type="submit">Delete this conversation</Button></form>} />
      <BpNav here="/admin/beigepilot/conversations" />
      <Panel className="max-w-3xl"><ul className="space-y-3 p-5">{messages.map((m) => (
        <li key={m.id} className={m.role === "user" ? "ml-10 rounded-2xl bg-forest-900 px-4 py-2.5 text-sand-50" : "mr-10 rounded-2xl bg-sand-100 px-4 py-2.5 text-forest-900"}>
          <p className="whitespace-pre-wrap text-sm">{m.text}</p>
          {m.role === "assistant" && <p className="mt-1 text-xs opacity-70">{m.provider} · {m.tokens} tokens{m.tools && ` · tools: ${m.tools}`}</p>}</li>))}</ul></Panel>
      <p className="mt-4"><Link href="/admin/beigepilot/conversations" className="text-sm font-semibold text-purple-700">Back to conversations</Link></p>
    </>
  );
}
