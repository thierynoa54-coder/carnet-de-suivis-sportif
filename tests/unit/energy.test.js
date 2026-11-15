import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyExercise, estimateExerciseKcal, parseRestSeconds } from "../../js/domain/energy.js";

test("classifyExercise distingue répétitions et durées", () => {
  assert.deepEqual(classifyExercise("4 x 12-15"), { type: "reps", sets: 4, perSetReps: 13.5 });
  assert.deepEqual(classifyExercise("3 x 30-40 s"), { type: "duration", sets: 3, perSetSeconds: 35 });
  assert.deepEqual(classifyExercise("3 min effort"), { type: "duration", sets: 1, perSetSeconds: 180 });
  assert.deepEqual(classifyExercise("3 x max"), { type: "reps", sets: 3, perSetReps: null });
  assert.deepEqual(classifyExercise(""), { type: "reps", sets: 1, perSetReps: 10 });
});

test("parseRestSeconds lit secondes et minutes", () => {
  assert.equal(parseRestSeconds("60 s"), 60);
  assert.equal(parseRestSeconds("2 min"), 120);
  assert.equal(parseRestSeconds("—"), 0);
  assert.equal(parseRestSeconds(undefined), 0);
});

test("estimateExerciseKcal utilise les répétitions notées quand elles existent", () => {
  const ex = { sets: "4 x 10", rest: "60 s" };
  const sansSaisie = estimateExerciseKcal(ex, 6, 100, "");
  assert.equal(sansSaisie.reliability, "estimee");
  assert.ok(Math.abs(sansSaisie.kcal - (6 * 100 * (4 * 10 * 2.6 + 3 * 60)) / 3600) < 1e-9);

  const avecSaisie = estimateExerciseKcal(ex, 6, 100, "12");
  assert.equal(avecSaisie.reliability, "bonne");
  assert.ok(Math.abs(avecSaisie.kcal - (6 * 100 * (4 * 12 * 2.6 + 3 * 60)) / 3600) < 1e-9);
});

test("estimateExerciseKcal se fie à la durée du programme pour un exercice chronométré", () => {
  const res = estimateExerciseKcal({ sets: "3 x 30 s", rest: "45 s" }, 8, 80, "999");
  assert.equal(res.reliability, "bonne");
  assert.ok(Math.abs(res.kcal - (8 * 80 * (3 * 30 + 2 * 45)) / 3600) < 1e-9);
});
