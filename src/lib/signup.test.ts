import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DEFAULT_PROFESSION, isFrenchPhone, isProfession, stepIsValid, type SignupDraft } from "./signup";

const draft = (patch: Partial<SignupDraft> = {}): SignupDraft => ({
  enseigne: "Les Ongles de Léa",
  profession: DEFAULT_PROFESSION,
  city: "Lyon",
  phone: "06 12 34 56 78",
  email: "lea@example.com",
  password: "motdepasse",
  ...patch,
});

test("étape 1 : enseigne et métier", () => {
  assert.equal(stepIsValid(1, draft()), true);
  assert.equal(stepIsValid(1, draft({ enseigne: " L " })), false);
  assert.equal(stepIsValid(1, draft({ profession: "Boulangère" })), false);
  assert.equal(isProfession(DEFAULT_PROFESSION), true);
});

test("étape 2 : ville et téléphone français", () => {
  assert.equal(stepIsValid(2, draft()), true);
  assert.equal(stepIsValid(2, draft({ city: "L" })), false);
  assert.equal(isFrenchPhone("06 12 34 56 78"), true);
  assert.equal(isFrenchPhone("+33 6 12 34 56 78"), true);
  assert.equal(isFrenchPhone("0033612345678"), true);
  assert.equal(isFrenchPhone("061234567"), false);
  assert.equal(isFrenchPhone("00 12 34 56 78"), false);
  assert.equal(isFrenchPhone("+32 470 12 34 56"), false);
});

test("étape 3 : e-mail et mot de passe", () => {
  assert.equal(stepIsValid(3, draft()), true);
  assert.equal(stepIsValid(3, draft({ email: "lea@" })), false);
  assert.equal(stepIsValid(3, draft({ password: "court" })), false);
});

test("la migration ne crée ni prestation ni horaire par défaut", () => {
  const sql = readFileSync("supabase/migrations/20261113233000_inscription_sans_catalogue.sql", "utf8");
  assert.match(sql, /unique_slug\(v_name \|\| '-' \|\| v_city\)/);
  assert.doesNotMatch(sql, /insert into public\.services/i);
  assert.doesNotMatch(sql, /opening_hours/);
  assert.doesNotMatch(sql, /Pose complète/);
});
