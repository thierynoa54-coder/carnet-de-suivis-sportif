// Génère les icônes PNG de l'application à partir de icons/icon.svg.
// Usage : node tools/make-icons.js   (demande Playwright)
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const svg = readFileSync(new URL("../icons/icon.svg", import.meta.url), "utf8");
// Variante « pleine » (sans coins arrondis) : Android et iOS découpent eux-mêmes la forme.
const fullBleed = svg.replace(/(<rect width="512" height="512") rx="\d+"/, "$1");
if(fullBleed === svg) throw new Error("fond de l'icône introuvable dans icons/icon.svg");

const targets = [
  { file: "icon-192.png", size: 192, source: svg },
  { file: "icon-512.png", size: 512, source: svg },
  { file: "icon-maskable-512.png", size: 512, source: fullBleed },
  { file: "apple-touch-icon.png", size: 180, source: fullBleed },
];

const browser = await chromium.launch();
for(const { file, size, source } of targets){
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${source}`);
  await page.screenshot({ path: new URL(`../icons/${file}`, import.meta.url).pathname, omitBackground: true });
  await page.close();
  console.log("icône générée :", file);
}
await browser.close();
