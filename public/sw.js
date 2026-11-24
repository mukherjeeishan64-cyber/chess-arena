const CACHE_NAME = "chess-arena-v1";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Multiplayer requests must always reach the server.
  if (url.pathname.startsWith("/socket.io/") ||
      url.pathname.startsWith("/api/")) return;
});
