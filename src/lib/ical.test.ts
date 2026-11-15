import assert from "node:assert/strict";
import test from "node:test";
import { buildIcs, calendarFeedUrls, escapeText, foldLine, parseCalendarToken } from "./ical";

const token = "AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde";

test("parseCalendarToken accepte le jeton avec ou sans .ics", () => {
  assert.equal(parseCalendarToken(`${token}.ics`), token);
  assert.equal(parseCalendarToken(token), token);
  assert.equal(parseCalendarToken("court.ics"), null);
  assert.equal(parseCalendarToken("../../etc/passwd"), null);
  assert.equal(parseCalendarToken(""), null);
});

test("calendarFeedUrls construit webcal et le lien Google", () => {
  const urls = calendarFeedUrls("https://sheensy.com/", token);
  assert.equal(urls.https, `https://sheensy.com/api/agenda/${token}.ics`);
  assert.equal(urls.webcal, `webcal://sheensy.com/api/agenda/${token}.ics`);
  assert.equal(urls.google, `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(urls.webcal)}`);
});

test("escapeText échappe virgules, points-virgules, antislash et retours", () => {
  assert.equal(escapeText("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
});

test("foldLine plie à 75 octets sans couper les caractères accentués", () => {
  const line = `DESCRIPTION:${"é".repeat(100)}`;
  const folded = foldLine(line);
  for (const part of folded.split("\r\n")) assert.ok(new TextEncoder().encode(part).length <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), line);
});

test("buildIcs produit un VCALENDAR valide", () => {
  const ics = buildIcs(
    {
      salon_name: "Salon Test, Paris",
      events: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          starts_at: "2026-11-20T10:00:00+00:00",
          ends_at: "2026-11-20T11:00:00+00:00",
          status: "confirmed",
          service_name: "Pose gel",
          client_first_name: "Camille",
          client_phone: "06 12 34 56 78",
          notes: "Allergie; vernis",
        },
        { id: "22222222-2222-2222-2222-222222222222", starts_at: "2026-11-21T12:00:00Z", ends_at: "2026-11-21T13:00:00Z", status: "blocked" },
      ],
    },
    new Date("2026-11-15T18:00:00Z"),
  );
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("X-WR-CALNAME:Sheensy – Salon Test\\, Paris\r\n"));
  assert.ok(ics.includes("REFRESH-INTERVAL;VALUE=DURATION:PT15M\r\n"));
  assert.ok(ics.includes("X-PUBLISHED-TTL:PT15M\r\n"));
  assert.ok(ics.includes("UID:11111111-1111-1111-1111-111111111111@sheensy.com\r\n"));
  assert.ok(ics.includes("DTSTAMP:20261115T180000Z\r\n"));
  assert.ok(ics.includes("DTSTART:20261120T100000Z\r\n"));
  assert.ok(ics.includes("DTEND:20261120T110000Z\r\n"));
  assert.ok(ics.includes("SUMMARY:Camille · Pose gel\r\n"));
  assert.ok(ics.includes("SUMMARY:Indisponible\r\n"));
  assert.equal(ics.match(/BEGIN:VEVENT/g)?.length, 2);
  assert.ok(!/[^\r]\n/.test(ics));
});
