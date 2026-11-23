// Single source for the creator-inquiry offer. The 10M+ figure, the $0.10 price and the 12-hour promise are
// OWNER-DECLARED facts (CLAUDE.md section 152): the business must be able to substantiate them.
export const PRICE_PER_VERIFIED_CONTACT_USD = 0.1;
export const PRICE_PER_CONTACT_CENTS = Math.round(PRICE_PER_VERIFIED_CONTACT_USD * 100);
export const RESPONSE_HOURS = 12;
export const RESPONSE_MS = RESPONSE_HOURS * 3_600_000;
export const REMINDER_BEFORE_MS = 3 * 3_600_000; // internal "due soon" reminder
export const MAX_QUANTITY = 10_000_000;
export const DATABASE_STATEMENT = "10M+";

export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "X (Twitter)", "Facebook", "Twitch", "LinkedIn", "Pinterest", "Snapchat", "Other"] as const;
export const FOLLOWER_RANGES = [
  { value: "1k-10k", label: "1K to 10K (nano)" },
  { value: "10k-100k", label: "10K to 100K (micro)" },
  { value: "100k-500k", label: "100K to 500K (mid)" },
  { value: "500k-1m", label: "500K to 1M (macro)" },
  { value: "1m+", label: "1M and above (mega)" },
  { value: "mixed", label: "Mixed or not sure yet" },
] as const;
export const followerLabel = (v: string) => FOLLOWER_RANGES.find((r) => r.value === v)?.label ?? v;

export const STATUSES = ["new", "in_review", "quoted", "contacted", "won", "lost"] as const;
export type CreatorStatus = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<CreatorStatus, string> = { new: "New", in_review: "In Review", quoted: "Quoted", contacted: "Contacted", won: "Won", lost: "Lost" };
/** A deadline only counts while the inquiry is still waiting for its first reply. */
export const isOpen = (s: { status: string; respondedAt: number | null }) => s.respondedAt == null && (s.status === "new" || s.status === "in_review");
export const PRICE_LABEL_NOTE = "Estimated price based on your requested quantity. Final availability and total cost will be confirmed by our team.";
