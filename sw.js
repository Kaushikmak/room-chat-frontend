// room-chat-frontend/sw.js

// CHANGE THIS VERSION to force the browser to update (v1 -> v2)
const CACHE_NAME = 'room-chat-v2';

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

// 1. Install: Cache files
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force new worker to take over immediately
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate: Delete old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
    self.clients.claim(); // Take control of all pages immediately
});

// 3. Fetch: Stale-While-Revalidate Strategy (Best for speed + updates)
self.addEventListener('fetch', (e) => {
    // Ignore API calls (let them go to network)
    if (e.request.url.includes('/api/')) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Return cached file immediately (Speed)
            const fetchPromise = fetch(e.request).then((networkResponse) => {
                // Update cache in background (Freshness)
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, networkResponse.clone());
                });
                return networkResponse;
            });
            
            return cachedResponse || fetchPromise;
        })
    );
});