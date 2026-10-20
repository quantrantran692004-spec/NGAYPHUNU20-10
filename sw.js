const VERSION = 'gift-pages-v39';
const CACHE = `${VERSION}-fallback`;
const ROOT_FILES = [
  './',
  './index.html',
  './config.js?v=config-text-custom-v3',
  './app.js?v=recipient-cache-bust-root-isolated-v38',
  './styles.css?v=link-only-after-save-v9'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ROOT_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  const isNavigation = request.mode === 'navigate';
  const isAppFile = /\/(?:index\.html|config\.js|app\.js|styles\.css)$/.test(url.pathname);
  if (!isNavigation && !isAppFile) return;

  event.respondWith(
    fetch(new Request(request, { cache: 'no-store' }))
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
  );
});
