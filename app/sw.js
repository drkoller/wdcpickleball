const CACHE_NAME = "pickleball-round-robin-v46";
const LADDER_URL = "https://wdcpickleball.com/app/ladder";
const LADDER_CACHE_NAME = "pickleball-round-robin-ladder-v1";
// Release hashes keep a stale or partly deployed shell from becoming active.
// Update these hashes with the cache version whenever an app-shell file changes.
const APP_SHELL = {
  "index.html": "sha256-R+CvU2x0MIrB8D3AvneauPlMWnW1us5C5K3waYYi6tA=",
  "styles.css": "sha256-S36xjlYUom93YK0wfsZX8W1RG62vmNBOtDp5UXEjzLY=",
  "grouping.js": "sha256-LeNafGY6AyRH+y5taSt+ETR7F51naRH3SOWaxfzkOVU=",
  "app.js": "sha256-yoBjEbk2DI5/e1g4eHddjJ6mJbS/0d6vdtZu5lYL53g=",
  "players.txt": "sha256-3xbzwdtEC9b2tbN3Q6xrnBXRV3m7uKHh6wqhMong1Uw=",
  "manifest.webmanifest": "sha256-Pjdd7SkWExmeZoEQxaRL+1XTtoZjZ2QpWiGGN8y5qjk=",
  "icon.svg": "sha256-UUWoqIFaATKslXVU6RKf8YFhpwWWe1akekGOra13NvA="
};

async function fetchShellAsset(name) {
  const url = new URL(name, self.registration.scope);
  url.searchParams.set("dcpl-shell", CACHE_NAME);
  const response = await fetch(url, {
    cache: "no-store",
    credentials: "same-origin",
    integrity: APP_SHELL[name]
  });
  if (!response.ok) throw new Error(`App-shell download failed: ${name}`);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      // Download and verify the whole release before writing its cache.
      const entries = await Promise.all(Object.keys(APP_SHELL).map(async (name) =>
        [new URL(name, self.registration.scope).href, await fetchShellAsset(name)]
      ));
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(entries.map(([url, response]) => cache.put(url, response)));
      await self.skipWaiting();
    } catch (error) {
      // Leave the active worker and its complete cache available for retry.
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) =>
      /^pickleball-round-robin-v\d+$/.test(key) && key !== CACHE_NAME
    ).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url === LADDER_URL) {
    event.respondWith(fetchAndCacheLadder(event.request));
    return;
  }

  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const name = url.pathname.slice(scope.pathname.length) || "index.html";
  if (!Object.prototype.hasOwnProperty.call(APP_SHELL, name)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(new URL(name, scope).href) || fetchShellAsset(name);
  })());
});

async function fetchAndCacheLadder(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(LADDER_CACHE_NAME);
    await cache.put(LADDER_URL, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(LADDER_CACHE_NAME);
    const cached = await cache.match(LADDER_URL);
    if (cached) return cached;
    throw error;
  }
}
