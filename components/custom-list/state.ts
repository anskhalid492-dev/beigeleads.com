import type { LocationInput } from "@/lib/custom-list/schema";
import { describeLocation } from "@/lib/custom-list/schema";

export type WizardState = {
  audience: string[]; industries: string[]; jobTitles: string[];
  targeting: { companySize: string; specialization: string; businessType: string; revenue: string; other: string };
  locations: LocationInput[]; exclusions: string[];
  fields: string[]; customFields: string[]; quantity: string; quantityPlus: boolean; instructions: string;
  name: string; email: string; company: string; message: string;
};

export const EMPTY: WizardState = {
  audience: [], industries: [], jobTitles: [], targeting: { companySize: "", specialization: "", businessType: "", revenue: "", other: "" },
  locations: [], exclusions: [], fields: [], customFields: [], quantity: "", quantityPlus: false, instructions: "", name: "", email: "", company: "", message: "",
};

export const STEPS = ["Prospects", "Location", "Data", "Review"] as const;

export const qtyNumber = (s: WizardState) => { const n = Number(s.quantity.replace(/[^\d]/g, "")); return Number.isInteger(n) && n >= 1 ? n : undefined; };
export const qtyLabel = (s: WizardState) => { const n = qtyNumber(s); return n ? `${n.toLocaleString("en-US")}${s.quantityPlus ? "+" : ""}` : ""; };
export const targetingFilled = (s: WizardState) => Object.entries(s.targeting).filter(([, v]) => v.trim()) as [string, string][];
const TARGET_LABEL: Record<string, string> = { companySize: "Company size", specialization: "Specialization", businessType: "Business type", revenue: "Revenue range", other: "Other criteria" };
export const targetingLabel = (k: string) => TARGET_LABEL[k] ?? k;

export function validate(step: number, s: WizardState): string {
  if (step === 0 && s.industries.length === 0) return "Choose at least one industry. You can type your own if it is not suggested.";
  if (step === 1 && s.locations.length === 0) return "Add at least one country.";
  if (step === 2 && s.quantity.trim() && !qtyNumber(s)) return "Enter the quantity as a whole number, or leave it empty.";
  return "";
}

export function contactErrors(s: WizardState): Record<string, string> {
  const e: Record<string, string> = {};
  if (s.name.trim().length < 2) e.name = "Enter your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())) e.email = "Enter a valid work email.";
  return e;
}

/** 0-100 for the summary meter: industry, location, data or quantity, contact details. */
export function completion(s: WizardState): number {
  const parts = [s.industries.length > 0, s.locations.length > 0, s.fields.length + s.customFields.length > 0 || !!qtyNumber(s), s.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email.trim())];
  return parts.filter(Boolean).length * 25;
}

export const locationText = (l: LocationInput) => describeLocation(l);

/** The part of the state that is safe to keep on this device. No name, email, company or message. */
export const draftOf = (s: WizardState) => ({ ...s, name: "", email: "", company: "", message: "" });
export const hasContent = (s: WizardState) => s.industries.length + s.locations.length + s.jobTitles.length + s.fields.length + s.customFields.length + s.audience.length > 0 || !!s.quantity || !!s.instructions.trim();
