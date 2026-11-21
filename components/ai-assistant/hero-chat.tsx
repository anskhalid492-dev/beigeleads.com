import { Pilo } from "@/components/beigepilot/pilo";

/** Illustration only. It is not a live chat and shows no products, prices or counts. */
export function HeroChat() {
  return (
    <figure aria-label="Illustration of a BeigePilot conversation" className="relative mx-auto w-full max-w-md">
      <div className="rounded-[2rem] border border-forest-700 bg-sand-50 p-4 text-forest-700 shadow-[0_30px_60px_-30px_rgba(0,0,0,.6)] sm:p-5">
        <div className="flex items-center gap-3 border-b border-sand-200 pb-3">
          <Pilo crop="avatar" mood="wave" size={46} />
          <div><p className="display text-xl leading-none text-forest-900">Pilo</p><p className="mt-1 text-xs">BeigePilot assistant</p></div>
        </div>
        <div className="space-y-3 py-4 text-sm">
          <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-forest-900 px-4 py-2.5 text-sand-50">I need business email databases in Germany under $200.</p>
          <p className="max-w-[90%] rounded-2xl rounded-bl-md border border-sand-200 bg-white px-4 py-2.5">I can help you find matching Germany databases from the BeigeLeads catalog and show you available packages within your budget.</p>
          <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-100 p-3 text-xs">Matching databases and their real packages and prices appear here in the live chat.</div>
        </div>
        <div className="rounded-full border border-sand-300 bg-white px-4 py-2.5 text-sm text-forest-500">Ask BeigePilot anything…</div>
      </div>
    </figure>
  );
}
