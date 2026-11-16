/** Google -> Sheensy : créneaux occupés (fonctions pures, testées). */
import type { BusyInterval } from "../slots";

export const BUSY_WINDOW_DAYS = 60;

export type RawBusy = { start?: string; end?: string };

/** Trie, borne à la fenêtre, fusionne les chevauchements. Ne garde que début/fin. */
export function normalizeBusy(raw: RawBusy[], from: Date, to: Date, max = 3000): { start: string; end: string }[] {
  const lo = from.getTime();
  const hi = to.getTime();
  const items = raw
    .map((b) => ({ s: Date.parse(b.start ?? ""), e: Date.parse(b.end ?? "") }))
    .filter((b) => Number.isFinite(b.s) && Number.isFinite(b.e) && b.e > b.s && b.e > lo && b.s < hi)
    .map((b) => ({ s: Math.max(b.s, lo), e: Math.min(b.e, hi) }))
    .sort((x, y) => x.s - y.s);
  const merged: { s: number; e: number }[] = [];
  for (const b of items) {
    const last = merged[merged.length - 1];
    if (last && b.s <= last.e) last.e = Math.max(last.e, b.e);
    else merged.push({ ...b });
  }
  return merged.slice(0, max).map((b) => ({ start: new Date(b.s).toISOString(), end: new Date(b.e).toISOString() }));
}

/** Ajoute les absences Google aux rendez-vous déjà pris pour la grille de réservation. */
export function withGoogleBusy(busy: BusyInterval[], google: BusyInterval[] | null | undefined): BusyInterval[] {
  return google?.length ? [...busy, ...google] : busy;
}
