import { isoDow } from "./dates";
import { zonedWallTimeToUtc } from "./dates";

export type BusyInterval = { starts_at: string; ends_at: string };
export type TimeOff = { starts_on: string; ends_on: string };

export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

export function buildSlots(args: {
  date: string;
  timeZone: string;
  durationMin: number;
  opens: string | null;
  closes: string | null;
  isClosed: boolean;
  minNoticeMinutes: number;
  busy: BusyInterval[];
  timeOff: TimeOff[];
  stepMin?: number;
  now?: Date;
}): string[] {
  if (args.isClosed || !args.opens || !args.closes || args.durationMin <= 0) return [];
  if (args.timeOff.some((t) => args.date >= t.starts_on && args.date <= t.ends_on)) return [];

  const open = zonedWallTimeToUtc(args.date, args.opens.slice(0, 5), args.timeZone);
  const close = zonedWallTimeToUtc(args.date, args.closes.slice(0, 5), args.timeZone);
  if (close.getTime() <= open.getTime()) return [];

  const step = (args.stepMin ?? 15) * 60_000;
  const duration = args.durationMin * 60_000;
  const earliest = (args.now ?? new Date()).getTime() + args.minNoticeMinutes * 60_000;
  const busy = args.busy.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const slots: string[] = [];
  for (let t = open.getTime(); t + duration <= close.getTime(); t += step) {
    if (t < earliest) continue;
    const end = t + duration;
    if (busy.some((b) => overlaps(t, end, b.start, b.end))) continue;
    slots.push(new Date(t).toISOString());
  }
  return slots;
}

export function hourForDate(
  hours: { isodow: number; opens: string; closes: string; is_closed: boolean }[],
  date: string,
) {
  return hours.find((h) => h.isodow === isoDow(date)) ?? null;
}
