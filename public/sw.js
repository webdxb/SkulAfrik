/// <reference types="vite/client" />

// Service Worker for KLASO — offline-first caching
// Strategy:
//   - Navigation (HTML): network-first → always get the latest deployed app shell
//     when online; only fall back to cache if truly offline. This is critical
//     because Vite's hashed JS/CSS filenames change on every deploy — serving a
//     stale cached index.html would keep pointing at assets that may no longer
//     exist, and would make the app appear "frozen" on an old version forever.
//   - Hashed JS/CSS/fonts (content-addressed, safe to cache forever): cache-first
//   - API/Supabase: network-first, fallback to cache
//   - Images: cache-first

const CACHE_VERSION = 'klaso-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMG_CACHE = `${CACHE_VERSION}-img`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('klaso-') && k !== SHELL_CACHE && k !== API_CACHE && k !== IMG_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET
  if (req.method !== 'GET') return;

  // Supabase REST API → network-first with cache fallback
  if (url.hostname.includes('supabase.co') && url.pathname.startsWith('/rest/v1')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || new Response(
          JSON.stringify({ error: 'offline', message: 'Données non disponibles hors ligne' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )))
    );
    return;
  }

  // Images → cache-first
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(IMG_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Navigation requests (the HTML shell) → network-first. This is THE critical
  // fix: always fetch the latest deployed index.html when online, so the app
  // never appears "stuck" on an old version after a new deploy.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // Hashed JS/CSS/fonts (content-addressed by Vite — safe to cache forever) → cache-first
  if (req.destination === 'script' || req.destination === 'style' || req.destination === 'font') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
