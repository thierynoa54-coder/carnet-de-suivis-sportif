// Service worker : permet à l'application de s'ouvrir sans réseau.
//
// Stratégie « réseau d'abord » : en ligne, on sert toujours la dernière version publiée
// (et on met la copie locale à jour) ; hors ligne, ou si le réseau ne répond pas à temps,
// on sert la copie locale. Aucune donnée personnelle ne passe par ici : le carnet reste
// dans le stockage du navigateur.

const CACHE = "carnet-app-v1";
const NETWORK_TIMEOUT_MS = 3000;
const SLOW_NETWORK_HOLD_MS = 30000;

// Tous les fichiers de l'application (vérifié par tests/unit/pwa.test.js).
const APP_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "js/ai.js",
  "js/assets.js",
  "js/layout.js",
  "js/main.js",
  "js/render.js",
  "js/seed.js",
  "js/state.js",
  "js/utils.js",
  "js/domain/energy.js",
  "js/domain/muscles.js",
  "js/domain/ranks.js",
  "js/views/analysis.js",
  "js/views/journal.js",
  "js/views/programs.js",
  "js/views/settings.js",
  "js/views/today.js",
  "js/views/week.js",
];

// Après un réseau trop lent, on sert la copie locale directement pendant un moment.
let preferCacheUntil = 0;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_FILES.map((url) => new Request(url, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

async function fromNetwork(request, cache){
  const response = await fetch(request);
  if(response.ok) await cache.put(request, response.clone());
  return response;
}

async function respond(request){
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });

  if(cached && Date.now() < preferCacheUntil){
    fromNetwork(request, cache).catch(() => {}); // mise à jour en arrière-plan
    return cached;
  }
  if(!cached) return fromNetwork(request, cache);

  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve("timeout"), NETWORK_TIMEOUT_MS); });
  const network = fromNetwork(request, cache).catch(() => "failed");
  const winner = await Promise.race([network, timeout]);
  clearTimeout(timer);
  if(winner === "timeout") preferCacheUntil = Date.now() + SLOW_NETWORK_HOLD_MS;
  if(winner === "timeout" || winner === "failed" || !winner.ok) return cached;
  return winner;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if(request.method !== "GET") return;
  if(new URL(request.url).origin !== self.location.origin) return; // API et CDN : jamais mis en cache
  event.respondWith(respond(request));
});
