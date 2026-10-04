// ---------------------------------------------------------------------------
// Minimal service worker for the NxtWave Growth Engine PWA.
//
// Strategy (deliberately conservative):
//  - Navigations (pages): network-first → cache fallback → offline shell.
//    Online behaviour is untouched (dev/HMR safe); cache is only a fallback.
//    Only SUCCESSFUL (2xx) navigations are cached — a cached 404/500 page must
//    never become the offline shell for a board the owner visits daily.
//  - Static icons/manifest: cache-first (immutable, versioned by filename).
//  - /api/* and everything else: network-only (data must be live).
// ---------------------------------------------------------------------------

const CACHE = "nxw-growth-v2"
const PRECACHE = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon.svg",
  "/manifest.webmanifest",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Live data — never serve from cache.
  if (url.pathname.startsWith("/api/")) return

  // Static brand assets: cache-first.
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy))
            }
            return res
          }),
      ),
    )
    return
  }

  // Page navigations: network-first, fall back to the last cached copy.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return res
        })
        .catch(() =>
          caches.match(request).then((hit) => hit ?? caches.match("/register")),
        ),
    )
  }
})
