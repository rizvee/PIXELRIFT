const CACHE_NAME = 'pixelrift-v1';
const ASSETS = [
  '/PIXELRIFT/',
  '/PIXELRIFT/index.html',
  '/PIXELRIFT/assets/css/global.css',
  '/PIXELRIFT/assets/js/hub.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      // Return cached asset if found
      if (response) return response;
      
      // Otherwise fetch and cache lazily
      return fetch(e.request).then(networkResponse => {
        // Cache game directories as the user clicks into them
        if (e.request.url.includes('/games/')) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
