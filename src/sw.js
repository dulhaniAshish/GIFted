self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open('v1').then(function(cache) {
            return cache.addAll([
                '/GIFted/',
                '/GIFted/index.html',
                '/GIFted/styles.css',
                '/GIFted/src/script.js',
                '/GIFted/src/utils.js',
                '/GIFted/src/config.js',
                '/GIFted/src/network.js',
            ]);
        })
    );
});


self.addEventListener('activate', (event) => {
    console.info('Event: Activate');
    event.waitUntil(
        self.clients.claim(),
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== 'v1') {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
        if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
        caches.match(event.request).then(function (resp) {
            return resp || fetch(event.request).then(function (response) {
                return caches.open('v1').then(function (cache) {
                    cache.put(event.request, response.clone());
                    return response;
                });
            });
        })
    }
);