import { phoneDigits } from "@/lib/phone";

export const PROFESSIONS = [
  "Prothésiste ongulaire",
  "Esthéticienne",
  "Coiffeuse",
  "Maquilleuse",
  "Extensions de cils",
  "Autre",
] as const;

export type Profession = (typeof PROFESSIONS)[number];

export const DEFAULT_PROFESSION: Profession = "Prothésiste ongulaire";

export type SignupDraft = {
  enseigne: string;
  profession: string;
  city: string;
  phone: string;
  email: string;
  password: string;
};

export function isEnseigne(value: string) {
  return value.trim().length >= 2;
}

export function isCity(value: string) {
  return value.trim().length >= 2;
}

/** Téléphone français : 10 chiffres commençant par 0, ou +33 / 0033. */
export function isFrenchPhone(value: string) {
  return /^0[1-9]\d{8}$/.test(phoneDigits(value));
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isPassword(value: string) {
  return value.length >= 8;
}

export function isProfession(value: string) {
  return (PROFESSIONS as readonly string[]).includes(value);
}

export function stepIsValid(step: 1 | 2 | 3, draft: SignupDraft) {
  if (step === 1) return isEnseigne(draft.enseigne) && isProfession(draft.profession);
  if (step === 2) return isCity(draft.city) && isFrenchPhone(draft.phone);
  return isEmail(draft.email) && isPassword(draft.password);
}
