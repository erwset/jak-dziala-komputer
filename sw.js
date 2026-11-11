// PLIK GENEROWANY przez tools/build-sw.mjs. Nie edytuj recznie.
// Zapamietuje cala strone na urzadzeniu, zeby dzialala bez internetu.
const CACHE = 'jak-dziala-komputer-2ff423e844';
const FILES = [
 "./index.html",
 "./slownik.html",
 "./manifest.webmanifest",
 "./css/style.css",
 "./js/chapters/a0.js",
 "./js/chapters/a1.js",
 "./js/chapters/a2.js",
 "./js/chapters/a3.js",
 "./js/chapters/a4.js",
 "./js/chapters/b0.js",
 "./js/chapters/b1.js",
 "./js/chapters/b2.js",
 "./js/chapters/b3.js",
 "./js/chapters/c0.js",
 "./js/chapters/c1.js",
 "./js/chapters/c2.js",
 "./js/chapters/c3.js",
 "./js/chapters/q.js",
 "./js/chapters/t1.js",
 "./js/chapters/t2.js",
 "./js/chapters/t3.js",
 "./js/chapters/t4.js",
 "./js/chapters/t5.js",
 "./js/chapters/t6.js",
 "./js/chapters/t7.js",
 "./js/chapters/t8.js",
 "./js/chapters/t9.js",
 "./js/core/bits.js",
 "./js/core/chapters.js",
 "./js/core/circuit-view.js",
 "./js/core/cpu-sim.js",
 "./js/core/cpu-widget.js",
 "./js/core/glossary.js",
 "./js/core/layout.js",
 "./js/core/logic-sim.js",
 "./js/core/models3d.js",
 "./js/core/quantum.js",
 "./js/core/sand.js",
 "./js/core/scene3d.js",
 "./js/core/stepper.js",
 "./js/core/util.js",
 "./js/theme.js",
 "./chapters/a0.html",
 "./chapters/a1.html",
 "./chapters/a2.html",
 "./chapters/a3.html",
 "./chapters/a4.html",
 "./chapters/b0.html",
 "./chapters/b1.html",
 "./chapters/b2.html",
 "./chapters/b3.html",
 "./chapters/c0.html",
 "./chapters/c1.html",
 "./chapters/c2.html",
 "./chapters/c3.html",
 "./chapters/q.html",
 "./chapters/t1.html",
 "./chapters/t2.html",
 "./chapters/t3.html",
 "./chapters/t4.html",
 "./chapters/t5.html",
 "./chapters/t6.html",
 "./chapters/t7.html",
 "./chapters/t8.html",
 "./chapters/t9.html",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./icons/icon-maskable-512.png",
 "./vendor/three/build/three.core.js",
 "./vendor/three/build/three.module.js",
 "./vendor/three/examples/jsm/controls/OrbitControls.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('jak-dziala-komputer-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Najpierw kopia z urzadzenia, dopiero gdy jej nie ma, siec.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    let hit = await c.match(e.request, { ignoreSearch: true });
    if (!hit && url.pathname.endsWith('/')) hit = await c.match(url.pathname + 'index.html');
    return hit || fetch(e.request);
  }));
});
