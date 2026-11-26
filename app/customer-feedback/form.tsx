"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const box = "mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2 text-forest-900";
export function FeedbackForm({ email, token, orderId }: { email: string; token: string; orderId: string }) {
  const [sat, setSat] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState(""); const [ref, setRef] = useState(""); const [conf, setConf] = useState("");
  async function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!sat) { setMsg("Choose how satisfied you are."); setState("error"); return; }
    const f = new FormData(ev.currentTarget); setState("sending"); setMsg("");
    try {
      const r = await fetch("/api/customer-feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
        email, token, orderId, satisfaction: sat, productExperience: String(f.get("exp") ?? ""), workedWell: String(f.get("worked") ?? ""), improve: String(f.get("improve") ?? ""), comments: String(f.get("comments") ?? ""), wantsHelp: f.get("help") === "on" }) });
      const j = (await r.json()) as { ok?: boolean; error?: string; reference?: string; confirmation?: string };
      if (j.ok) { setRef(j.reference ?? ""); setConf(j.confirmation ?? ""); setState("done"); } else { setMsg(j.error ?? "Something went wrong."); setState("error"); }
    } catch { setMsg("We could not reach the server. Try again."); setState("error"); }
  }
  if (state === "done") return <div role="status" className="mt-8 rounded-2xl bg-forest-100 p-6 text-forest-900"><p className="font-semibold">Thank you. Your feedback is saved.</p><p className="mt-1 text-sm">Reference {ref}.{conf === "sent" ? " A confirmation email is on its way." : ""}</p></div>;
  return (
    <form onSubmit={submit} className="mt-8 space-y-6">
      <fieldset><legend className="font-semibold text-forest-900">How satisfied are you with your BeigeLeads experience?</legend>
        <div className="mt-2 flex gap-2" role="radiogroup">{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={sat === n} onClick={() => setSat(n)} className={`h-12 w-12 rounded-xl border text-lg font-semibold ${sat === n ? "border-forest-900 bg-forest-900 text-sand-50" : "border-sand-200 bg-white text-forest-900"}`}>{n}</button>)}</div>
        <p className="mt-1 text-xs text-forest-500">1 = very unhappy, 5 = very happy</p></fieldset>
      <label className="block font-semibold text-forest-900">How was the product?
        <select name="exp" className={box} defaultValue=""><option value="">Choose one</option><option value="excellent">Excellent</option><option value="good">Good</option><option value="okay">Okay</option><option value="poor">Poor</option></select></label>
      <label className="block font-semibold text-forest-900">What worked well?<textarea name="worked" maxLength={1000} rows={3} className={box} /></label>
      <label className="block font-semibold text-forest-900">What could we improve?<textarea name="improve" maxLength={1000} rows={3} className={box} /></label>
      <label className="block font-semibold text-forest-900">Anything else?<textarea name="comments" maxLength={2000} rows={3} className={box} /></label>
      <label className="flex items-start gap-3 rounded-xl bg-sand-100 p-4"><input type="checkbox" name="help" className="mt-1" /><span>I would like someone from the team to help me with something.</span></label>
      {state === "error" && <p role="alert" className="text-sm text-red-700">{msg}</p>}
      <Button type="submit" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Send my feedback"}</Button>
    </form>
  );
}
