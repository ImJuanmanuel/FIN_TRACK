const CACHE_NAME = 'finanzas-personales-v3'
const APP_SHELL = [
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL)
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        )
      })
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          client.navigate(client.url)
        })
      }),
  )
})

function fetchAndCache(request) {
  return fetch(request).then((networkResponse) => {
    if (
      networkResponse.ok &&
      new URL(request.url).origin === self.location.origin
    ) {
      const responseToCache = networkResponse.clone()
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseToCache)
      })
    }

    return networkResponse
  })
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetchAndCache(event.request).catch(() => {
        return caches
          .match('/index.html')
          .then((response) => response || Response.error())
      }),
    )
    return
  }

  const requestUrl = new URL(event.request.url)
  if (
    requestUrl.origin === self.location.origin &&
    (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html')
  ) {
    event.respondWith(fetchAndCache(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetchAndCache(event.request).catch(() => Response.error())
    }),
  )
})
