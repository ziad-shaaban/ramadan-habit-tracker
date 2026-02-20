const CACHE_NAME = 'ramadan-habits-v1';

// Install - cache essential files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]).catch(err => {
        console.warn('[Service Worker] Cache addAll error:', err);
        return cache.add('./index.html');
      });
    })
  );
});

// Activate - claim clients
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  self.clients.claim();
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

// Fetch - try cache first, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle same-origin requests
  if (!event.request.url.includes(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
