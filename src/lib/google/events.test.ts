import assert from "node:assert/strict";
import test from "node:test";
import { decideEventAction, eventIdFor, type GoogleEventJob } from "./events";

const site = "https://sheensy.com";
const base: GoogleEventJob = {
  appointment_id: "0f8b2c1e-1a2b-4c3d-9e8f-abcdef012345",
  profile_id: "p1",
  version: 1,
  refresh_token_enc: "v1.x.y",
  google_event_id: null,
  timezone: "Europe/Paris",
  salon_name: "Salon Test",
  address: "12 rue des Fleurs, Lyon",
  appointment: {
    status: "confirmed",
    source: "online",
    starts_at: "2026-11-20T09:00:00+00:00",
    ends_at: "2026-11-20T10:30:00+00:00",
    service_name: "Pose gel",
    client_name: "Léa Martin",
    client_phone: "06 12 34 56 78",
    notes: null,
  },
};

test("eventIdFor : identifiant Google valide (base32hex) et stable", () => {
  const id = eventIdFor(base.appointment_id);
  assert.equal(id, "sh0f8b2c1e1a2b4c3d9e8fabcdef012345");
  assert.match(id, /^[a-v0-9]{5,1024}$/);
  assert.equal(eventIdFor(base.appointment_id.toUpperCase()), id);
});

test("rendez-vous confirmé : événement complet, transparent, marqué Sheensy", () => {
  const action = decideEventAction(base, site);
  assert.equal(action.kind, "upsert");
  if (action.kind !== "upsert") return;
  assert.equal(action.eventId, eventIdFor(base.appointment_id));
  assert.equal(action.body.summary, "Léa Martin · Pose gel");
  assert.equal(action.body.start.dateTime, "2026-11-20T09:00:00.000Z");
  assert.equal(action.body.end.dateTime, "2026-11-20T10:30:00.000Z");
  assert.equal(action.body.start.timeZone, "Europe/Paris");
  assert.equal(action.body.transparency, "transparent");
  assert.equal(action.body.location, "12 rue des Fleurs, Lyon");
  assert.equal(action.body.extendedProperties.private.sheensyAppointmentId, base.appointment_id);
  assert.match(action.body.description, /Téléphone : 06 12 34 56 78/);
  assert.match(action.body.description, /https:\/\/sheensy\.com\/espace\/agenda/);
});

test("id Google déjà connu : réutilisé", () => {
  const action = decideEventAction({ ...base, google_event_id: "sh-existant" }, site);
  assert.equal(action.eventId, "sh-existant");
});

test("annulé, supprimé ou blocage : l'événement est retiré", () => {
  const cancelled = decideEventAction({ ...base, appointment: { ...base.appointment!, status: "cancelled" } }, site);
  const blocked = decideEventAction({ ...base, appointment: { ...base.appointment!, status: "blocked" } }, site);
  const deleted = decideEventAction({ ...base, appointment: null, google_event_id: "sh123" }, site);
  assert.deepEqual(cancelled, { kind: "delete", eventId: eventIdFor(base.appointment_id) });
  assert.equal(blocked.kind, "delete");
  assert.deepEqual(deleted, { kind: "delete", eventId: "sh123" });
});

test("sans nom ni prestation : titre par défaut", () => {
  const action = decideEventAction(
    { ...base, address: null, appointment: { ...base.appointment!, client_name: null, service_name: null } },
    site,
  );
  assert.equal(action.kind === "upsert" && action.body.summary, "Rendez-vous");
  assert.equal(action.kind === "upsert" && "location" in action.body, false);
});
