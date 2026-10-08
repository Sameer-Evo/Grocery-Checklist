const CACHE_NAME = "grocery-checklist-v3";

const BASE_PATH = "/Grocery-Checklist/";

const STATIC_ASSETS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.json`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`
];


// ============================================
// INSTALL
// ============================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching application files");

        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});


// ============================================
// ACTIVATE
// ============================================

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);

              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});


// ============================================
// FETCH
// ============================================

self.addEventListener("fetch", (event) => {

  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);

  // Only handle requests from our own domain
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {

      // Return cached file if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise get it from the network
      return fetch(event.request)
        .then((networkResponse) => {

          // Don't cache invalid responses
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // Clone response before caching
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {

          // If navigation fails while offline,
          // return the main application page.
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


// ============================================
// MESSAGE
// ============================================

self.addEventListener("message", (event) => {

  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {
    self.skipWaiting();
  }

});
