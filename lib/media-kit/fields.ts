import { MEDIA_KIT } from "./content";

export const FIELDS = {
  title: { label: "Page headline", max: 120, rows: 1 },
  intro: { label: "Intro text", max: 600, rows: 4 },
  about: { label: "About BeigeLeads (separate paragraphs with a blank line)", max: 1600, rows: 8 },
  contactNote: { label: "“Need something else?” text", max: 300, rows: 3 },
} as const;
export type FieldKey = keyof typeof FIELDS;
export type KitContent = Record<FieldKey, string>;

export const DEFAULT_CONTENT: KitContent = {
  title: MEDIA_KIT.title,
  intro: MEDIA_KIT.intro,
  about: MEDIA_KIT.about.join("\n\n"),
  contactNote: MEDIA_KIT.contactNote,
};
