"use client";
import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { Button } from "@/components/ui/button";
import { saveSeoSettingsAction } from "../actions";

type V = { siteName: string; defaultDescription: string; defaultOgImage: string; twitterSite: string };
const input = "w-full rounded-xl border border-sand-300 bg-white px-3 py-2 text-sm";
const label = "mb-1 block text-sm font-semibold text-forest-900";

export function SettingsForm({ initial, defaults }: { initial: V; defaults: V }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const set = (k: keyof V) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const save = () => start(async () => {
    const r = await saveSeoSettingsAction(v);
    toast(r.ok, r.ok ? "SEO defaults saved" : r.error);
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5 p-5">
      <div><label htmlFor="sn" className={label}>Site name</label><input id="sn" value={v.siteName} onChange={set("siteName")} placeholder={defaults.siteName} maxLength={60} className={input} /><p className="mt-1 text-xs">Used as the site name in blog social cards. Empty uses &ldquo;{defaults.siteName}&rdquo;.</p></div>
      <div><label htmlFor="dd" className={label}>Default description</label><textarea id="dd" rows={3} maxLength={320} value={v.defaultDescription} onChange={set("defaultDescription")} placeholder={defaults.defaultDescription} className={input} /><p className="mt-1 text-xs">Used for a blog article or the blog home only when it has no meta description and no excerpt. {v.defaultDescription.length}/320</p></div>
      <div><label htmlFor="di" className={label}>Default social image</label><input id="di" value={v.defaultOgImage} onChange={set("defaultOgImage")} placeholder="https://… or /media/…" className={input} /><p className="mt-1 text-xs">Used for blog share cards when an article has no social or featured image. Pick an image from the Media library and paste its address.</p></div>
      <div><label htmlFor="tw" className={label}>X (Twitter) handle</label><input id="tw" value={v.twitterSite} onChange={set("twitterSite")} placeholder="@yourbrand" className={input} /><p className="mt-1 text-xs">Optional. Leave empty if the brand has no X account.</p></div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save SEO defaults"}</Button>
    </form>
  );
}
