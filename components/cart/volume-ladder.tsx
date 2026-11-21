import { Check } from "lucide-react";
import type { VolumeInfo } from "@/lib/promos/engine";

/** Label of one tier: "2 databases", "3-4 databases", "5+ databases". */
const label = (t: { min: number }, i: number, all: { min: number }[]) => {
  const next = all[i + 1];
  if (!next) return `${t.min}+ databases`;
  return next.min - 1 === t.min ? `${t.min} databases` : `${t.min}–${next.min - 1} databases`;
};

/**
 * "Buy More, Save More": the discount ladder, the buyer's current tier and what the next tier needs. Everything comes from the server's
 * price of the cart (`pricing.volume`), nothing is calculated from browser values. Renders nothing when the feature is off.
 */
export function VolumeLadder({ volume }: { volume?: VolumeInfo }) {
  if (!volume?.enabled || volume.tiers.length === 0) return null;
  const { tiers, count, percent, next, replacedByCode } = volume;
  const top = tiers[tiers.length - 1];
  const progress = Math.min(100, Math.round((count / Math.max(1, top.min)) * 100));
  return (
    <section aria-labelledby="volume-title" className="mt-4 rounded-2xl border border-sand-200 bg-sand-50 p-4 text-sm">
      <h3 id="volume-title" className="font-bold text-forest-900">Buy More, Save More</h3>
      <ul className="mt-2 space-y-1">
        {tiers.map((t, i) => {
          const on = percent === t.percent && count >= t.min;
          return (
            <li key={t.min} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${on ? "bg-forest-100 font-semibold text-forest-900" : ""}`} aria-current={on ? "true" : undefined}>
              <span className="flex items-center gap-1.5">{on && <Check className="size-3.5" aria-hidden />}Buy {label(t, i, tiers)}</span>
              <span>Save {t.percent}%</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand-200" role="progressbar" aria-valuemin={0} aria-valuemax={top.min} aria-valuenow={Math.min(count, top.min)} aria-label="Progress to the biggest discount">
        <div className="h-full rounded-full bg-forest-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-forest-900" role="status">
        {replacedByCode
          ? "Your promo code is applied instead of this discount (offers are not combined)."
          : next
            ? `Add ${next.need} more database${next.need === 1 ? "" : "s"} to unlock ${next.percent}% OFF.`
            : percent > 0 ? `You've unlocked ${percent}% OFF your order.` : ""}
      </p>
    </section>
  );
}
