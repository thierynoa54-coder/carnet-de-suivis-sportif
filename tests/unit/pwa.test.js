import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), "utf8");

function listFiles(dir){
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(ROOT, rel)).isDirectory() ? listFiles(rel) : [relative(ROOT, join(ROOT, rel)).split("\\").join("/")];
  });
}

const swFiles = [...read("sw.js").match(/const APP_FILES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

test("le service worker garde une copie de chaque fichier de l'application", () => {
  const expected = ["index.html", "manifest.webmanifest", ...listFiles("css"), ...listFiles("js"), ...listFiles("icons")];
  for(const file of expected) assert.ok(swFiles.includes(file), `${file} manque dans APP_FILES (sw.js)`);
});

test("le service worker ne référence aucun fichier absent", () => {
  for(const file of swFiles.filter((f) => f !== "./")) assert.ok(existsSync(join(ROOT, file)), `${file} listé dans sw.js mais introuvable`);
});

test("le manifeste permet l'installation sur PC et téléphone", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.name && manifest.short_name);
  // chemins relatifs : l'application doit fonctionner dans un sous-dossier (GitHub Pages)
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  const sizes = manifest.icons.filter((i) => i.type === "image/png").map((i) => i.sizes);
  assert.ok(sizes.includes("192x192") && sizes.includes("512x512"));
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
  for(const icon of manifest.icons){
    assert.ok(!icon.src.startsWith("/"), "chemin d'icône relatif");
    assert.ok(existsSync(join(ROOT, icon.src)), `${icon.src} introuvable`);
  }
});

test("la page référence le manifeste et les icônes par des chemins relatifs", () => {
  const html = read("index.html");
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
  assert.doesNotMatch(html, /(href|src)="\//);
});
