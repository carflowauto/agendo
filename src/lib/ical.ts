/**
 * Flux iCalendar (RFC 5545) de l'agenda d'une pro : iPhone, Google Agenda, Outlook…
 * Heures en UTC (suffixe Z), UID stables, échappement et pliage des lignes à 75 octets.
 */

export type CalendarFeedEvent = {
  id: string;
  starts_at: string;
  ends_at: string;
  status?: string | null;
  service_name?: string | null;
  client_first_name?: string | null;
  client_phone?: string | null;
  notes?: string | null;
};

export type CalendarFeed = {
  salon_name: string;
  timezone?: string | null;
  events: CalendarFeedEvent[];
};

const TOKEN_RE = /^[A-Za-z0-9_-]{24,128}$/;

/** Accepte « <jeton> » ou « <jeton>.ics ». Renvoie null si le format est invalide. */
export function parseCalendarToken(raw: string | undefined | null): string | null {
  if (!raw) return null;
  let value = raw;
  try {
    value = decodeURIComponent(raw);
  } catch {
    return null;
  }
  value = value.replace(/\.ics$/i, "");
  return TOKEN_RE.test(value) ? value : null;
}

export function calendarFeedUrls(site: string, token: string) {
  const https = `${site.replace(/\/$/, "")}/api/agenda/${token}.ics`;
  const webcal = https.replace(/^https?:\/\//, "webcal://");
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  return { https, webcal, google };
}

export function icsDate(iso: string | Date) {
  const d = iso instanceof Date ? iso : new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

const encoder = new TextEncoder();

/** Plie une ligne de contenu à 75 octets UTF-8 max, sans couper un caractère. */
export function foldLine(line: string) {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74; // la ligne de continuation commence par une espace
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function durationLabel(startIso: string, endIso: string) {
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} h ${String(m).padStart(2, "0")}`;
  if (h) return `${h} h`;
  return `${m} min`;
}

export function eventSummary(event: CalendarFeedEvent) {
  const service = event.service_name?.trim();
  if (event.status === "blocked") return service || event.notes?.trim() || "Indisponible";
  const client = event.client_first_name?.trim();
  return [client, service].filter(Boolean).join(" · ") || "Rendez-vous";
}

export function eventDescription(event: CalendarFeedEvent) {
  if (event.status === "blocked") return event.notes?.trim() && event.service_name?.trim() ? event.notes.trim() : "";
  const lines: string[] = [];
  if (event.client_first_name?.trim()) lines.push(`Cliente : ${event.client_first_name.trim()}`);
  if (event.client_phone?.trim()) lines.push(`Téléphone : ${event.client_phone.trim()}`);
  const duration = durationLabel(event.starts_at, event.ends_at);
  if (event.service_name?.trim()) lines.push(`Prestation : ${event.service_name.trim()}${duration ? ` (${duration})` : ""}`);
  if (event.notes?.trim()) lines.push(`Notes : ${event.notes.trim()}`);
  lines.push("Rendez-vous Sheensy");
  return lines.join("\n");
}

export function buildIcs(feed: CalendarFeed, now: Date = new Date()) {
  const name = `Sheensy – ${feed.salon_name?.trim() || "Mon agenda"}`;
  const stamp = icsDate(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sheensy//Agenda pro//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `NAME:${escapeText(name)}`,
    `X-WR-CALNAME:${escapeText(name)}`,
    `X-WR-TIMEZONE:${escapeText(feed.timezone?.trim() || "Europe/Paris")}`,
    "X-WR-CALDESC:Vos rendez-vous Sheensy\\, mis à jour automatiquement.",
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];
  for (const event of feed.events ?? []) {
    const start = new Date(event.starts_at);
    const end = new Date(event.ends_at);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@sheensy.com`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${icsDate(start)}`);
    lines.push(`DTEND:${icsDate(end > start ? end : new Date(start.getTime() + 60_000))}`);
    lines.push(`SUMMARY:${escapeText(eventSummary(event))}`);
    const description = eventDescription(event);
    if (description) lines.push(`DESCRIPTION:${escapeText(description)}`);
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
