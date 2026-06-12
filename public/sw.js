// Cache strategy: network-first for navigations (so a deploy's new
// index.html — and the hashed asset URLs it references — is picked up on
// the next load, with the cached copy as the offline fallback), and
// stale-while-revalidate for other same-origin GETs (hashed assets are
// immutable, so serving stale is always safe there).
const CACHE = 'danae-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Same-origin shell/assets only — YouTube API responses must stay fresh
  // and cross-origin media shouldn't be cached here.
  if (url.origin !== location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        try {
          const response = await fetch(request)
          if (response.ok) cache.put(request, response.clone())
          return response
        } catch {
          const cached = await cache.match(request)
          return cached ?? Response.error()
        }
      })
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached ?? Response.error())
      return cached || network
    })
  )
})
