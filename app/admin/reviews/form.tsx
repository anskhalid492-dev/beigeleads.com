"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { FollowupSettings } from "@/lib/followups/settings";
import { saveFollowupSettingsAction } from "./actions";

const inp = "w-24 rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm";
export function FollowupForm({ s }: { s: FollowupSettings }) {
  const [r, run, pending] = useActionState(saveFollowupSettingsAction, null);
  return (
    <form action={run} className="space-y-5 p-5 text-sm">
      <div className="space-y-2">
        <label className="flex items-start gap-2"><input type="checkbox" name="reviewsOn" defaultChecked={s.reviewsOn} className="mt-1" /><span><span className="font-semibold text-forest-900">Send &ldquo;How was your list?&rdquo; requests</span><span className="block text-xs">One email per delivered, real-money order. Never to anyone who opted out.</span></span></label>
        <label className="ml-6 block">Days after delivery <input name="reviewDays" type="number" min={1} max={60} defaultValue={s.reviewDays} className={inp} /></label>
      </div>
      <div className="space-y-2">
        <label className="flex items-start gap-2"><input type="checkbox" name="sampleOn" defaultChecked={s.sampleOn} className="mt-1" /><span><span className="font-semibold text-forest-900">Send one sample follow-up</span><span className="block text-xs">One email per fulfilled sample request for a specific list, only if that person has not bought it. Includes an opt-out link.</span></span></label>
        <label className="ml-6 block">Days after the sample was marked fulfilled <input name="sampleDays" type="number" min={1} max={60} defaultValue={s.sampleDays} className={inp} /></label>
      </div>
      <div className="space-y-2">
        <label className="flex items-start gap-2"><input type="checkbox" name="showPublic" defaultChecked={s.showPublic} className="mt-1" /><span><span className="font-semibold text-forest-900">Show approved reviews on the website</span><span className="block text-xs">Only reviews you approved and the buyer allowed. Nothing shows until the minimum below is reached.</span></span></label>
        <label className="ml-6 block">Minimum approved reviews before anything is shown <input name="minToShow" type="number" min={1} max={50} defaultValue={s.minToShow} className={inp} /></label>
      </div>
      <p className="text-xs">Both emails are templates in System Emails (&ldquo;Customer Follow-up&rdquo;): read and edit them there before switching a follow-up on. Everything is off until you tick it.</p>
      <div className="flex items-center gap-3"><Button type="submit" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>{r && <span role={r.ok ? "status" : "alert"} className={`font-medium ${r.ok ? "text-forest-700" : "text-red-800"}`}>{r.message}</span>}</div>
    </form>
  );
}
