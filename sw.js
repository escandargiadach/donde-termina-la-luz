// REGLA (heredada del Libro I): todo cambio a index.html, styles.css, content.js,
// app.js o nieve.js exige subir SHELL_CACHE antes de publicar.
const SHELL_CACHE = "el-ciclo-inmovil-libro2-shell-v51";
// Mismo nombre que AUDIO_CACHE en app.js ("Guardar sin conexión"). Si no
// coinciden, el activate de abajo borra los capitulos guardados. No subirlo sin
// motivo: vacia lo que cada oyente guardo.
const AUDIO_CACHE = "el-ciclo-inmovil-libro2-audio-v1";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./content.js",
  "./app.js",
  "./nieve.js",
  "./manifest.webmanifest",
  "./assets/portada/portada.webp",
  "./assets/portada/caratula-512.webp",
  "./assets/fuentes/cormorant-sc-400.woff2",
  "./assets/fuentes/cormorant-sc-500.woff2",
  "./assets/fuentes/cormorant-sc-600.woff2",
  "./assets/icons/favicon.ico",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => ![SHELL_CACHE, AUDIO_CACHE].includes(key)).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isAudio = request.destination === "audio" || /\.(mp3|m4a|ogg|wav)$/i.test(url.pathname);

  // El audio no pasa por el service worker: Safari/iOS maneja mal los Range
  // requests que atraviesan un SW (causo "audio no encontrado" en el Libro I).
  if (isAudio) return;

  event.respondWith(
    fetch(new Request(request, { cache: "no-cache" })).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(SHELL_CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
  );
});
