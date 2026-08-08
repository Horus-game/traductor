// Service worker mínimo.
// Objetivo principal: habilitar que el navegador ofrezca "Instalar app".
// También cachea el shell estático (HTML/manifest/íconos) para que abra
// más rápido, pero SIEMPRE intenta ir a la red primero, porque esta app
// necesita internet en tiempo real (cámara, OCR, traducción y Firebase).

const CACHE_NAME = "traductor-live-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Solo nos ocupamos de pedidos GET del propio origen (el shell).
  // Todo lo externo (Firebase, Tesseract, traducción, cámara) pasa de largo.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
