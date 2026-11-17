import type { ReactNode } from "react";

export function PageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl text-forest-900">{title}</h1>
        {text && <p className="mt-2 max-w-2xl text-sm">{text}</p>}
      </div>
      {actions}
    </div>
  );
}

export const panel = "rounded-2xl border border-sand-200 bg-white";

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${panel} ${className}`}>
      {title && <h2 className="border-b border-sand-200 px-5 py-3 text-base font-bold text-forest-900">{title}</h2>}
      {children}
    </section>
  );
}

const tones = {
  good: "bg-forest-100 text-forest-900",
  warn: "bg-amber-100 text-amber-900",
  bad: "bg-red-100 text-red-800",
  info: "bg-purple-100 text-purple-700",
  mute: "bg-sand-200 text-forest-700",
} as const;

export function Badge({ tone = "mute", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={`${panel} p-5`}>
      <p className="text-sm font-semibold text-forest-700">{label}</p>
      <p className="display mt-2 text-4xl text-forest-900">{value}</p>
      {hint && <p className="mt-1 text-xs">{hint}</p>}
    </div>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-bold text-forest-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-md text-sm">{text}</p>}
    </div>
  );
}

export const fmtDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 16).replace("T", " ") + " UTC" : "—");
export const usd = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
