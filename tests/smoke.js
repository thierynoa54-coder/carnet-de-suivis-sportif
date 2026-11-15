// Test de jeu d'Îlot sur PC et iPhone simulé : accueil de Nimbo, quête du jour, bilan du soir,
// constellation, installation et jeu hors ligne, sans aucune erreur JavaScript.
// Lancer depuis la racine du dépôt : node tests/smoke.js   (nécessite le paquet « playwright »)
// SHOTS=<dossier> enregistre des captures (PC de jour, PC et iPhone de nuit).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PREFIX = '/ilot/'; // sous-dossier, comme sur GitHub Pages
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!p.startsWith(PREFIX)) { res.writeHead(404); return res.end(); }
  p = p.slice(PREFIX.length) || 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  return fs.createReadStream(file).pipe(res);
});

const DEVICES = {
  PC: { viewport: { width: 1280, height: 800 } },
  iPhone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
};
const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'OK   ' : 'ÉCHEC'} ${label}`); if (!ok) failures.push(label); };
const shot = (page, name) => process.env.SHOTS && page.screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) });

async function open(browser, base, device, hour) {
  const ctx = await browser.newContext({ ...DEVICES[device], timezoneId: 'Europe/Paris' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install({ time: new Date(`2026-11-16T${hour}:00+01:00`) });
  await page.goto(base);
  await page.waitForFunction(() => window.__ilot?.ready);
  return { ctx, page, errors };
}
async function welcome(page) {
  await page.click('#dialog [data-k="0"]');
  await page.fill('#dialog input', 'Test');
  await page.click('#dialog [data-ok]');
  await page.click('#dialog [data-k="0"]');
  await page.click('#dialog [data-k="0"]');
  await page.waitForSelector('#dialog', { state: 'hidden' });
}
const xp = (page) => page.textContent('#xptxt');

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}${PREFIX}`;
  const browser = await chromium.launch();

  // Île de jour, accueil de Nimbo à l'écran.
  {
    const { ctx, page, errors } = await open(browser, base, 'PC', '10:00');
    await page.waitForSelector('#dialog:not([hidden])');
    await page.waitForTimeout(1500);
    await shot(page, 'PC-jour');
    check(errors.length === 0, `PC de jour : aucune erreur JavaScript ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }

  for (const device of Object.keys(DEVICES)) {
    const { ctx, page, errors } = await open(browser, base, device, '21:30');
    await welcome(page);
    check(true, `${device} : accueil de Nimbo et prénom`);

    await page.click('[data-go="maison"]');
    await page.waitForSelector('#panel:not([hidden]) .letter');
    await page.fill('[data-form="quest"] input', "Boire 2 L d'eau");
    await page.click('[data-form="quest"] button');
    await page.check('[data-quest]');
    await page.waitForFunction(() => document.querySelector('#xptxt').textContent === '10/100');
    check(true, `${device} : quête du jour accomplie (+10 XP)`);
    await page.keyboard.press('Escape');

    await page.click('[data-go="feu"]');
    await page.waitForSelector('[data-form="bilan"]');
    await page.click('[data-set="reussie"][data-v="true"]');
    await page.click('[data-set="note"][data-v="4"]');
    await page.click('[data-set="energie"][data-v="3"]');
    await page.fill('#ok', 'Séance faite le matin');
    await page.fill('#prio', 'Appeler le garage');
    await page.click('[data-form="bilan"] .row .btn');
    await page.waitForFunction(() => document.querySelector('#xptxt').textContent === '40/100');
    check((await page.textContent('#luc')) === '4', `${device} : bilan du soir enregistré (+30 XP, 4 lucioles)`);
    await page.click('#dialog [data-k="0"]');

    await page.click('[data-go="observatoire"]');
    await page.waitForSelector('.stars img[alt="journée réussie"]');
    check(true, `${device} : étoile allumée dans l'observatoire`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1200);
    await shot(page, `${device}-nuit`);

    const sw = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.active && r.active.state));
    check(sw === 'activated' || sw === 'activating', `${device} : service worker actif (${sw})`);
    if (device === 'PC') {
      const cdp = await ctx.newCDPSession(page);
      const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
      check(installabilityErrors.length === 0, `PC : installable ${installabilityErrors.map((e) => e.errorId).join(', ')}`);
    }
    await page.reload();
    await page.waitForFunction(() => window.__ilot?.ready);
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => window.__ilot?.ready);
    check((await xp(page)) === '40/100', `${device} : jeu et progression disponibles hors ligne`);
    await ctx.setOffline(false);
    check(errors.length === 0, `${device} : aucune erreur JavaScript ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(failures.length ? `\n${failures.length} échec(s)` : '\nTous les tests passent');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
