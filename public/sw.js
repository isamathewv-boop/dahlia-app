/*
 * Offline support.
 *
 * A daily tracker that will not open without signal is useless, so the app
 * shell is cached on first visit and served from cache when the network is
 * gone. No user data passes through here — the logs live in localStorage and
 * are never fetched over the network.
 *
 * Bump CACHE when the strategy changes; old caches are dropped on activate.
 */
const CACHE = 'dahlia-v1'

self.addEventListener('install', (event) => {
  // Take over as soon as possible rather than waiting for every tab to close.
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('./')))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML: network first, so a redeploy is picked up while online, with the
  // cached shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('./', copy))
          return response
        })
        .catch(() =>
          caches.match('./').then((cached) => cached ?? caches.match(request)),
        ),
    )
    return
  }

  // Build assets carry a content hash in their filename, so once cached they
  // are safe to serve straight from cache.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
