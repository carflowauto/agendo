function icsStamp(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(opts: {
  name: string;
  events: { uid: string; starts_at: string; ends_at: string; summary: string; description?: string }[];
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Agendo//Espace pro//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];
  const stamp = icsStamp(new Date().toISOString());
  for (const event of opts.events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}@agendo`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${icsStamp(event.starts_at)}`);
    lines.push(`DTEND:${icsStamp(event.ends_at)}`);
    lines.push(`SUMMARY:${escapeText(event.summary || "Rendez-vous")}`);
    if (event.description?.trim()) lines.push(`DESCRIPTION:${escapeText(event.description.trim())}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
