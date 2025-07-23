const CACHE_NAME = 'carpe-diem-v1';
const ASSETS = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/css/style.css',      // if you have a custom CSS file
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  // add any other static assets you need cached
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
