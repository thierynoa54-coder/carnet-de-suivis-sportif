// Test de fumée du Carnet : installable, hors ligne, sans erreur JavaScript, sur PC et iPhone simulé.
// Lancer depuis la racine du dépôt : node tests/smoke.js   (nécessite le paquet « playwright »)
// SHOTS=<dossier> enregistre une capture par appareil.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const PREFIX = '/carnet/'; // sous-dossier, comme sur GitHub Pages
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!p.startsWith(PREFIX)) { res.writeHead(404); return res.end(); }
  p = p.slice(PREFIX.length) || 'index.html';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

const DEVICES = {
  PC: { viewport: { width: 1280, height: 800 } },
  iPhone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
};

const failures = [];
const check = (ok, label) => { console.log(`${ok ? 'OK   ' : 'ÉCHEC'} ${label}`); if (!ok) failures.push(label); };

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}${PREFIX}`;
  const browser = await chromium.launch();
  for (const [name, options] of Object.entries(DEVICES)) {
    const ctx = await browser.newContext(options);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(base, { waitUntil: 'load' });
    const sw = await page.evaluate(() => navigator.serviceWorker.ready.then((r) => r.active && r.active.state));
    check(sw === 'activated' || sw === 'activating', `${name} : service worker actif (${sw})`);
    if (name === 'PC') {
      const cdp = await ctx.newCDPSession(page);
      const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
      check(installabilityErrors.length === 0, `PC : installable ${installabilityErrors.map((e) => e.errorId).join(', ')}`);
    }
    await page.reload({ waitUntil: 'load' });
    await ctx.setOffline(true);
    await page.reload({ waitUntil: 'load' });
    check(/Carnet/.test(await page.title()), `${name} : s'ouvre hors ligne`);
    check(await page.locator('#app').isVisible(), `${name} : interface affichée hors ligne`);
    if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, `${name}.png`) });
    await ctx.setOffline(false);
    check(errors.length === 0, `${name} : aucune erreur JavaScript ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
  await browser.close();
  server.close();
  console.log(failures.length ? `\n${failures.length} échec(s)` : '\nTous les tests passent');
  process.exit(failures.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
