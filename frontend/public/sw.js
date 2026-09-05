// Service Worker para LiquiVerde PWA
const CACHE_NAME = 'liquiverde-v1';
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_RESOURCES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones no-GET o hacia la API / docs
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/docs') ||
    url.pathname.startsWith('/openapi.json')
  ) {
    return;
  }

  // Estrategia Network First con fallback a Cache para HTML y Cache First para assets estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalidar asset estático
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Si el usuario navega sin conexión, devolver la raíz de la SPA
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
    })
  );
});
