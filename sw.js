// Service worker du Carnet : ouverture et saisie hors ligne.
// Ne traite que les GET du même site : les appels à l'API Claude, à Supabase
// ou aux CDN passent toujours directement par le réseau.
const CACHE = 'carnet-v1'; // changer ce numéro à chaque modification des fichiers listés
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const NAV_TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Page : réseau d'abord (version à jour), cache si hors ligne ou réseau trop lent.
function pageNetworkFirst(request) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (response) => { if (!settled && response) { settled = true; resolve(response); } };
    const timer = setTimeout(() => caches.match('./index.html').then(finish), NAV_TIMEOUT_MS);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
        }
        finish(response);
      })
      .catch(() => {
        clearTimeout(timer);
        caches.match('./index.html').then((hit) => finish(hit || Response.error()));
      });
  });
}

// Fichiers (icônes, manifeste, modules) : cache d'abord, réseau sinon.
function assetCacheFirst(request) {
  return caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
    }
    return response;
  }));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? pageNetworkFirst(request) : assetCacheFirst(request));
});
