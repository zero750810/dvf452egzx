const CACHE_NAME = 'magic-calculator-v1';
const urlsToCache = [
    '/vadsrgd/',
    '/vadsrgd/index.html',
    '/vadsrgd/style.css',
    '/vadsrgd/script.js',
    '/vadsrgd/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});