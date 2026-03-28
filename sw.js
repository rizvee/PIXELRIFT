/**
 * sw.js — PIXELRIFT Service Worker
 * Strategy: Network First, Fallback to Cache
 * This ensures users get the latest game logic while still supporting offline play.
 */

const CACHE_NAME = 'pixelrift-v1.1';
const ASSETS_TO_CACHE = [
  '/PIXELRIFT/',
  '/PIXELRIFT/index.html',
  '/PIXELRIFT/assets/css/global.css',
  '/PIXELRIFT/assets/js/hub.js',
  '/PIXELRIFT/assets/js/engine.js',
  '/PIXELRIFT/manifest.json'
];

// Install: Cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
});

// Fetch: Network First, Fallback to Cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(networkResponse => {
        // Clone response to put in cache
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          // Cache game files and core assets as we go
          if (e.request.url.startsWith(self.location.origin)) {
            cache.put(e.request, responseClone);
          }
        });
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(e.request);
      })
  );
});
