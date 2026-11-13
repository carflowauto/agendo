export const TIME_ZONE = "Europe/Paris";

const WEEKDAYS = ["", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export function weekdayName(isodow: number) {
  return WEEKDAYS[isodow] ?? "";
}

function partsMap(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) map[part.type] = part.value;
  if (map.hour === "24") map.hour = "00";
  return map;
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const map = partsMap(date, timeZone);
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUTC - date.getTime();
}

/** Interprète une heure murale (salon) comme un instant UTC. */
export function zonedWallTimeToUtc(date: string, time: string, timeZone = TIME_ZONE): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0));
  const offset1 = getTimeZoneOffsetMs(utcGuess, timeZone);
  const corrected = new Date(utcGuess.getTime() - offset1);
  const offset2 = getTimeZoneOffsetMs(corrected, timeZone);
  return new Date(utcGuess.getTime() - offset2);
}

export function parisDateKey(date: Date = new Date()): string {
  const map = partsMap(date, TIME_ZONE);
  return `${map.year}-${map.month}-${map.day}`;
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function mondayOf(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

export function isoDow(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return day === 0 ? 7 : day;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatHm(iso: string): string {
  const minutes = parisMinutes(iso);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatDayLong(dateKeyOrIso: string): string {
  const date = dateKeyOrIso.includes("T")
    ? new Date(dateKeyOrIso)
    : zonedWallTimeToUtc(dateKeyOrIso, "12:00");
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDayShort(dateKey: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(zonedWallTimeToUtc(dateKey, "12:00"));
}

export function parisMinutes(iso: string): number {
  const map = partsMap(new Date(iso), TIME_ZONE);
  return Number(map.hour) * 60 + Number(map.minute);
}

export function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${String(m).padStart(2, "0")}`;
  if (h) return h === 1 ? "1 h" : `${h} h`;
  return `${m} min`;
}

export function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
