import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SEED_DATA } from "../../js/seed.js";

// Faux stockage navigateur, suffisant pour loadState/saveState.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const stateModule = await import("../../js/state.js");
const { STORAGE_KEY, getLog, getSupLog, loadState, saveState, setState } = stateModule;
const ancienne = () => JSON.parse(readFileSync(new URL("../fixtures/ancienne-sauvegarde.json", import.meta.url), "utf8"));

beforeEach(() => store.clear());

test("premier lancement : l'état est une copie indépendante des données de départ", () => {
  const s = loadState();
  assert.deepEqual(s.programs, SEED_DATA.programs);
  assert.deepEqual(s.logs, {});
  assert.deepEqual(s.weightLog, {});
  s.programs.A.name = "modifié";
  assert.notEqual(SEED_DATA.programs.A.name, "modifié");
});

test("une ancienne sauvegarde est complétée sans perdre une seule séance", () => {
  const old = ancienne();
  store.set(STORAGE_KEY, JSON.stringify(old));
  const s = loadState();

  assert.deepEqual(s.logs, old.logs, "le journal est repris tel quel");
  assert.deepEqual(s.weightLog, {});
  assert.deepEqual(s.deletedPrograms, []);
  assert.deepEqual(s.supplements, SEED_DATA.supplements);
  assert.equal(s.profile.poids_kg, 107, "poids déduit du texte « 106-108 kg »");
  assert.deepEqual(s.programs.mobilite, SEED_DATA.programs.mobilite, "programme ajouté depuis");
  assert.equal(s.programs.A.met, SEED_DATA.programs.A.met);
  s.programs.A.exercises.forEach((ex) => {
    const seedEx = SEED_DATA.programs.A.exercises.find((e) => e.id === ex.id);
    if(seedEx) assert.deepEqual(ex.m, seedEx.m);
  });
  assert.ok(s.programs.points_faibles.exercises.some((ex) => ex.id === "rf_pj1"));
});

test("les modifications personnelles d'un programme ne sont pas écrasées", () => {
  const old = ancienne();
  old.programs.B.name = "Mon programme B";
  old.programs.B.exercises[0].sets = "9 x 9";
  store.set(STORAGE_KEY, JSON.stringify(old));
  const s = loadState();
  assert.equal(s.programs.B.name, "Mon programme B");
  assert.equal(s.programs.B.exercises[0].sets, "9 x 9");
});

test("un stockage corrompu retombe sur les données de départ", () => {
  store.set(STORAGE_KEY, "{pas du json");
  const s = loadState();
  assert.deepEqual(s.programs, SEED_DATA.programs);
});

test("setState/saveState : ce qui est sauvegardé se relit à l'identique", () => {
  const s = loadState();
  s.logs["2026-11-14"] = { programKey: "A", note: "ok", locked: false, extraPrograms: [], substitutions: {}, supplements: {}, exercises: { a1: { poids: "20", reps: "12", rpe: 7, done: true } } };
  setState(s);
  assert.equal(stateModule.state, s);
  saveState();
  assert.deepEqual(loadState(), s);
});

test("getLog et getSupLog normalisent les anciens formats", () => {
  const s = loadState();
  s.logs["2026-11-01"] = { programKey: "A", note: "", exercises: {}, supplements: { sup_creatine: true } };
  setState(s);
  const log = getLog("2026-11-01");
  assert.equal(log.locked, false);
  assert.deepEqual(log.extraPrograms, []);
  assert.deepEqual(log.substitutions, {});
  assert.deepEqual(getSupLog("2026-11-01", "sup_creatine"), { taken: true, time: "" });
  assert.deepEqual(getSupLog("2026-11-01", "sup_omega3"), { taken: false, time: "" });
});
