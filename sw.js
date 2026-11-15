// Service worker d'Îlot : le jeu s'ouvre et se joue hors ligne.
// Seules les requêtes GET du même site passent ici : l'API Claude et Supabase vont toujours au réseau.
const CACHE = 'ilot-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './css/style.css',
  './js/main.js', './js/state.js', './js/audio.js', './js/art.js', './js/world.js', './js/ui.js',
  './vendor/phaser.min.js', './fonts/pixelify-sans-latin-400-normal.woff2', './fonts/pixelify-sans-latin-700-normal.woff2',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const TIMEOUT_MS = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Page et code du jeu : réseau d'abord (dernière version), cache si hors ligne ou réseau trop lent.
function networkFirst(request, key) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (response) => { if (!settled && response) { settled = true; resolve(response); } };
    const timer = setTimeout(() => caches.match(key).then(finish), TIMEOUT_MS);
    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((c) => c.put(key, copy)); }
        finish(response);
      })
      .catch(() => { clearTimeout(timer); caches.match(key).then((hit) => finish(hit || Response.error())); });
  });
}
// Moteur, polices et images : ils ne changent pas, donc cache d'abord.
function cacheFirst(request) {
  return caches.match(request).then((hit) => hit || fetch(request).then((response) => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); }
    return response;
  }));
}

self.addEventListener('fetch', (event) => {
  const { request } = event, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request, './index.html')); return; }
  const isCode = /\.(js|css|webmanifest)$/.test(url.pathname) && !url.pathname.includes('/vendor/');
  event.respondWith(isCode ? networkFirst(request, request) : cacheFirst(request));
});
