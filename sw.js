const CACHE_NAME = 'rss-bhatapara-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/volunteers.html',
  '/shakha.html',
  '/varg.html',
  '/events.html',
  '/prerna.html',
  '/join.html',
  '/css/style.css',
  '/js/shared.js',
  '/js/data-loader.js',
  '/js/id-card-generator.js',
  '/manifest.json',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/data/volunteers.json',
  '/data/events.json',
  '/data/varg.json',
  '/data/pending.json',
  '/data/gannayaks.json'
];

// Install Event: Cache all critical static resources
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Implement custom caching strategy
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 1. Skip Netlify functions / API calls (must always hit the network)
  if (url.pathname.startsWith('/.netlify/') || url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Network-First Strategy for JSON database files
  if (url.pathname.startsWith('/data/')) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          console.log('[Service Worker] Network failed, serving JSON from cache:', url.pathname);
          return caches.match(req);
        })
    );
    return;
  }

  // 3. Stale-While-Revalidate for other static assets (HTML, CSS, JS, Images)
  e.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkRes;
      }).catch(() => {
        // Suppress fetch errors if offline
      });

      return cachedRes || fetchPromise;
    })
  );
});
