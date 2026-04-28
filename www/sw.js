// ===============================
// Service Worker - App Escolar
// ===============================

// Nota: versión bumpada para forzar instalación inicial limpia
const CACHE_NAME = 'app-escolar-v2.5.0';
const RUNTIME = 'runtime-cache-2.5.0';

const PRECACHE_URLS = [
  'index.html',
  'colectas.html',
  'configurar.html',
  'desayunos.html',
  'historial.html',

  // CSS
  'css/styles.css',
  'css/bootstrap.min.css',
  'css/fontawesome-all.min.css',
  'css/sweetalert2.min.css',
  'css/introjs.min.css',

  // JS
  'js/configurar.js',
  'js/colectas.js',
  'js/desayunos.js',
  'js/historial.js',
  'js/localforage.min.js',
  'js/sweetalert2.min.js',
  'js/intro.min.js',
  'js/bootstrap.bundle.min.js',

  // Fonts
  'fonts/fa-solid-900.woff2',
  'fonts/fa-regular-400.woff2',
  'fonts/fa-brands-400.woff2',

  // Imágenes
  'img/logoEdoMex2.jpg',
  'img/logoEncabezado1.png'
];

// ===============================
// Instalación: guarda archivos en cache
// ===============================
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // 🔹 activa inmediatamente
});

// ===============================
// Activación: limpia versiones viejas del cache
// ===============================
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ===============================
// Fetch: responde desde cache o red
// ===============================
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
