export const OPEN_EVENT = "bl:pilo-open";
export type OpenDetail = { ask?: string; action?: "support"; handled?: boolean };

/** Ask the existing BeigePilot widget to open (optionally with a first question). Returns false when the assistant is not running on this page. */
export function openPilo(d: Omit<OpenDetail, "handled"> = {}): boolean {
  const detail: OpenDetail = { ...d, handled: false };
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail }));
  return !!detail.handled;
}
