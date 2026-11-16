"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BadgeCheck, Building2, Mail, MapPin, Phone, Globe, UserRound, Layers, Boxes } from "lucide-react";

/**
 * Animated "record under construction": one FICTIONAL record is built up stage by stage,
 * the way a real one is. It is an illustration, not real data, and says so on the card.
 */
export const stages = [
  { id: "collect", name: "Collect", text: "A raw business record is gathered from public sources." },
  { id: "append", name: "Append", text: "Address, phone and website are added and cleaned." },
  { id: "enrich", name: "Enrich", text: "Owner and tech stack are found and the email is discovered." },
  { id: "verify", name: "Verify", text: "Our team runs an SMTP check on the email." },
  { id: "organize", name: "Organize", text: "The record is tagged by category, place and size." },
  { id: "ready", name: "Ready", text: "It joins a list you can sample before you pay." },
] as const;

const STEP_MS = 2200;

function Field({ show, icon: Icon, label, value }: { show: boolean; icon: typeof Mail; label: string; value: string }) {
  return (
    <div className={`flex items-center gap-3 border-t border-sand-200 py-2.5 ${show ? "field-in" : "opacity-0"}`} aria-hidden={!show}>
      <Icon className="size-4 shrink-0 text-forest-500" aria-hidden />
      <span className="w-20 shrink-0 text-xs text-forest-500">{label}</span>
      <span className="truncate font-mono text-sm text-forest-900">{value}</span>
    </div>
  );
}

const MQ = "(prefers-reduced-motion: reduce)";
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(MQ);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function RecordJourney() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MQ).matches,
    () => false,
  );
  const stage = reduced ? stages.length - 1 : step; // reduced motion: show the finished record

  useEffect(() => {
    if (reduced || !auto) return;
    const t = setInterval(() => setStep((s) => (s + 1) % stages.length), STEP_MS);
    return () => clearInterval(t);
  }, [auto, reduced]);

  const pick = (i: number) => {
    setAuto(false);
    setStep(i);
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-sand-300 bg-sand-50 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-forest-100">
              <Building2 className="size-5 text-forest-700" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-forest-900">Example Dental Studio</p>
              <p className="text-xs text-forest-500">Dentist · Example City</p>
            </div>
          </div>
          {stage >= 3 && (
            <span
             
              className="stamp inline-flex items-center gap-1 rounded-md border-2 border-forest-500 px-2 py-0.5 text-xs font-bold text-forest-500"
            >
              <BadgeCheck className="size-3.5" aria-hidden /> VERIFIED
            </span>
          )}
        </div>

        <div className="mt-4">
          <Field show={stage >= 1} icon={MapPin} label="Address" value="12 Sample Street" />
          <Field show={stage >= 1} icon={Phone} label="Phone" value="(555) 010-0142" />
          <Field show={stage >= 1} icon={Globe} label="Website" value="example-dental.test" />
          <Field show={stage >= 2} icon={UserRound} label="Owner" value="Dr. A. Example" />
          <Field show={stage >= 2} icon={Layers} label="Tech stack" value="WordPress, booking widget" />
          <Field show={stage >= 2} icon={Mail} label="Email" value={stage >= 3 ? "o***@example-dental.test" : "found, not yet checked"} />
          <Field show={stage >= 4} icon={Boxes} label="Tags" value="dentist · small practice · city" />
        </div>

        <p className="mt-3 border-t border-dashed border-sand-300 pt-3 text-xs text-forest-500">
          Illustration with a made-up record. Real samples are masked too.
        </p>
      </div>

      <ol className="mt-5 grid grid-cols-6 gap-1.5" aria-label="Record journey stages">
        {stages.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => pick(i)}
              aria-current={i === stage ? "step" : undefined}
              className="group block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            >
              <span className={`block h-1.5 rounded-full transition-colors ${i <= stage ? "bg-forest-300" : "bg-white/20"}`} />
              <span className={`mt-1.5 block text-[0.7rem] leading-tight ${i === stage ? "font-semibold text-sand-50" : "text-sand-300"}`}>
                {s.name}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 min-h-12 text-sm text-sand-200" aria-live="polite">
        {stages[stage].text}
      </p>
    </div>
  );
}
