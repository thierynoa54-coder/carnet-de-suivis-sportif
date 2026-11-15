// Lot 1 : affichage PC + téléphone, thème sombre, clavier, installation et mode hors connexion.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { startServer } from "../../tools/serve.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const VIEWS = ["today", "week", "programs", "analysis", "journal", "settings"];

let server, baseUrl, browser;
before(async () => {
  ({ server, url: baseUrl } = await startServer({ root: ROOT }));
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
  server.close();
});

async function openApp(options = {}){
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", ...options });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(baseUrl + "/");
  await page.waitForSelector("#app > *");
  return { ctx, page, errors };
}
const goTo = (page, view) => page.click(`.navbar button[data-view="${view}"]`);
const box = (page, selector) => page.locator(selector).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
});
// Luminance relative (0 = noir, 1 = blanc) d'une couleur CSS calculée.
const luminance = (page, selector, prop) => page.locator(selector).first().evaluate((el, p) => {
  const [r, g, b] = getComputedStyle(el)[p].match(/[\d.]+/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}, prop);

test("téléphone : une colonne, onglets en bas", async () => {
  const { ctx, page } = await openApp({ viewport: { width: 390, height: 844 } });
  const nav = await box(page, ".navbar");
  assert.equal(Math.round(nav.width), 390);
  assert.equal(Math.round(nav.bottom), 844);
  assert.ok(nav.height < 100);
  const [main, side] = [await box(page, ".col-main"), await box(page, ".col-side")];
  assert.equal(main.left, side.left, "colonnes empilées");
  assert.ok(side.top >= main.bottom);
  await ctx.close();
});

test("tablette : deux colonnes, onglets en bas", async () => {
  const { ctx, page } = await openApp({ viewport: { width: 820, height: 1180 } });
  const nav = await box(page, ".navbar");
  assert.equal(Math.round(nav.bottom), 1180);
  for(const view of VIEWS){
    await goTo(page, view);
    const cols = await page.locator(".cols > .col").evaluateAll((els) => els.map((el) => el.getBoundingClientRect().left));
    assert.ok(new Set(cols.map(Math.round)).size >= 2, `deux colonnes attendues sur ${view}`);
  }
  await ctx.close();
});

test("PC : menu latéral à gauche et contenu sur deux colonnes", async () => {
  const { ctx, page, errors } = await openApp({ viewport: { width: 1440, height: 900 } });
  const nav = await box(page, ".navbar");
  assert.equal(nav.left, 0);
  assert.equal(Math.round(nav.height), 900, "menu sur toute la hauteur");
  assert.ok(nav.width > 180 && nav.width < 300);
  assert.ok(await page.locator(".nav-brand").isVisible());
  for(const view of VIEWS){
    await goTo(page, view);
    const app = await box(page, "#app");
    assert.ok(app.left >= nav.right, `le contenu de ${view} passe sous le menu`);
    const [first, second] = await page.locator(".cols > .col").evaluateAll((els) => els.slice(0, 2).map((el) => el.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right, width: r.width })));
    assert.ok(second.left >= first.right, `colonnes côte à côte sur ${view}`);
    assert.ok(first.width > 380 && second.width > 380, `colonnes assez larges sur ${view}`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("thème sombre : suit le réglage de l'appareil", async () => {
  const dark = await openApp({ colorScheme: "dark" });
  assert.ok(await luminance(dark.page, "body", "backgroundColor") < 0.02, "fond sombre");
  assert.ok(await luminance(dark.page, ".card", "backgroundColor") < 0.03, "cartes sombres");
  assert.ok(await luminance(dark.page, ".section-title", "color") > 0.7, "texte clair");
  await goTo(dark.page, "settings");
  assert.ok(await luminance(dark.page, "#pf_age", "backgroundColor") < 0.03, "champs sombres");
  await dark.ctx.close();

  const light = await openApp({ colorScheme: "light" });
  assert.ok(await luminance(light.page, "body", "backgroundColor") > 0.8, "fond clair");
  assert.ok(await luminance(light.page, ".card", "backgroundColor") > 0.95);
  await light.ctx.close();
});

test("clavier : touches 1 à 6 pour les onglets, Entrée pour enchaîner la saisie", async () => {
  const { ctx, page, errors } = await openApp({ viewport: { width: 1440, height: 900 } });
  await page.keyboard.press("3");
  assert.equal(await page.locator(".navbar button.active").getAttribute("data-view"), "programs");
  // clavier AZERTY : la touche physique « 4 » produit une apostrophe sans Maj
  await page.evaluate(() => document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "'", code: "Digit4", bubbles: true })));
  assert.equal(await page.locator(".navbar button.active").getAttribute("data-view"), "analysis");
  await page.keyboard.press("1");
  assert.equal(await page.locator(".navbar button.active").getAttribute("data-view"), "today");

  const rows = page.locator(".exo-log[data-exid]");
  await rows.nth(0).locator(".logPoids").click();
  await page.keyboard.type("20");
  assert.equal(await page.locator(".navbar button.active").getAttribute("data-view"), "today", "un chiffre tapé dans un champ ne change pas d'onglet");
  await page.keyboard.press("Enter");
  await page.keyboard.type("12");
  await page.keyboard.press("Enter");
  assert.equal(await rows.nth(0).locator(".logPoids").inputValue(), "20");
  assert.equal(await rows.nth(0).locator(".logReps").inputValue(), "12");
  assert.match(await rows.nth(0).locator(".check-btn").getAttribute("class"), /\bon\b/, "exercice validé par Entrée");
  assert.ok(await rows.nth(1).locator(".logPoids").evaluate((el) => el === document.activeElement), "curseur sur l'exercice suivant");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("hors connexion : l'application s'ouvre et garde les données", async () => {
  const { ctx, page, errors } = await openApp();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const row = page.locator(".exo-log[data-exid]").first();
  await row.locator(".logPoids").fill("30");
  await row.locator(".check-btn").click();

  await ctx.setOffline(true);
  await page.reload();
  await page.waitForSelector("#app > *");
  assert.equal(await page.locator(".exo-log[data-exid]").first().locator(".logPoids").inputValue(), "30");
  for(const view of VIEWS){
    await goTo(page, view);
    assert.ok(await page.locator("#app > *").count() > 0, `onglet ${view} vide hors connexion`);
  }
  // les icônes et le manifeste sont aussi disponibles sans réseau
  const statuses = await page.evaluate(() => Promise.all(["manifest.webmanifest", "icons/icon-192.png", "css/app.css"].map((u) => fetch(u).then((r) => r.status))));
  assert.deepEqual(statuses, [200, 200, 200]);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("installation : le navigateur reconnaît une application installable", async () => {
  const { ctx, page } = await openApp();
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await ctx.newCDPSession(page);
  const { errors: manifestErrors, url } = await cdp.send("Page.getAppManifest");
  assert.match(url, /manifest\.webmanifest$/);
  assert.deepEqual(manifestErrors, []);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  assert.deepEqual(installabilityErrors.map((e) => e.errorId), []);
  await ctx.close();
});
