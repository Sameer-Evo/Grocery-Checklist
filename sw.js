const CACHE_NAME = "grocery-checklist-v2";

const BASE_PATH = "/Grocery-Checklist/";

const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`
];


// ─────────────────────────────────────────────
// INSTALL
// ─────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});


// ─────────────────────────────────────────────
// ACTIVATE
// ─────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});


// ─────────────────────────────────────────────
// FETCH
// ─────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // Only handle requests from this origin.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached resource if available.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise request it from the network.
      return fetch(event.request)
        .then((networkResponse) => {
          // Don't cache invalid responses.
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If navigation fails while offline,
          // return the cached application shell.
          if (event.request.mode === "navigate") {
            return caches.match(`${BASE_PATH}index.html`);
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable"
          });
        });
    })
  );
});


// ─────────────────────────────────────────────
// SKIP WAITING
// ─────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
