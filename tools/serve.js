// Petit serveur statique pour lancer l'application en local et pour les tests.
// Usage : node tools/serve.js [port] [dossier]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

export function startServer({ port = 0, root = process.cwd() } = {}){
  const base = resolve(root);
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filePath = join(base, normalize(urlPath === "/" ? "/index.html" : urlPath));
    if(!filePath.startsWith(base + sep)){ res.writeHead(403).end(); return; }
    try{
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": TYPES[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
      res.end(body);
    }catch(e){
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

if(process.argv[1] === fileURLToPath(import.meta.url)){
  const { url } = await startServer({ port: Number(process.argv[2]) || 8080, root: process.argv[3] || process.cwd() });
  console.log(`Carnet servi sur ${url}`);
}
