import { test } from "node:test";
import assert from "node:assert/strict";
import { getLevelForXP, getRankForXP } from "../../js/domain/ranks.js";

test("getRankForXP place l'XP sur le bon palier", () => {
  assert.equal(getRankForXP(0).key, "none");
  assert.equal(getRankForXP(14).key, "none");
  assert.equal(getRankForXP(14).progressPct, 93);
  assert.equal(getRankForXP(15).key, "bronze1");
  const top = getRankForXP(5000);
  assert.equal(top.key, "legende");
  assert.equal(top.next, null);
  assert.equal(top.progressPct, 100);
});

test("getLevelForXP calcule niveau et titre", () => {
  assert.deepEqual(getLevelForXP(0), { level: 1, title: "Débutant", xpIntoLevel: 0, xpForNextLevel: 150, progressPct: 0, totalXP: 0 });
  const l4 = getLevelForXP(525);
  assert.equal(l4.level, 4);
  assert.equal(l4.title, "Combattant");
  assert.equal(l4.progressPct, 50);
});
