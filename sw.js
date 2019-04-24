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