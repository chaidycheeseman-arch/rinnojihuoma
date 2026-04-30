const CACHE_NAME = 'rinno-public-shell-v20260430-issuer-only-1';
const PRECACHE_URLS = [
    './',
    'index.html',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'icon-192-v20260428-app-refresh-1.png',
    'icon-512-v20260428-app-refresh-1.png',
    'style.css?v=20260430-issuer-only-1',
    'script.js?v=20260430-issuer-only-1',
    'vendor/dexie.js',
    'vendor/jszip.min.js'
];

async function warmPrecache() {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(
        PRECACHE_URLS.map(async url => {
            try {
                await cache.add(url);
            } catch (error) {
                console.warn('[Rinno SW] precache skipped:', url, error);
            }
        })
    );
}

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        await warmPrecache();
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
        );
        await self.clients.claim();
    })());
});

function canHandleRequest(request) {
    if (!request || request.method !== 'GET') return false;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    if (url.pathname.startsWith('/.netlify/functions/')) return false;
    return true;
}

function isManifestOrAppIconRequest(request) {
    if (!request) return false;
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\//, '');
    return pathname === 'manifest.json'
        || pathname === 'icon-192.png'
        || pathname === 'icon-512.png'
        || pathname === 'icon-192-v20260428-app-refresh-1.png'
        || pathname === 'icon-512-v20260428-app-refresh-1.png';
}

async function cacheResponse(cache, request, response) {
    if (!response || (!response.ok && response.type !== 'opaque')) return response;
    await cache.put(request, response.clone());
    return response;
}

async function handleNavigation(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        await cacheResponse(cache, request, response);
        return response;
    } catch (error) {
        return (
            await cache.match(request)
            || await cache.match('index.html')
            || await cache.match('./')
            || Response.error()
        );
    }
}

async function handleAsset(event) {
    const { request } = event;
    const cache = await caches.open(CACHE_NAME);

    if (isManifestOrAppIconRequest(request)) {
        try {
            const response = await fetch(request, { cache: 'no-store' });
            return await cacheResponse(cache, request, response);
        } catch (error) {
            return await cache.match(request) || Response.error();
        }
    }

    const cached = await cache.match(request);
    const networkPromise = fetch(request)
        .then(response => cacheResponse(cache, request, response))
        .catch(() => null);

    if (cached) {
        event.waitUntil(networkPromise);
        return cached;
    }

    const network = await networkPromise;
    if (network) return network;

    if (request.destination === 'document') {
        return (
            await cache.match('index.html')
            || await cache.match('./')
            || Response.error()
        );
    }

    return Response.error();
}

self.addEventListener('fetch', event => {
    if (!canHandleRequest(event.request)) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigation(event.request));
        return;
    }

    event.respondWith(handleAsset(event));
});
