import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { isSalonCategory, SALON_CATEGORIES } from "./salons";

test("les catégories de recherche sont celles de l’accueil", () => {
  assert.deepEqual(
    SALON_CATEGORIES.map((item) => item.id),
    ["ongles", "coiffure", "maquillage", "esthetique", "injections"],
  );
  assert.equal(isSalonCategory("ongles"), true);
  assert.equal(isSalonCategory("barbier"), false);
});

test("la recherche publique ne renvoie pas les champs privés", () => {
  const sql = readFileSync("supabase/migrations/20261114140000_recherche_salons_publics.sql", "utf8");
  assert.match(sql, /search_public_salons/);
  assert.match(sql, /'pro', 'recherche'/);
  assert.doesNotMatch(sql, /ical_token/);
  assert.doesNotMatch(sql, /p\.phone/);
  assert.match(sql, /security definer/);
});
