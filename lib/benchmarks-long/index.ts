import type { Long } from "./types";
import { cold } from "./cold";
import { deliverability } from "./deliverability";
import { decay } from "./decay";
import { cycle } from "./cycle";
import { extra } from "./extra";
import { extra2 } from "./extra2";
import { extra3 } from "./extra3";

const base: Record<string, Long> = { ...cold, ...deliverability, ...decay, ...cycle };
// Extra sections go before the last main section so the article ends on its own closing/limits part.
export const LONG: Record<string, Long> = Object.fromEntries(
  Object.entries(base).map(([slug, l]) => {
    const add = [...(extra[slug] ?? []), ...(extra2[slug] ?? []), ...(extra3[slug] ?? [])];
    const sections = [...l.sections.slice(0, -1), ...add, ...l.sections.slice(-1)];
    return [slug, { ...l, sections }];
  }),
);
