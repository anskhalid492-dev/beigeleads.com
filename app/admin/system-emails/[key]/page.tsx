import Link from "next/link";
import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, PageHeader } from "@/components/admin/ui";
import { guardAdmin } from "@/lib/admin/guard";
import { getDbFromEnv } from "@/lib/db";
import { getEmailSettings } from "@/lib/settings/email";
import { getTemplate } from "@/lib/system-emails/defaults";
import { getEditable, listVersions } from "@/lib/system-emails/store";
import { SYSTEM_KEYS, VARIABLES } from "@/lib/system-emails/variables";
import { Editor } from "./editor";

export const dynamic = "force-dynamic";

export default async function EditTemplate({ params }: { params: Promise<{ key: string }> }) {
  await guardAdmin();
  const { key } = await params;
  const def = getTemplate(key);
  if (!def) notFound();
  const env = getCloudflareContext().env;
  const db = getDbFromEnv(env);
  const [t, versions, settings] = await Promise.all([getEditable(db, key), listVersions(db, key), getEmailSettings(env)]);
  let tableReady = true;
  try { await env.DB.prepare("SELECT 1 FROM email_templates LIMIT 1").first(); } catch { tableReady = false; }
  const allowed = new Set([...def.vars, ...SYSTEM_KEYS]);
  const vars = VARIABLES.filter((v) => allowed.has(v.key)).map(({ key: k, label, description, example }) => ({ key: k, label, description, example }));
  return (
    <>
      <p className="mb-2 text-sm"><Link href="/admin/system-emails" className="underline">System Emails</Link> / {def.name}</p>
      <PageHeader title={def.name} text={def.event} actions={<div className="flex gap-2"><Badge tone={def.audience === "customer" ? "info" : "mute"}>{def.audience === "customer" ? "Customer email" : "Admin alert"}</Badge><Badge tone={def.connection === "connected" ? "good" : "warn"}>{def.connection === "connected" ? "Connected" : "Not connected"}</Badge></div>} />
      {def.connection === "not_connected" && <p className="mb-5 max-w-3xl rounded-xl bg-amber-100 px-4 py-3 text-sm text-amber-900">This email is written and ready, but nothing sends it yet. {def.connectionNote} Publishing it only saves the wording.</p>}
      {def.audience === "admin" && <p className="mb-5 max-w-3xl rounded-xl bg-sand-100 px-4 py-3 text-sm">Admin alerts can never be switched off from here. Only the wording is editable.</p>}
      <Editor
        tkey={key} initial={(t!.draft ?? t!.published)} publishedVersion={t!.version} hasDraft={!!t!.draft} vars={vars}
        versions={versions.map((v) => ({ version: v.version, note: v.note, actor: v.actor, at: v.createdAt.getTime() }))}
        senderName={settings.senderName} locked={!tableReady} admin
      />
    </>
  );
}
