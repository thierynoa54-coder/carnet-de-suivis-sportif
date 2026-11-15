// Génère les icônes PNG d'Îlot à partir du pixel art du jeu (drawIcon dans js/art.js).
// Lancer depuis la racine du dépôt : node tools/render-icons.js   (nécessite le paquet « playwright »)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' });
  return fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${server.address().port}/README.md`);
  const icons = await page.evaluate(async () => {
    const { drawIcon } = await import('/js/art.js');
    const base = document.createElement('canvas');
    base.width = 64; base.height = 64;
    drawIcon(base.getContext('2d'));
    const out = (size, crop = 0) => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(base, crop, crop, 64 - 2 * crop, 64 - 2 * crop, 0, 0, size, size);
      return c.toDataURL('image/png').split(',')[1];
    };
    return { 'icon-192.png': out(192), 'icon-512.png': out(512), 'apple-touch-icon.png': out(180, 2) };
  });
  fs.mkdirSync(path.join(ROOT, 'icons'), { recursive: true });
  for (const [name, b64] of Object.entries(icons)) fs.writeFileSync(path.join(ROOT, 'icons', name), Buffer.from(b64, 'base64'));
  await browser.close();
  server.close();
  console.log(`Icônes générées : ${Object.keys(icons).join(', ')}`);
})().catch((e) => { console.error(e); process.exit(1); });
