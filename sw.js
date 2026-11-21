const CACHE_NAME = 'gallery-ttt-v3';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './x.png',
  './x.png?v=2',
  './0.png',
  './refresh.png',
  './gallery/01.AVIF',
  './gallery/02.AVIF',
  './gallery/03.AVIF',
  './gallery/04.AVIF',
  './gallery/05.AVIF',
  './gallery/06.AVIF',
  './gallery/07.AVIF',
  './gallery/08.AVIF',
  './gallery/09.AVIF',
  './gallery/10.AVIF',
  './gallery/11.AVIF',
  './gallery/12.AVIF',
  './gallery/13.AVIF',
  './gallery/14.AVIF',
  './gallery/15.AVIF',
  './gallery/16.AVIF',
  './gallery/17.AVIF',
  './gallery/18.AVIF'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Skipped asset during install:', asset, err);
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match('./index.html') || await cache.match(request);
        const networkFetch = fetch(request)
          .then(res => {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type === 'error') return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return res;
      }).catch(() => cached);
    })
  );
});
