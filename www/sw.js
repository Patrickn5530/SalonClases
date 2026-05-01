// ===============================
// Service Worker - App Escolar
// ===============================

const CACHE_NAME = 'app-escolar-v2.5.1';

// Cambiamos el nombre a FILES_TO_CACHE para que coincida con la función de abajo
const FILES_TO_CACHE = [
  './',
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
  'js/desayunos.js',
  'js/historial.js',
  'js/html2pdf.bundle.min.js',
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
      // Intentamos cargar los archivos uno por uno para que no rompa todo
      return Promise.all(
        FILES_TO_CACHE.map(url => {
          return cache.add(url).catch(err => console.warn(`No se pudo cargar en caché: ${url}`, err));
        })
      );
    })
  );
  self.skipWaiting();
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