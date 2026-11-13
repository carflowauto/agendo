import assert from "node:assert/strict";
import test from "node:test";
import { confirmedCount, dayRevenue, nextAppointment } from "./today";

const now = new Date("2026-11-13T10:00:00.000Z");

test("le prochain rendez-vous est le premier confirmé encore en cours", () => {
  const next = nextAppointment(
    [
      { status: "confirmed", starts_at: "2026-11-13T08:00:00.000Z", ends_at: "2026-11-13T09:00:00.000Z", id: "passe" },
      { status: "blocked", starts_at: "2026-11-13T10:30:00.000Z", ends_at: "2026-11-13T11:00:00.000Z", id: "pause" },
      { status: "confirmed", starts_at: "2026-11-13T12:00:00.000Z", ends_at: "2026-11-13T13:00:00.000Z", id: "suite" },
      { status: "confirmed", starts_at: "2026-11-13T09:30:00.000Z", ends_at: "2026-11-13T11:00:00.000Z", id: "en-cours" },
    ],
    now,
  );
  assert.equal(next?.id, "en-cours");
});

test("le compte et le chiffre d'affaires ignorent les pauses", () => {
  const items = [
    { status: "confirmed", price_cents: 6500 },
    { status: "blocked", price_cents: 0 },
    { status: "cancelled", price_cents: 4500 },
  ];
  assert.equal(confirmedCount(items), 1);
  assert.equal(dayRevenue(items), 6500);
});
