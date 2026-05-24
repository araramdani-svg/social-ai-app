// GrowthPILOT — Service Worker PWA
// Stratégie : Cache First pour assets statiques, Network First pour API

const CACHE_NAME    = "growthpilot-v1";
const API_ORIGIN    = "https://social-ai-app-production.up.railway.app";

// Assets à mettre en cache immédiatement
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/logo.png",
  "/manifest.json",
];

// ── Install : mise en cache des assets statiques ──────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate : nettoyage des anciens caches ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie selon le type de requête ───────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Requêtes API Railway → Network First (toujours fresh)
  if (url.origin === API_ORIGIN) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({ error: "Offline — please check your connection" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        ))
    );
    return;
  }

  // 2. Assets statiques (JS, CSS, images) → Cache First
  if (
    request.method === "GET" &&
    (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/) ||
     url.pathname === "/" ||
     url.pathname === "/index.html")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // 3. Tout le reste → Network only
  event.respondWith(fetch(request));
});

// ── Push notifications (optionnel — prêt pour le futur) ──────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "GrowthPILOT", {
      body: data.body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
