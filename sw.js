/* Payloader — Service Worker (offline cache) */

const CACHE   = 'payloader-v5';
const PRECACHE = [
  '/',
  '/index.html',
  '/payloads.html',
  '/modules.html',
  '/module.html',
  '/generator.html',
  '/attack-gen.html',
  '/search.html',
  '/encoder.html',
  '/lab.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/payloads.js',
  '/js/module.js',
  '/js/generator.js',
  '/js/attack-gen.js',
  '/js/search.js',
  '/js/lab.js',
  '/data/payloads.json',
  '/data/sqli.json',
  '/data/cmdi.json',
  '/data/ssti.json',
  '/data/traversal.json',
  '/data/xxe.json',
  '/data/ssrf.json',
  '/data/redirect.json',
  '/data/revshells.json',
  '/data/php.json',
  '/data/jwt.json',
  '/data/csrf.json',
  '/data/proto.json',
  '/data/deserial.json',
  '/data/smuggling.json',
  '/data/crlf.json',
  '/data/idor.json',
  '/data/nosql.json',
  '/data/graphql.json',
  '/data/oauth.json',
  '/data/racecond.json',
  '/data/websocket.json',
  '/js/module-info.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
