import assert from "node:assert/strict";
import test from "node:test";
import { buildSlots } from "../slots";
import { normalizeBusy, withGoogleBusy } from "./busy";

const from = new Date("2026-11-20T00:00:00Z");
const to = new Date("2026-11-22T00:00:00Z");

test("normalizeBusy : trie, fusionne, borne à la fenêtre et ignore l'invalide", () => {
  const out = normalizeBusy(
    [
      { start: "2026-11-20T14:00:00Z", end: "2026-11-20T15:00:00Z" },
      { start: "2026-11-20T09:00:00Z", end: "2026-11-20T10:00:00Z" },
      { start: "2026-11-20T09:30:00Z", end: "2026-11-20T11:00:00Z" },
      { start: "2026-11-19T22:00:00Z", end: "2026-11-20T01:00:00Z" },
      { start: "2026-11-25T09:00:00Z", end: "2026-11-25T10:00:00Z" },
      { start: "pas une date", end: "2026-11-20T10:00:00Z" },
      { start: "2026-11-20T12:00:00Z", end: "2026-11-20T12:00:00Z" },
    ],
    from,
    to,
  );
  assert.deepEqual(out, [
    { start: "2026-11-20T00:00:00.000Z", end: "2026-11-20T01:00:00.000Z" },
    { start: "2026-11-20T09:00:00.000Z", end: "2026-11-20T11:00:00.000Z" },
    { start: "2026-11-20T14:00:00.000Z", end: "2026-11-20T15:00:00.000Z" },
  ]);
});

test("les absences Google bloquent les créneaux publics", () => {
  const args = {
    date: "2026-11-20",
    timeZone: "Europe/Paris",
    durationMin: 60,
    opens: "09:00",
    closes: "13:00",
    isClosed: false,
    minNoticeMinutes: 0,
    timeOff: [],
    now: new Date("2026-11-19T00:00:00Z"),
    stepMin: 60,
  };
  // Paris = UTC+1 : 09:00, 10:00, 11:00, 12:00 locales.
  const free = buildSlots({ ...args, busy: [] });
  assert.deepEqual(free, ["2026-11-20T08:00:00.000Z", "2026-11-20T09:00:00.000Z", "2026-11-20T10:00:00.000Z", "2026-11-20T11:00:00.000Z"]);
  const appointments = [{ starts_at: "2026-11-20T08:00:00Z", ends_at: "2026-11-20T09:00:00Z" }];
  const google = [{ starts_at: "2026-11-20T10:30:00Z", ends_at: "2026-11-20T11:15:00Z" }];
  const slots = buildSlots({ ...args, busy: withGoogleBusy(appointments, google) });
  assert.deepEqual(slots, ["2026-11-20T09:00:00.000Z"]);
  assert.deepEqual(withGoogleBusy(appointments, null), appointments);
});
