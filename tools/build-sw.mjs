// Buduje sw.js: liste wszystkich plikow strony do zapamietania na urzadzeniu (tryb bez internetu).
// Uruchom po kazdej zmianie przed publikacja:  npm run build-sw
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WANT = ['index.html', 'slownik.html', 'manifest.webmanifest', 'css', 'js', 'chapters', 'icons', 'vendor'];
const SKIP = /(^|\/)LICENSE$/;

const files = [];
const walk = rel => {
  const full = path.join(root, rel);
  if (fs.statSync(full).isDirectory()) fs.readdirSync(full).sort().forEach(n => walk(rel + '/' + n));
  else if (!SKIP.test(rel)) files.push(rel);
};
WANT.forEach(walk);

const hash = crypto.createHash('sha1');
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(root, f)));
const version = hash.digest('hex').slice(0, 10);

const sw = `// PLIK GENEROWANY przez tools/build-sw.mjs. Nie edytuj recznie.
// Zapamietuje cala strone na urzadzeniu, zeby dzialala bez internetu.
const CACHE = 'jak-dziala-komputer-${version}';
const FILES = ${JSON.stringify(files.map(f => './' + f), null, 1)};

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
`;
fs.writeFileSync(path.join(root, 'sw.js'), sw);
console.log(`sw.js: ${files.length} plikow, wersja ${version}`);
