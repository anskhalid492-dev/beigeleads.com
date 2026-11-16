import { AtSign, CircleHelp, Server, ShieldCheck } from "lucide-react";

const stages = [
  { icon: AtSign, t: "An address", d: "j***@example.com (fictional, masked)" },
  { icon: Server, t: "Mail server lookup", d: "We find the server that handles that domain's mail." },
  { icon: ShieldCheck, t: "SMTP check", d: "We ask the server whether it accepts the address. No message is sent." },
  { icon: CircleHelp, t: "A result", d: "Accepted, rejected, accepts everything, or no answer." },
] as const;

/** Animated picture of the SMTP check, left to right. */
export function EmailFlow() {
  return (
    <div className="relative">
      <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-forest-300/30 md:block" />
      <span aria-hidden className="absolute left-[12.5%] right-[12.5%] top-7 hidden md:block">
        <span className="travel-dot absolute -top-[3px] size-[7px] -translate-x-1/2 rounded-full bg-forest-300 shadow-[0_0_12px_3px_rgba(143,208,169,0.7)]" />
      </span>
      <ol className="relative grid gap-8 md:grid-cols-4 md:gap-4">
        {stages.map((s, i) => (
          <li key={s.t} className="reveal flex gap-4 md:flex-col md:items-center md:text-center">
            <span className="node-on grid size-14 shrink-0 place-items-center rounded-full" style={{ animationDelay: `${i * 1.6}s` }}>
              <s.icon className="size-6" aria-hidden />
            </span>
            <div>
              <h3 className="display text-2xl text-sand-50">{s.t}</h3>
              <p className="mt-1 text-sand-200">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
