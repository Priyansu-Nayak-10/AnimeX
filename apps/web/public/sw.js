const CACHE_NAME = 'animex-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/pages/signin.html',
  '/pages/app.html',
  '/images/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
