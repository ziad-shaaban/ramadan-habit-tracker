const CACHE_NAME = 'ramadan-habits-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Install event: cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching app shell');
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Service Worker: Could not cache all files:', err);
        // Don't fail if we can't cache external resources
        return cache.add('./index.html');
      });
    })
  );
  self.skipWaiting();
});

// Fetch event: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type === 'basic' && response.status !== 200) {
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Offline - return cached index.html as fallback
        return caches.match('./index.html');
      });
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
