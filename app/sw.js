const CACHE_NAME = "pickleball-round-robin-v41";
const LADDER_URL = "https://wdcpickleball.com/app/ladder";
const LADDER_CACHE_NAME = "pickleball-round-robin-ladder-v1";
const APP_SHELL = [
  "./",
  "index.html",
  "styles.css",
  "grouping.js",
  "app.js",
  "players.txt",
  "manifest.webmanifest",
  "icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url === LADDER_URL) {
    event.respondWith(fetchAndCacheLadder(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

async function fetchAndCacheLadder(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(LADDER_CACHE_NAME);
    await cache.put(LADDER_URL, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(LADDER_URL);
    if (cached) return cached;
    throw error;
  }
}
