import assert from "node:assert/strict";
import test from "node:test";
import { zonedWallTimeToUtc } from "./dates";
import { buildSlots } from "./slots";

test("heure d'hiver à Paris", () => {
  assert.equal(zonedWallTimeToUtc("2026-01-15", "09:30").toISOString(), "2026-01-15T08:30:00.000Z");
});

test("heure d'été à Paris", () => {
  assert.equal(zonedWallTimeToUtc("2026-07-15", "09:30").toISOString(), "2026-07-15T07:30:00.000Z");
});

test("les créneaux collés ne se chevauchent pas et le busy est exclu", () => {
  const slots = buildSlots({
    date: "2026-11-17",
    timeZone: "Europe/Paris",
    durationMin: 60,
    opens: "09:00",
    closes: "12:00",
    isClosed: false,
    minNoticeMinutes: 0,
    busy: [
      {
        starts_at: zonedWallTimeToUtc("2026-11-17", "10:00").toISOString(),
        ends_at: zonedWallTimeToUtc("2026-11-17", "11:00").toISOString(),
      },
    ],
    timeOff: [],
    stepMin: 30,
    now: new Date("2026-11-01T00:00:00Z"),
  });
  assert.deepEqual(slots, [
    zonedWallTimeToUtc("2026-11-17", "09:00").toISOString(),
    zonedWallTimeToUtc("2026-11-17", "11:00").toISOString(),
  ]);
});

test("jour fermé et congés", () => {
  assert.deepEqual(
    buildSlots({
      date: "2026-11-17",
      timeZone: "Europe/Paris",
      durationMin: 30,
      opens: "09:00",
      closes: "12:00",
      isClosed: true,
      minNoticeMinutes: 0,
      busy: [],
      timeOff: [],
      now: new Date("2026-11-01T00:00:00Z"),
    }),
    [],
  );
  assert.deepEqual(
    buildSlots({
      date: "2026-11-17",
      timeZone: "Europe/Paris",
      durationMin: 30,
      opens: "09:00",
      closes: "12:00",
      isClosed: false,
      minNoticeMinutes: 0,
      busy: [],
      timeOff: [{ starts_on: "2026-11-16", ends_on: "2026-11-18" }],
      now: new Date("2026-11-01T00:00:00Z"),
    }),
    [],
  );
});
