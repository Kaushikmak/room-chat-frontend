// room-chat-frontend/sw.js
const CACHE_NAME = 'room-chat-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/pages/login.html',
    '/pages/home.html',
    '/pages/dashboard.html',
    '/assets/css/variables.css',
    '/assets/css/layout.css',
    '/assets/css/theme.css',
    '/assets/js/api.js',
    '/assets/js/config.js',
    '/assets/js/ui.js',
    '/scripts/login.js',
    '/scripts/home.js',
    '/scripts/dashboard.js'
];

// 1. Install Phase: Cache static assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate Phase: Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

// 3. Fetch Phase: Serve from cache, then fall back to network
self.addEventListener('fetch', (e) => {
    // Only cache GET requests, ignore API calls (handled by JS)
    if (e.request.method !== 'GET' || e.request.url.includes('/api/')) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Return cached response if found, else fetch from network
            return cachedResponse || fetch(e.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    // Update cache with new file version
                    cache.put(e.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});