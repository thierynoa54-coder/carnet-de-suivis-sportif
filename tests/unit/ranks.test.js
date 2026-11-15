import { test } from "node:test";
import assert from "node:assert/strict";
import { RANK_TIERS, getLevelForXP, getRankForXP, readableTextOn } from "../../js/domain/ranks.js";

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

// Rapport de contraste WCAG entre deux couleurs #RRGGBB.
function contrast(a, b){
  const lum = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("le texte des pastilles de rang reste lisible (contraste AA) sur chaque couleur", () => {
  assert.equal(readableTextOn("#FFFFFF"), "#161A20");
  assert.equal(readableTextOn("#000000"), "#FFFFFF");
  for(const tier of RANK_TIERS){
    const ratio = contrast(tier.color, readableTextOn(tier.color));
    assert.ok(ratio >= 4.5, `${tier.label} : contraste ${ratio.toFixed(2)}`);
  }
});
