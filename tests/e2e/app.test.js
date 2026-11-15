// Tests de bout en bout : l'application réelle dans un navigateur, sur téléphone et sur PC.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { startServer } from "../../tools/serve.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const FIXTURE = fileURLToPath(new URL("../fixtures/ancienne-sauvegarde.json", import.meta.url));
const KEY = "carnetCombat_v1";
const VIEWS = ["today", "week", "programs", "analysis", "journal", "settings"];
const SCREENS = { "téléphone": { width: 390, height: 844 }, "PC": { width: 1440, height: 900 } };

let server, baseUrl, browser;
before(async () => {
  ({ server, url: baseUrl } = await startServer({ root: ROOT }));
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
  server.close();
});

// Ouvre l'application dans un contexte neuf ; `saved` préremplit le stockage comme le ferait une visite précédente.
async function openApp({ viewport = SCREENS["téléphone"], saved = null } = {}){
  const ctx = await browser.newContext({ viewport, acceptDownloads: true, locale: "fr-FR" });
  if(saved){
    await ctx.addInitScript(({ key, value }) => {
      if(!sessionStorage.getItem("__seeded")){ localStorage.setItem(key, value); sessionStorage.setItem("__seeded", "1"); }
    }, { key: KEY, value: JSON.stringify(saved) });
  }
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if(m.type() === "error") errors.push(m.text()); });
  await page.goto(baseUrl + "/");
  await page.waitForSelector("#app > *");
  const stored = async () => JSON.parse(await page.evaluate((k) => localStorage.getItem(k), KEY));
  return { ctx, page, errors, stored };
}
const goTo = (page, view) => page.click(`.navbar button[data-view="${view}"]`);

for(const [name, viewport] of Object.entries(SCREENS)){
  test(`chaque onglet s'affiche sans erreur (${name})`, async () => {
    const { ctx, page, errors } = await openApp({ viewport });
    for(const view of VIEWS){
      await goTo(page, view);
      assert.ok(await page.locator("#app > *").count() > 0, `onglet ${view} vide`);
      assert.equal(await page.locator(".navbar button.active").getAttribute("data-view"), view);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `défilement horizontal sur ${view} (${overflow}px)`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test("une séance saisie est conservée après rechargement", async () => {
  const { ctx, page, errors, stored } = await openApp();
  const row = page.locator(".exo-log[data-exid]").first();
  const exId = await row.getAttribute("data-exid");
  await row.locator(".logPoids").fill("22.5");
  await row.locator(".logReps").fill("14");
  await row.locator(".check-btn").click();
  assert.match(await page.locator("#progressCount").textContent(), /^1\//);

  await page.reload();
  await page.waitForSelector("#app > *");
  const after = page.locator(`.exo-log[data-exid="${exId}"]`);
  assert.equal(await after.locator(".logPoids").inputValue(), "22.5");
  assert.equal(await after.locator(".logReps").inputValue(), "14");
  assert.match(await after.locator(".check-btn").getAttribute("class"), /\bon\b/);

  const logs = Object.values((await stored()).logs);
  assert.equal(logs.length, 1);
  assert.deepEqual(logs[0].exercises[exId], { poids: "22.5", reps: "14", rpe: null, done: true });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("une ancienne sauvegarde s'ouvre et garde toutes ses séances", async () => {
  const saved = JSON.parse(readFileSync(FIXTURE, "utf8"));
  const { ctx, page, errors, stored } = await openApp({ saved });
  await goTo(page, "journal");
  const listed = await page.locator("[data-open]").evaluateAll((els) => els.map((el) => el.dataset.open));
  for(const date of Object.keys(saved.logs)) assert.ok(listed.includes(date), `séance du ${date} absente du carnet`);

  // une modification déclenche la sauvegarde de l'état complété
  await goTo(page, "analysis");
  await page.fill("#weightValueInput", "105.5");
  await page.click("#addWeightBtn");
  const now = await stored();
  for(const [date, log] of Object.entries(saved.logs)){
    assert.deepEqual(now.logs[date].exercises, log.exercises, `séance du ${date}`);
    assert.equal(now.logs[date].note, log.note);
  }
  assert.ok(now.programs.mobilite, "programme ajouté depuis la sauvegarde");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("un export se réimporte sans aucune perte", async () => {
  const saved = JSON.parse(readFileSync(FIXTURE, "utf8"));
  const first = await openApp({ saved });
  await goTo(first.page, "analysis");
  await first.page.fill("#weightValueInput", "105.5");
  await first.page.click("#addWeightBtn");
  await goTo(first.page, "settings");
  const [download] = await Promise.all([first.page.waitForEvent("download"), first.page.click("#exportBtn")]);
  const exportPath = await download.path();
  const exported = JSON.parse(readFileSync(exportPath, "utf8"));
  assert.deepEqual(exported, await first.stored(), "l'export contient tout l'état");

  // autre appareil, vierge : on importe le fichier
  const second = await openApp({ viewport: SCREENS.PC });
  await goTo(second.page, "settings");
  await second.page.setInputFiles("#importFileInput", { name: "export.json", mimeType: "application/json", buffer: readFileSync(exportPath) });
  const confirm = second.page.locator("#importStatus button");
  await confirm.click(); // armement
  await confirm.click(); // confirmation
  await second.page.waitForSelector("#todayProgSelect, #unlockBtn, .exo");
  assert.deepEqual(await second.stored(), exported);

  await goTo(second.page, "journal");
  assert.equal(await second.page.locator("[data-open]").count(), Object.keys(exported.logs).length);
  assert.deepEqual([...first.errors, ...second.errors], []);
  await first.ctx.close();
  await second.ctx.close();
});
