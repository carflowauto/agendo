import assert from "node:assert/strict";
import test from "node:test";
import { hasReviews, mapsSearchUrl, vitrineLabel, vitrineUrl } from "./storefront";

test("l’adresse ouvre une recherche Maps", () => {
  const url = mapsSearchUrl("12 rue des Fleurs", "Lyon");
  assert.equal(url, "https://www.google.com/maps/search/?api=1&query=12%20rue%20des%20Fleurs%2C%20Lyon");
  assert.equal(mapsSearchUrl("  ", ""), null);
});

test("le lien vitrine public utilise sheensy.com", () => {
  assert.equal(vitrineLabel("atelier-lea"), "sheensy.com/atelier-lea");
  assert.equal(vitrineUrl("atelier-lea"), "https://sheensy.com/atelier-lea");
});

test("la note est masquée sans avis", () => {
  assert.equal(hasReviews(0), false);
  assert.equal(hasReviews(3), true);
});
