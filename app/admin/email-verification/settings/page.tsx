import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { loadEvSettings } from "@/lib/ev/settings";
import { gate } from "../gate";
import { SettingsForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Email List Verification Settings", robots: { index: false, follow: false } };

export default async function EvSettingsPage() {
  await gate();
  const env = getCloudflareContext().env;
  const s = await loadEvSettings(env);
  let r2 = false; try { await env.LISTS.list({ prefix: "email-verification/", limit: 1 }); r2 = true; } catch { r2 = false; }
  return (
    <>
      <PageHeader title="Email List Verification Settings" text="Packages, limits, retention, reminders and the cart offer." />
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-sand-200 bg-white p-4 text-sm">
        <span className="font-semibold text-forest-900">Private file storage (R2)</span>
        <Badge tone={r2 ? "good" : "bad"}>{r2 ? "Connected" : "Not reachable"}</Badge>
        <span>Email templates are edited in <Link className="font-semibold underline" href="/admin/system-emails">System Emails</Link> (category Email List Verification).</span>
      </div>
      <Panel className="p-5"><SettingsForm s={s} /></Panel>
    </>
  );
}
