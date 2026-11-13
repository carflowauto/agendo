import assert from "node:assert/strict";
import test from "node:test";
import { NAIL_SUGGESTIONS, pendingSuggestions } from "./nail-services";

test("les suggestions ongles ont un prix et une durée", () => {
  assert.equal(NAIL_SUGGESTIONS.length, 11);
  assert.ok(NAIL_SUGGESTIONS.every((item) => item.durationMin >= 15 && item.priceCents > 0));
  assert.equal(NAIL_SUGGESTIONS[0].name, "Pose gel");
  assert.equal(NAIL_SUGGESTIONS[0].durationMin, 90);
  assert.equal(NAIL_SUGGESTIONS[0].priceCents, 4500);
});

test("une suggestion déjà ajoutée disparaît, même avec une casse différente", () => {
  const left = pendingSuggestions(["pose gel", "Dépose"]);
  assert.equal(left.some((item) => item.name === "Pose gel"), false);
  assert.equal(left.some((item) => item.name === "Dépose"), false);
  assert.equal(left.some((item) => item.name === "French"), true);
  assert.equal(left.length, 9);
});
