// Stamps a unique build version into sw.js so browsers detect updates
const fs = require("fs");
const path = require("path");

const version = `mark-pt-${Date.now()}`;
const swPath = path.join(__dirname, "public", "sw.js");

const sw = `const CACHE_NAME = "${version}";

self.addEventListener("install", () => {
  // Don't skipWaiting automatically — wait for user to accept the update
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 })))
  );
});
`;

fs.writeFileSync(swPath, sw, "utf-8");
console.log(`SW stamped: ${version}`);
