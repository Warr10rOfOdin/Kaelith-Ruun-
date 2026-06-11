// ============================================
// SERVICE WORKER — Kaelith Ruun PWA
// Enables offline play and mobile app install
// ============================================

const CACHE_NAME = 'kaelith-ruun-v17';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/combat.css',
    '/css/map.css',
    '/css/breach.css',
    '/js/data/races.js',
    '/js/data/classes.js',
    '/js/data/items.js',
    '/js/data/enemies.js',
    '/js/data/world.js',
    '/js/data/lore.js',
    '/js/data/npcs.js',
    '/js/data/quests.js',
    '/js/engine/worldgen.js',
    '/js/data/maps.js',
    '/js/data/tech.js',
    '/js/engine/state.js',
    '/js/engine/echoes.js',
    '/js/engine/narrative.js',
    '/js/engine/combat.js',
    '/js/engine/inventory.js',
    '/js/engine/exploration.js',
    '/js/engine/dialogue.js',
    '/js/engine/progression.js',
    '/js/engine/sprites.js',
    '/js/engine/worldmap.js',
    '/js/engine/base.js',
    '/js/engine/homestead.js',
    '/js/engine/breach.js',
    '/js/engine/hub.js',
    '/js/ui/screens.js',
    '/js/ui/hud.js',
    '/js/ui/actions.js',
    '/js/ui/map.js',
    '/js/ui/effects.js',
    '/js/ui/settings.js',
    '/js/ui/touch.js',
    '/js/main.js',
    '/js/native-bridge.js',
    '/icons/icon.svg',
    '/manifest.json'
];

// Install — cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch strategy:
//  - Navigations (index.html): network-first so players always get the
//    newest deploy, with cache fallback for offline play
//  - Everything else: cache-first for speed and offline support
self.addEventListener('fetch', event => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(response => {
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match(event.request).then(c => c || caches.match('/index.html')))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                // Cache new requests dynamically
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            });
        }).catch(() => {
            // Offline fallback
            if (event.request.mode === 'navigate') {
                return caches.match('/index.html');
            }
        })
    );
});
