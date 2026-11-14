import assert from "node:assert/strict";
import { test } from "node:test";
import { fromHeader, formatPrice, formatWhen, renderEmail, senderName, type EmailJob } from "./templates";

const base: EmailJob = {
  id: "00000000-0000-0000-0000-000000000001",
  kind: "confirmation",
  to_email: "cliente@example.org",
  salon_name: 'Nails "by" <Test>',
  slug: "nails-by-test-lyon",
  address: "3 rue des Lilas",
  city: "Lyon",
  pro_phone: "0612345678",
  pro_email: "pro@example.org",
  client_name: "Léa Martin",
  client_phone: "0700000000",
  service_name: "Pose gel",
  starts_at: "2026-11-20T13:30:00.000Z",
  price_cents: 4500,
};

test("heure affichée en Europe/Paris", () => {
  const when = formatWhen(base.starts_at);
  assert.equal(when.time, "14h30");
  assert.match(when.day, /^Vendredi 20 novembre$/);
});

test("prix en euros", () => {
  assert.equal(formatPrice(4500), "45 €");
  assert.equal(formatPrice(4550), "45,50 €");
  assert.equal(formatPrice(0), null);
  assert.equal(formatPrice(null), null);
});

test("expéditeur sûr : nom du salon via Sheensy", () => {
  assert.equal(senderName('Nails "by" <Test>'), "Nails by Test via Sheensy");
  assert.equal(fromHeader("Nails by Safaa"), '"Nails by Safaa via Sheensy" <rendezvous@sheensy.com>');
});

test("confirmation cliente : contenu, lien et réponse à la pro", () => {
  const mail = renderEmail(base, "https://sheensy.com");
  assert.equal(mail.replyTo, "pro@example.org");
  assert.match(mail.subject, /Rendez-vous confirmé/);
  assert.match(mail.html, /https:\/\/sheensy\.com\/nails-by-test-lyon/);
  assert.match(mail.html, /Pose gel/);
  assert.match(mail.html, /14h30/);
  assert.match(mail.html, /3 rue des Lilas, Lyon/);
  assert.match(mail.html, /45 €/);
  assert.doesNotMatch(mail.html, /<Test>/);
  assert.match(mail.text, /Bonjour Léa/);
});

test("rappel cliente", () => {
  const mail = renderEmail({ ...base, kind: "reminder" });
  assert.match(mail.subject, /^Rappel/);
  assert.match(mail.text, /on vous attend le vendredi 20 novembre à 14h30/);
});

test("notification pro : cliente, téléphone, prestation", () => {
  const mail = renderEmail({ ...base, kind: "pro_new_booking", to_email: "pro@example.org", source: "online" });
  assert.equal(mail.to, "pro@example.org");
  assert.match(mail.subject, /Nouveau RDV · Léa Martin/);
  assert.match(mail.html, /07 00 00 00 00/);
  assert.match(mail.html, /Pose gel/);
  assert.match(mail.html, /\/espace\/aujourdhui/);
});
