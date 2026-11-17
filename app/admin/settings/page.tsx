import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/require-admin";

export const dynamic = "force-dynamic";
const on = (v: string | undefined) => v === "true";

export default async function SettingsPage() {
  let admin;
  try { admin = await requireAdmin(); } catch (e) {
    const m = e instanceof Error ? e.message : "";
    redirect(`/admin/login?reason=${["no-cookie", "bad-session", "email-mismatch"].includes(m) ? m : "forbidden"}`);
  }
  const { env } = getCloudflareContext();
  const e = env as unknown as Record<string, string | undefined>;
  // Read-only: shows whether a setting is on or set, never its value. Change these in the Cloudflare dashboard.
  const rows: [string, string, boolean, string][] = [
    ["Checkout", "CHECKOUT_ENABLED", on(e.CHECKOUT_ENABLED), "Buyers can start checkout."],
    ["Mainnet payments", "MAINNET_ENABLED", on(e.MAINNET_ENABLED), "Real-money wallets are used. Keep off until the testnet gate is complete."],
    ["Allow placeholder products", "CHECKOUT_ALLOW_PLACEHOLDER", on(e.CHECKOUT_ALLOW_PLACEHOLDER), "Lets draft products be bought (testing only)."],
    ["Owner notifications", "NOTIFY_EMAIL", !!e.NOTIFY_EMAIL, "Where wallet, link and payment alerts are emailed."],
    ["Email sending", "RESEND_API_KEY", !!e.RESEND_API_KEY, "Transactional email (delivery, alerts)."],
    ["Bot protection", "TURNSTILE_SECRET_KEY", !!e.TURNSTILE_SECRET_KEY, "Turnstile on public forms."],
  ];
  return (
    <>
      <PageHeader title="Settings" text="Read-only status of the deployment. Values and secrets are never shown. Change them in the Cloudflare dashboard (Settings, Variables and Secrets)." />
      <Panel title="Deployment">
        <ul className="divide-y divide-sand-200 text-sm">
          {rows.map(([label, key, active, text]) => (
            <li key={key} className="flex items-center justify-between gap-4 px-5 py-3">
              <div><p className="font-semibold text-forest-900">{label}</p><p className="text-xs">{text} <span className="font-mono">{key}</span></p></div>
              <Badge tone={active ? (key === "MAINNET_ENABLED" || key === "CHECKOUT_ALLOW_PLACEHOLDER" ? "warn" : "good") : "mute"}>{active ? "On" : "Off"}</Badge>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Your session" className="mt-6">
        <p className="px-5 py-4 text-sm">Signed in as <b>{admin.email}</b>. Sessions last 15 minutes and need your password and a 6-digit code.</p>
      </Panel>
    </>
  );
}
