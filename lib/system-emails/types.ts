import { z } from "zod";

/** Body blocks. Text may contain {{variables}} and **bold**; no HTML is accepted anywhere. */
export type Block =
  | { t: "p"; text: string }
  | { t: "list"; items: string[] }
  | { t: "kv"; rows: { label: string; value: string }[] }
  | { t: "note"; text: string };

export type Content = {
  subject: string;
  preheader: string;
  heading: string;
  blocks: Block[];
  cta?: { label: string; url: string };
  signoff: string;
};

const txt = (n: number) => z.string().max(n);
export const blockSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("p"), text: txt(2000) }),
  z.object({ t: z.literal("list"), items: z.array(txt(400)).max(20) }),
  z.object({ t: z.literal("kv"), rows: z.array(z.object({ label: txt(80), value: txt(300) })).max(20) }),
  z.object({ t: z.literal("note"), text: txt(1000) }),
]);
export const contentSchema = z.object({
  subject: txt(200).min(1),
  preheader: txt(200),
  heading: txt(200).min(1),
  blocks: z.array(blockSchema).max(30),
  cta: z.object({ label: txt(60).min(1), url: txt(500).min(1) }).optional(),
  signoff: txt(200),
});

export type Audience = "customer" | "admin";
/** connected = a real backend event sends this email today. */
export type Connection = "connected" | "not_connected";

export type TemplateDef = {
  key: string;
  name: string;
  audience: Audience;
  /** Plain-words description of the event that sends it. */
  event: string;
  connection: Connection;
  /** What is missing for a "not connected" template. */
  connectionNote?: string;
  /** Variables the event can supply (system variables are always allowed). */
  vars: string[];
  /** The email must not be sent when one of these is empty. */
  required: string[];
  content: Content;
};
