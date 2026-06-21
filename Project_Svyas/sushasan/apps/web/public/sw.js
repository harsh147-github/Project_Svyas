// Sushaasan service worker — minimal, network-first.
// Purpose: make the site an installable PWA and speed up repeat loads of the
// app shell. We never want to serve stale civic data, so API + map tiles always
// go to the network; only the static shell is cached as a fallback.
const CACHE = 'sushaasan-shell-v1'
const SHELL = ['/', '/add-report', '/dashboard', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Never cache API responses or cross-origin (map tiles, fonts, analytics) —
  // always fresh from the network.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  // Navigations: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/') || caches.match('/offline'))),
    )
    return
  }

  // Static assets: cache-first for speed, revalidate in background.
  if (/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?|geojson|ico)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        }).catch(() => cached)
        return cached || network
      }),
    )
  }
})
