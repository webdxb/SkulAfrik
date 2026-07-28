/// <reference types="vite/client" />

// Service Worker for KLASO — offline-first caching
// Strategy:
//   - App shell (HTML/JS/CSS): stale-while-revalidate → instant load offline
//   - API/Supabase: network-first, fallback to cache
//   - Images: cache-first

const CACHE_VERSION = 'klaso-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMG_CACHE = `${CACHE_VERSION}-img`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/ChatGPT_Image_Jul_15,_2026,_07_58_18_PM.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
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

  // App shell (HTML/JS/CSS) → stale-while-revalidate
  if (req.mode === 'navigate' || req.destination === 'script' || req.destination === 'style' || req.destination === 'font') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
