// Sushaasan service worker — minimal, network-first.
// Purpose: make the site an installable PWA and speed up repeat loads of the
// app shell. We never want to serve stale civic data, so API + map tiles always
// go to the network; only the static shell is cached as a fallback.
// Bumped to v2 to evict any previously cached /gov?token=... navigations
// from installs running the old service worker.
const CACHE = 'sushaasan-shell-v2'
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

  // Never persist a URL carrying a gov/admin access token — /gov?token=...
  // links are exactly the kind of thing that end up on a shared/borrowed
  // device, and the Cache API is regular persistent storage: anything put in
  // it survives long after the tab closes and is readable by anyone with
  // access to that device's browser storage.
  const hasToken = url.searchParams.has('token')

  // Navigations: network-first, fall back to cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (!hasToken) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => (hasToken ? fetch(req) : caches.match(req).then((r) => r || caches.match('/') || caches.match('/offline')))),
    )
    return
  }

  // GeoJSON: network-first with a 24h-capped cache fallback, not cache-first
  // — these files can change (ward boundary corrections) and used to be
  // cached forever with no expiry.
  if (/\.geojson$/.test(url.pathname)) {
    const GEOJSON_MAX_AGE_MS = 24 * 60 * 60 * 1000
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(() =>
          caches.match(req).then((cached) => {
            if (!cached) return caches.match(req)
            const cachedAt = Date.parse(cached.headers.get('date') || '')
            if (Number.isFinite(cachedAt) && Date.now() - cachedAt > GEOJSON_MAX_AGE_MS) return fetch(req)
            return cached
          }),
        ),
    )
    return
  }

  // Static assets: cache-first for speed, revalidate in background.
  if (/\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?|ico)$/.test(url.pathname)) {
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
